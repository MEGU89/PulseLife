import cron from "node-cron";
import DonationSchedule from "../models/DonationSchedule.js";
import { completeDonationSchedule } from "./completeDonation.js";
import { parseScheduleDate } from "./scheduleDate.js";

/**
 * Auto-complete accepted donation schedules once their scheduled time has passed.
 * This matches the workflow:
 * hospital accepts -> wait for scheduled time -> donation completes automatically.
 */
export const initializeDonationScheduler = (io) => {
  cron.schedule("* * * * *", async () => {
    try {
      const acceptedSchedules = await DonationSchedule.find({
        status: "accepted",
      }).select("_id date time");

      const now = new Date();

      for (const schedule of acceptedSchedules) {
        const scheduledAt = parseScheduleDate(schedule.date, schedule.time || "00:00");
        if (!scheduledAt) {
          continue;
        }

        if (now >= scheduledAt) {
          try {
            await completeDonationSchedule(schedule._id, io);
            console.log(`Auto-completed donation schedule ${schedule._id.toString()}`);
          } catch (error) {
            if (error?.statusCode === 409 || error?.statusCode === 404) {
              console.warn(`Skipped auto-completing schedule ${schedule._id.toString()}: ${error.message}`);
              continue;
            }

            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error in donation completion scheduler:", error);
    }
  });

  console.log("Donation completion scheduler initialized in auto-complete mode.");
};
