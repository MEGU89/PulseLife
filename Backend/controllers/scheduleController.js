import Donation from "../models/Donation.js";
import Request from "../models/Request.js";
import DonationSchedule from "../models/DonationSchedule.js";
import User from "../models/User.js";
import {
  DONATION_COOLDOWN_DAYS,
  getAnnualDonationSummary,
} from "../utils/donorBenefits.js";
import { sendEmail } from "../utils/email.js";
import { completeDonationSchedule } from "../utils/completeDonation.js";
import { findRequestHospitalUser } from "../utils/requestHospital.js";
import { formatDateInputValue, parseScheduleDate } from "../utils/scheduleDate.js";

function sendScheduleEmailsInBackground(tasks) {
  void Promise.allSettled(tasks.map((task) => task())).catch((error) => {
    console.error("[scheduleDonation] Email dispatch error:", error);
  });
}

/* ---------------------------------------------
   1️⃣ DONOR CREATES DONATION SCHEDULE
----------------------------------------------*/
export const scheduleDonation = async (req, res) => {
  try {
    const { donorId, requestId, donorLocation, contact, date, time, notes, medicalEligibility } = req.body;

    if (!donorId || !requestId || !donorLocation || !contact || !date || !time || !medicalEligibility) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const age = Number(medicalEligibility.age);
    const weightKg = Number(medicalEligibility.weightKg);
    const hasRecentFeverOrInfection = medicalEligibility.hasRecentFeverOrInfection === true;

    if (Number.isNaN(age) || Number.isNaN(weightKg)) {
      return res.status(400).json({ success: false, message: "Medical eligibility details are required." });
    }

    if (age < 18 || age > 65) {
      return res.status(400).json({ success: false, message: "Donor age must be between 18 and 65 years." });
    }

    if (weightKg < 50) {
      return res.status(400).json({ success: false, message: "Donor weight must be at least 50 kg." });
    }

    if (hasRecentFeverOrInfection) {
      return res.status(400).json({ success: false, message: "Donors with a recent fever or infection cannot schedule a donation yet." });
    }

    const donor = await User.findById(donorId);
    if (!donor) return res.status(404).json({ success: false, message: "Donor not found" });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    if (request.requestType !== "blood") {
      return res.status(409).json({
        success: false,
        message: "Only blood requests can be matched with donor donation schedules.",
      });
    }

    if (request.isRecipientRequest) {
      return res.status(409).json({
        success: false,
        message: "Recipient requests are handled only by the selected hospital and cannot be scheduled by donors.",
      });
    }

    if (request.status !== "Pending" || request.confirmationStatus === "Confirmed" || request.confirmedBy) {
      return res.status(409).json({ success: false, message: "This request has already been matched with a donor." });
    }

    const requestedScheduleDate = parseScheduleDate(date, time);
    if (!requestedScheduleDate) {
      return res.status(400).json({ success: false, message: "Invalid schedule date or time" });
    }

    const priorDonations = await Donation.find({ donorId })
      .select("date")
      .lean();

    const latestConfirmedDonation = priorDonations
      .map((donation) => ({
        ...donation,
        parsedDate: donation.date ? new Date(donation.date) : null,
      }))
      .filter((donation) => donation.parsedDate && !Number.isNaN(donation.parsedDate.getTime()))
      .sort((left, right) => right.parsedDate - left.parsedDate)[0] || null;

    const latestConfirmedDate = latestConfirmedDonation?.parsedDate || null;

    if (latestConfirmedDate) {
      const nextEligibleDate = new Date(latestConfirmedDate);
      nextEligibleDate.setUTCDate(nextEligibleDate.getUTCDate() + DONATION_COOLDOWN_DAYS);

      if (requestedScheduleDate < nextEligibleDate) {
        const nextEligibleDateValue = formatDateInputValue(nextEligibleDate);

        return res.status(409).json({
          success: false,
          message: `You can schedule your next donation after ${nextEligibleDateValue}.`,
          cooldownDays: DONATION_COOLDOWN_DAYS,
          nextEligibleDate: nextEligibleDateValue,
          lastDonation: latestConfirmedDonation,
        });
      }
    }

    const annualSummary = getAnnualDonationSummary(priorDonations, donor.gender, requestedScheduleDate);
    if (annualSummary.annualDonationCount >= annualSummary.annualDonationLimit) {
      return res.status(409).json({
        success: false,
        message: `You have reached the yearly donation limit of ${annualSummary.annualDonationLimit}.`,
        annualDonationCount: annualSummary.annualDonationCount,
        annualDonationLimit: annualSummary.annualDonationLimit,
        annualDonationRemaining: annualSummary.annualDonationRemaining,
        nextAnnualEligibleDate: formatDateInputValue(annualSummary.nextAnnualEligibleDate),
      });
    }

    const schedule = await DonationSchedule.create({
      donorId,
      requestId,
      donorLocation,
      contact,
      date,
      time,
      notes,
      medicalEligibility: {
        age,
        weightKg,
        hasRecentFeverOrInfection,
      },
      status: "pending",
      hospitalResponse: "none"
    });

    const hospitalUser = await User.findOne({ fullName: request.hospital });

    // Format donor location HTML
    const donorLocationHtml = donor && donor.location ? `
      <div style="background-color: #fff5f5; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #FF6B6B;">
        <p><strong>🩸 Donor Location:</strong></p>
        ${donor.address ? `<p><strong>Address:</strong> ${donor.address}</p>` : ""}
        ${donor.location.latitude && donor.location.longitude ? `
          <p><strong>Coordinates:</strong> ${donor.location.latitude.toFixed(4)}, ${donor.location.longitude.toFixed(4)}</p>
          <p><a href="https://maps.google.com/?q=${donor.location.latitude},${donor.location.longitude}" style="color: #FF6B6B; text-decoration: none;">
            📍 View on Google Maps
          </a></p>
        ` : ""}
      </div>
    ` : "";

    // Format hospital location HTML
    const hospitalLocationHtml = hospitalUser && hospitalUser.location ? `
      <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #4A90E2;">
        <p><strong>🏥 Hospital Location:</strong></p>
        ${hospitalUser.address ? `<p><strong>Address:</strong> ${hospitalUser.address}</p>` : ""}
        ${hospitalUser.phone ? `<p><strong>Phone:</strong> ${hospitalUser.phone}</p>` : ""}
        ${hospitalUser.location.latitude && hospitalUser.location.longitude ? `
          <p><strong>Coordinates:</strong> ${hospitalUser.location.latitude.toFixed(4)}, ${hospitalUser.location.longitude.toFixed(4)}</p>
          <p><a href="https://maps.google.com/?q=${hospitalUser.location.latitude},${hospitalUser.location.longitude}" style="color: #4A90E2; text-decoration: none;">
            📍 View on Google Maps
          </a></p>
        ` : ""}
      </div>
    ` : "";

    // SOCKET NOTIFICATION
    const io = req.app.locals.io;
    if (io && hospitalUser) {
      io.to(hospitalUser._id.toString()).emit("new_schedule", {
        scheduleId: schedule._id,
        donorName: donor.fullName,
        date,
        time,
        contact,
      });
    }

    sendScheduleEmailsInBackground([
      () =>
        sendEmail(
          donor.email,
          "Blood Donation Schedule Confirmation",
          `
          <h2>❤️ Donation Successfully Scheduled</h2>
          <p>Hello <b>${donor.fullName}</b>,</p>
          <p>Your donation schedule:</p>
          <ul>
            <li><b>Date:</b> ${date}</li>
            <li><b>Time:</b> ${time}</li>
            <li><b>Hospital:</b> ${request.hospital}</li>
            <li><b>Contact:</b> ${contact}</li>
          </ul>
          
          ${donorLocationHtml}
          ${hospitalLocationHtml}
          
          <p>Please arrive 10-15 minutes early. Thank you for saving lives! 🦸‍♂️</p>
          `,
        ),
      ...(hospitalUser
        ? [
            () =>
              sendEmail(
                hospitalUser.email,
                "New Donor Scheduled a Donation",
                `
                <h2>🩸 New Donation Schedule</h2>
                <p>A donor has offered to donate blood.</p>
                <ul>
                  <li>Donor: <b>${donor.fullName}</b></li>
                  <li>Date: <b>${date}</b></li>
                  <li>Time: <b>${time}</b></li>
                  <li>Contact: <b>${contact}</b></li>
                  <li>Blood Type: <b>${request.bloodType}</b></li>
                  <li>Units Needed: <b>${request.unitsNeeded}</b></li>
                </ul>
                
                ${donorLocationHtml}
                ${hospitalLocationHtml}
                
                <p>Please confirm or reject this schedule from your dashboard.</p>
                `,
              ),
          ]
        : []),
    ]);

    return res.json({ success: true, schedule });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* ---------------------------------------------
   2️⃣ HOSPITAL ACCEPT / REJECT SCHEDULE
----------------------------------------------*/
export const updateScheduleStatus = async (req, res) => {
  try {
    const { scheduleId, action } = req.body; 

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Action must be accepted or rejected" });
    }

    const schedule = await DonationSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    schedule.hospitalResponse = action;
    schedule.status = action === "accepted" ? "accepted" : "rejected";
    await schedule.save();

    // Fetch donor and request for location info
    const donor = await User.findById(schedule.donorId);
    const request = await Request.findById(schedule.requestId);
    const hospital = await findRequestHospitalUser(request);

    if (action === "accepted" && request && hospital) {
      request.confirmationStatus = "Confirmed";
      request.confirmedBy = hospital._id;
      await request.save();
    }

    // Format hospital location HTML
    const hospitalLocationHtml = hospital && hospital.location ? `
      <div style="background-color: #f0f8ff; padding: 12px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #4A90E2;">
        <p><strong>🏥 Hospital Location:</strong></p>
        ${hospital.address ? `<p><strong>Address:</strong> ${hospital.address}</p>` : ""}
        ${hospital.phone ? `<p><strong>Phone:</strong> ${hospital.phone}</p>` : ""}
        ${hospital.location.latitude && hospital.location.longitude ? `
          <p><strong>Coordinates:</strong> ${hospital.location.latitude.toFixed(4)}, ${hospital.location.longitude.toFixed(4)}</p>
          <p><a href="https://maps.google.com/?q=${hospital.location.latitude},${hospital.location.longitude}" style="color: #4A90E2; text-decoration: none;">
            📍 View on Google Maps
          </a></p>
        ` : ""}
      </div>
    ` : "";

    /* -------------------------
       🔴 SOCKET TO DONOR ONLY
    -------------------------- */
    const io = req.app.locals.io;
    if (io) {
      io.to(schedule.donorId.toString()).emit("schedule_status_updated", {
        scheduleId,
        status: schedule.status,
      });
    }

    const recipientUser =
      action === "accepted" && request?.isRecipientRequest && request.requestedBy
        ? await User.findById(request.requestedBy, "email fullName role")
        : null;

    const emailContent =
      action === "accepted"
        ? `
          <h2>✅ Donation Schedule Accepted</h2>
          <p>Great news! The hospital has accepted your donation schedule.</p>
          <p>Your donation details:</p>
          <ul>
            <li><b>Date:</b> ${schedule.date}</li>
            <li><b>Time:</b> ${schedule.time}</li>
            <li><b>Hospital:</b> ${request.hospital}</li>
          </ul>
          ${hospitalLocationHtml}
          <p>Please arrive 10-15 minutes early. Thank you for your contribution! 🦸‍♂️</p>
        `
        : `
          <h2>❌ Donation Schedule Rejected</h2>
          <p>Unfortunately, the hospital has rejected your donation schedule.</p>
          <p>Please try scheduling another time or contact the hospital directly.</p>
          ${hospitalLocationHtml}
        `;

    const emailTasks = [
      () =>
        sendEmail(
          donor.email,
          `Donation Schedule ${action === "accepted" ? "Accepted" : "Rejected"}`,
          emailContent,
        ),
    ];

    if (recipientUser?.role === "recipient" && recipientUser.email && hospital) {
      emailTasks.push(() =>
        sendEmail(
          recipientUser.email,
          "Hospital Confirmed Your Blood Request",
          `
          <h2>Hospital confirmed your request</h2>
          <p>Hello <b>${recipientUser.fullName || "Recipient"}</b>,</p>
          <p>
            <b>${hospital.fullName}</b> accepted a donor schedule for your blood request.
            The hospital will continue managing the donation process from their side.
          </p>
          <ul>
            <li><b>Hospital:</b> ${hospital.fullName}</li>
            <li><b>Blood type:</b> ${request.bloodType || "Not specified"}</li>
            <li><b>Units needed:</b> ${request.unitsNeeded || 1}</li>
            <li><b>Status:</b> Confirmed</li>
          </ul>
          <p>You can track this request from your recipient dashboard.</p>
          `,
        ),
      );
    }

    void Promise.allSettled(emailTasks.map((task) => task())).catch((error) => {
      console.error("[updateScheduleStatus] Email dispatch error:", error);
    });

    return res.json({ success: true, schedule });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



/* ---------------------------------------------
   3️⃣ HOSPITAL MARKS DONATION COMPLETED
----------------------------------------------*/
export const markDonationCompleted = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const io = req.app.locals.io;
    const { schedule, alreadyCompleted } = await completeDonationSchedule(scheduleId, io);

    return res.json({
      success: true,
      message: alreadyCompleted ? "Donation already completed" : "Donation completed",
      schedule,
    });

  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};


/* ---------------------------------------------
   4️⃣ GET SCHEDULES FOR A HOSPITAL
----------------------------------------------*/
export const getHospitalSchedules = async (req, res) => {
  try {
    const { hospital } = req.params;

    const schedules = await DonationSchedule.find()
      .populate("donorId", "fullName email")
      .populate("requestId");

    // Filter schedules for only this hospital
    const filtered = schedules.filter(s => s.requestId?.hospital === hospital);

    return res.json({ success: true, schedules: filtered });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* -----------------------------------------------
   GET DONOR SCHEDULES
   GET /schedule/donor/:donorId
-----------------------------------------------*/
export const getDonorSchedules = async (req, res) => {
  try {
    const { donorId } = req.params;

    if (!donorId) {
      return res.status(400).json({ success: false, message: "Donor ID is required" });
    }

    const schedules = await DonationSchedule.find({ donorId })
      .populate("requestId");

    return res.json({ success: true, schedules: schedules || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
