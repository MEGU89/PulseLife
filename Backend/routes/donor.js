import express from "express";
import Donation from "../models/Donation.js";
import User from "../models/User.js";
import {
  DONATION_COOLDOWN_DAYS,
  addDays,
  getAnnualDonationSummary,
} from "../utils/donorBenefits.js";
import { formatDateInputValue } from "../utils/scheduleDate.js";
import {
  addDonation,
  getDonationHistory,
  getUrgentRequests,
  getScheduleHistory,
  setAvailability,
} from "../controllers/donorController.js";

export default function donorRoutes(io) {
  const router = express.Router();

  /* ------------------------------------------
      ⭐ Update Donor Availability + Location
      POST /donor/availability
  -------------------------------------------*/
  router.post("/availability", setAvailability);

  /* ------------------------------------------
      ⭐ Existing routes (KEEPED EXACTLY)
  -------------------------------------------*/

  // Fetch donor donation history
  router.get("/history/:donorId", getDonationHistory);

  // Fetch scheduled donations
  router.get("/schedules/:donorId", getScheduleHistory);

  // Urgent requests for donor dashboard
  router.get("/requests", getUrgentRequests);

  // Add donation record
  router.post("/add-donation", addDonation);

  /* ------------------------------------------
      ⭐ Get Last Donation Date for 56-Day Cooldown
      GET /donor/last-donation/:donorId
  -------------------------------------------*/
  router.get("/last-donation/:donorId", async (req, res) => {
    try {
      const { donorId } = req.params;
      const donor = await User.findById(donorId).select("gender");

      const donations = await Donation.find({ donorId })
        .select("date")
        .lean();

      const annualSummary = getAnnualDonationSummary(donations, donor?.gender, new Date());
      const validDonationDates = donations
        .map((donation) => ({ ...donation, parsedDate: donation.date ? new Date(donation.date) : null }))
        .filter((donation) => donation.parsedDate && !Number.isNaN(donation.parsedDate.getTime()))
        .sort((left, right) => right.parsedDate - left.parsedDate);

      const lastDonation = validDonationDates[0] || null;
      const lastDonationDate = lastDonation?.parsedDate || null;

      if (!lastDonationDate) {
        return res.json({ 
          success: true, 
          lastDonationDate: null,
          nextEligibleDate: null,
          cooldownDays: DONATION_COOLDOWN_DAYS,
          cooldownActive: false,
          cooldownRemainingDays: 0,
          annualDonationCount: annualSummary.annualDonationCount,
          annualDonationLimit: annualSummary.annualDonationLimit,
          annualDonationRemaining: annualSummary.annualDonationRemaining,
          nextAnnualEligibleDate: formatDateInputValue(annualSummary.nextAnnualEligibleDate),
          donorGender: donor?.gender || null,
          message: "No previous donations found"
        });
      }

      const nextEligibleDate = addDays(lastDonationDate, DONATION_COOLDOWN_DAYS);
      const cooldownRemainingDays =
        nextEligibleDate && nextEligibleDate > new Date()
          ? Math.ceil((nextEligibleDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0;

      return res.json({
        success: true,
        lastDonationDate: lastDonation.date,
        nextEligibleDate: formatDateInputValue(nextEligibleDate),
        cooldownDays: DONATION_COOLDOWN_DAYS,
        cooldownActive: nextEligibleDate > new Date(),
        cooldownRemainingDays,
        annualDonationCount: annualSummary.annualDonationCount,
        annualDonationLimit: annualSummary.annualDonationLimit,
        annualDonationRemaining: annualSummary.annualDonationRemaining,
        nextAnnualEligibleDate: formatDateInputValue(annualSummary.nextAnnualEligibleDate),
        donorGender: donor?.gender || null,
        lastDonation,
      });

    } catch (error) {
      console.error("Error fetching last donation date:", error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  });

  return router;
}
