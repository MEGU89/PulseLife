import express from "express";
import User from "../models/User.js";
import DonationSchedule from "../models/DonationSchedule.js";
import { formatDateInputValue, parseScheduleDate } from "../utils/scheduleDate.js";
import {
  addDonation,
  getDonationHistory,
  getUrgentRequests,
  getScheduleHistory
} from "../controllers/donorController.js";

export default function donorRoutes(io) {
  const router = express.Router();

  /* ------------------------------------------
      ⭐ Update Donor Availability + Location
      POST /donor/availability
  -------------------------------------------*/
  router.post("/availability", async (req, res) => {
    try {
      const { donorId, available, latitude, longitude } = req.body;

      if (!donorId) {
        return res.status(400).json({ success: false, message: "Donor ID is required" });
      }

      const donor = await User.findById(donorId);
      if (!donor) {
        return res.status(404).json({ success: false, message: "Donor not found" });
      }

      donor.available = available;

      if (available && latitude && longitude) {
        donor.location = { latitude, longitude };
      }

      await donor.save();

      // 🔥 Real-time emit to ALL hospitals
      io.emit("donor_status_changed", {
        donorId: donor._id,
        available: donor.available,
        location: donor.location || null,
        bloodType: donor.bloodType,
        fullName: donor.fullName
      });

      return res.json({
        success: true,
        message: "Donor availability updated",
        donor
      });

    } catch (error) {
      console.error("Availability error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

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

      const schedules = await DonationSchedule.find({
        donorId,
        status: { $in: ["completed", "accepted"] }
      })
        .lean();

      let lastSchedule = null;
      let lastScheduleDate = null;

      for (const schedule of schedules) {
        const parsedDate = parseScheduleDate(schedule.date, schedule.time || "00:00");
        if (!parsedDate) continue;

        if (!lastScheduleDate || parsedDate > lastScheduleDate) {
          lastSchedule = schedule;
          lastScheduleDate = parsedDate;
        }
      }

      if (!lastSchedule) {
        return res.json({ 
          success: true, 
          lastDonationDate: null,
          nextEligibleDate: null,
          cooldownActive: false,
          message: "No previous donations found"
        });
      }

      const nextEligibleDate = new Date(lastScheduleDate);
      nextEligibleDate.setUTCDate(nextEligibleDate.getUTCDate() + 56);

      return res.json({
        success: true,
        lastDonationDate: lastSchedule.date,
        nextEligibleDate: formatDateInputValue(nextEligibleDate),
        cooldownActive: nextEligibleDate > new Date(),
        lastSchedule
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
