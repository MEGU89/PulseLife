import Donation from "../models/Donation.js";
import DonationSchedule from "../models/DonationSchedule.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import {
  DONATION_COOLDOWN_DAYS,
  addDays,
  buildDonationPerks,
  getAnnualDonationSummary,
  synchronizePerkStatuses,
} from "./donorBenefits.js";
import { sendEmail } from "./email.js";
import { findRequestHospitalUser } from "./requestHospital.js";
import { parseScheduleDate } from "./scheduleDate.js";

function buildHospitalLocationHtml(hospital) {
  if (!hospital?.location) {
    return "";
  }

  return `
    <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #4A90E2;">
      <p><strong>Hospital Details:</strong></p>
      ${hospital.address ? `<p><strong>Address:</strong> ${hospital.address}</p>` : ""}
      ${hospital.phone ? `<p><strong>Phone:</strong> ${hospital.phone}</p>` : ""}
      ${
        hospital.location.latitude && hospital.location.longitude
          ? `
        <p><strong>Coordinates:</strong> ${hospital.location.latitude.toFixed(4)}, ${hospital.location.longitude.toFixed(4)}</p>
        <p><a href="https://maps.google.com/?q=${hospital.location.latitude},${hospital.location.longitude}" style="color: #4A90E2; text-decoration: none;">
          View on Google Maps
        </a></p>
      `
          : ""
      }
    </div>
  `;
}

export async function completeDonationSchedule(scheduleId, io) {
  const schedule = await DonationSchedule.findById(scheduleId).populate("requestId");
  if (!schedule) {
    const error = new Error("Schedule not found");
    error.statusCode = 404;
    throw error;
  }

  if (schedule.status === "rejected" || schedule.hospitalResponse === "rejected") {
    const error = new Error("Rejected schedules cannot be marked as completed");
    error.statusCode = 409;
    throw error;
  }

  const request =
    schedule.requestId && typeof schedule.requestId === "object" && "_id" in schedule.requestId
      ? schedule.requestId
      : await Request.findById(schedule.requestId);

  if (!request) {
    const error = new Error("Associated request not found");
    error.statusCode = 404;
    throw error;
  }

  const donor = await User.findById(schedule.donorId);
  const hospitalUser = await findRequestHospitalUser(request);

  const existingDonation = await Donation.findOne({ scheduleId: schedule._id });
  if (schedule.status === "completed" && existingDonation) {
    return {
      schedule,
      request,
      donor,
      donation: existingDonation,
      donationDate: existingDonation.date,
      alreadyCompleted: true,
    };
  }

  if (schedule.status !== "accepted") {
    const error = new Error("Schedule must be accepted before it can be completed");
    error.statusCode = 409;
    throw error;
  }

  const scheduledAt = parseScheduleDate(schedule.date, schedule.time || "00:00");
  if (scheduledAt && Date.now() < scheduledAt.getTime()) {
    const error = new Error("Donation can only be completed after the scheduled time");
    error.statusCode = 409;
    throw error;
  }

  if (schedule.hospitalResponse !== "accepted") {
    schedule.hospitalResponse = "accepted";
  }

  schedule.status = "completed";
  await schedule.save();

  const donationDate = existingDonation?.date || new Date();

  const donation = await Donation.findOneAndUpdate(
    { scheduleId: schedule._id },
    {
      donorId: schedule.donorId,
      scheduleId: schedule._id,
      hospital: request.hospital || "Unknown Hospital",
      units: request.unitsNeeded || 1,
      date: donationDate,
      status: "Completed",
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  if (donor) {
    if (!Array.isArray(donor.perks)) donor.perks = [];
    synchronizePerkStatuses(donor, donationDate);

    donor.totalDonations = await Donation.countDocuments({ donorId: schedule.donorId });
    const donorDonations = await Donation.find({ donorId: schedule.donorId }, "date").lean();
    const annualSummary = getAnnualDonationSummary(donorDonations, donor.gender, donationDate);
    const alreadyRewarded = donor.perks.some((perk) => String(perk.scheduleId || "") === String(schedule._id));

    if (!alreadyRewarded) {
      const newPerks = buildDonationPerks({
        completedAt: donationDate,
        scheduleId: schedule._id,
        annualDonationCount: annualSummary.annualDonationCount,
      }).filter((perk) => {
        if (!perk.tierKey) {
          return true;
        }

        return !donor.perks.some(
          (existingPerk) =>
            existingPerk.tierKey === perk.tierKey &&
            Number(existingPerk.awardYear || 0) === Number(perk.awardYear || 0)
        );
      });

      donor.perks.push(...newPerks);
    }

    donor.donationsThisYear = annualSummary.annualDonationCount;
    donor.nextEligibleDonationDate = addDays(donationDate, DONATION_COOLDOWN_DAYS);
    donor.lastHealthCheckupDate = donationDate;
    await donor.save();
  }

  request.status = "Fulfilled";
  request.confirmationStatus = "Confirmed";
  request.confirmedBy = hospitalUser?._id || request.confirmedBy || null;
  await request.save();

  const hospitalLocationHtml = buildHospitalLocationHtml(hospitalUser);
  const completionEmails = [];

  if (donor?.email) {
    completionEmails.push(
      sendEmail(
        donor.email,
        "Donation Completed Successfully",
        `
        <h2>Donation Completed Successfully</h2>
        <p>Hello <b>${donor.fullName}</b>,</p>
        <p>Your blood donation has been marked as successfully completed by <b>${request.hospital}</b>.</p>
        <ul>
          <li><b>Date:</b> ${schedule.date || "Not set"}</li>
          <li><b>Time:</b> ${schedule.time || "Not set"}</li>
          <li><b>Hospital:</b> ${request.hospital || "Unknown Hospital"}</li>
          <li><b>Units helped:</b> ${request.unitsNeeded || 1}</li>
        </ul>
        ${hospitalLocationHtml}
        <p>Thank you for helping save lives through Pulselife.</p>
        `
      )
    );
  }

  if (hospitalUser?.email) {
    completionEmails.push(
      sendEmail(
        hospitalUser.email,
        "Donation Completion Confirmed",
        `
        <h2>Donation Successfully Completed</h2>
        <p>Hello <b>${hospitalUser.fullName}</b>,</p>
        <p>The scheduled donor visit has been marked as completed successfully.</p>
        <ul>
          <li><b>Donor:</b> ${donor?.fullName || "Donor"}</li>
          <li><b>Date:</b> ${schedule.date || "Not set"}</li>
          <li><b>Time:</b> ${schedule.time || "Not set"}</li>
          <li><b>Blood type:</b> ${request.bloodType || "Not specified"}</li>
          <li><b>Units completed:</b> ${request.unitsNeeded || 1}</li>
        </ul>
        <p>The hospital and donor statistics have been updated for this completed donation.</p>
        `
      )
    );
  }

  if (request.isRecipientRequest && request.requestedBy) {
    const recipientUser = await User.findById(request.requestedBy, "email fullName role");
    if (recipientUser?.role === "recipient" && recipientUser.email) {
      completionEmails.push(
        sendEmail(
          recipientUser.email,
          "Hospital Completed Your Blood Request",
          `
          <h2>Request completed by hospital</h2>
          <p>Hello <b>${recipientUser.fullName || "Recipient"}</b>,</p>
          <p>
            Your blood request has been marked as completed by <b>${hospitalUser?.fullName || request.hospital || "the hospital"}</b>.
          </p>
          <ul>
            <li><b>Hospital:</b> ${hospitalUser?.fullName || request.hospital || "Unknown hospital"}</li>
            <li><b>Blood type:</b> ${request.bloodType || "Not specified"}</li>
            <li><b>Units completed:</b> ${request.unitsNeeded || 1}</li>
            <li><b>Date:</b> ${schedule.date || "Not set"}</li>
            <li><b>Time:</b> ${schedule.time || "Not set"}</li>
          </ul>
          <p>The hospital handled the donation workflow and closed this request successfully.</p>
          `,
        ),
      );
    }
  }

  if (completionEmails.length > 0) {
    const emailResults = await Promise.allSettled(completionEmails);
    emailResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Failed to send donation completion email:", result.reason);
      }
    });
  }

  if (io) {
    io.to(String(schedule.donorId)).emit("schedule_status_updated", {
      scheduleId: schedule._id,
      status: "completed",
    });

    if (hospitalUser?._id) {
      io.to(hospitalUser._id.toString()).emit("schedule_status_updated", {
        scheduleId: schedule._id,
        status: "completed",
      });
    }

    io.emit("request_fulfilled", {
      requestId: request._id,
      status: "Fulfilled",
      confirmationStatus: "Confirmed",
      confirmedBy: request.confirmedBy,
      donorId: schedule.donorId,
      bloodType: request.bloodType,
      unitsNeeded: request.unitsNeeded,
      hospital: request.hospital,
    });

    io.emit("donation_completed", {
      scheduleId: schedule._id,
      requestId: request._id,
      donorId: schedule.donorId,
      hospitalId: hospitalUser?._id || null,
      confirmationStatus: "Confirmed",
      status: "Fulfilled",
      completedAt: donationDate,
    });
  }

  return { schedule, request, donor, donation, donationDate, alreadyCompleted: false };
}
