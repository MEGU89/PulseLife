// controllers/donorController.js
import Donation from "../models/Donation.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import DonationSchedule from "../models/DonationSchedule.js";

/* -----------------------------------------------------
    1️⃣ ADD DONATION RECORD
----------------------------------------------------- */
export const addDonation = async (req, res) => {
  try {
    const { donorId, scheduleId, hospital, units, date, status } = req.body;
    if (!donorId || !hospital || !units) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const donor = await User.findById(donorId);
    if (!donor) return res.status(404).json({ success: false, message: "Donor not found" });

    const donation = await Donation.create({
      donorId,
      scheduleId: scheduleId || null,
      hospital,
      units,
      date: date || new Date(),
      status: status || "Completed",
    });

    res.json({ success: true, message: "Donation recorded", donation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* -----------------------------------------------------
    2️⃣ GET DONATION HISTORY
----------------------------------------------------- */
export const getDonationHistory = async (req, res) => {
  try {
    const donorId = req.params.donorId;

    const donor = await User.findById(donorId);
    if (!donor) return res.status(404).json({ success: false, message: "Donor not found" });

    const donations = await Donation.find({ donorId }).sort({ date: -1 });

    res.json({ success: true, donations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/*-----------------------------------------------------
    3️⃣ GET ALL URGENT REQUESTS FOR DASHBOARD
----------------------------------------------------- */
export const getUrgentRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requestType: "blood" }).sort({ createdAt: -1 });

    const formatted = requests.map((r) => ({
      _id: r._id,
      requestType: r.requestType,
      hospital: r.hospital,
      bloodType: r.bloodType,
      organType: r.organType,
      unitsNeeded: r.unitsNeeded,
      urgency: r.urgency,
      searchRadiusKm: r.searchRadiusKm ?? r.locationKm ?? null,
      status: r.status,
    }));

    res.json({ success: true, requests: formatted });
  } catch (err) {
    console.error("Error in getUrgentRequests:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


/* -----------------------------------------------------
    4️⃣ SET DONOR AVAILABILITY + LOCATION
----------------------------------------------------- */
export const setAvailability = async (req, res) => {
  try {
    const { donorId, available, latitude, longitude } = req.body;

    if (!donorId)
      return res.status(400).json({ success: false, message: "donorId required" });

    const donor = await User.findById(donorId);
    if (!donor)
      return res.status(404).json({ success: false, message: "Donor not found" });

    donor.available = !!available;
    if (latitude && longitude) donor.location = { latitude, longitude };
    await donor.save();

    // Broadcast availability_changed to all dashboards for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit("availability_changed", {
        donorId,
        available,
        latitude,
        longitude,
      });

      io.emit("donor_status_changed", {
        donorId: donor._id,
        available: donor.available,
        location: donor.location || null,
        bloodType: donor.bloodType,
        fullName: donor.fullName,
      });
    }

    res.json({
      success: true,
      message: "Availability updated",
      donor: {
        _id: donor._id,
        available: donor.available,
        location: donor.location || null,
        bloodType: donor.bloodType,
        fullName: donor.fullName,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* -----------------------------------------------------
    5️⃣ GET SCHEDULE HISTORY FOR DONOR (FIXED VERSION)
----------------------------------------------------- */
export const getScheduleHistory = async (req, res) => {
  try {
    const { donorId } = req.params;

    if (!donorId)
      return res.status(400).json({ success: false, message: "donorId required" });

    const history = await DonationSchedule.find({ donorId })
      .populate("requestId", "hospital bloodType unitsNeeded status")
      .sort({ createdAt: -1 });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


/* -----------------------------------------------------
    6️⃣ (NEW) GET UPCOMING + COMPLETED DONOR SCHEDULES
----------------------------------------------------- */
export const getDonorSchedules = async (req, res) => {
  try {
    const { donorId } = req.params;

    const schedules = await DonationSchedule.find({ donorId })
      .populate("requestId", "hospital bloodType unitsNeeded")
      .sort({ createdAt: -1 });

    res.json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
