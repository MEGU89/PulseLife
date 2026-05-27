// routes/hospital.js
import express from "express";
import Request from "../models/Request.js";
import User from "../models/User.js";
import DonationSchedule from "../models/DonationSchedule.js";

const router = express.Router();

// Function to convert coordinates to readable address using reverse geocoding
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();

    if (data.address) {
      const addr = data.address;
      const parts = [];

      // Add house number and street if available
      if (addr.house_number) parts.push(addr.house_number);
      if (addr.road) parts.push(addr.road);

      // Add suburb/neighbourhood/village (sector/area)
      if (addr.suburb) parts.push(addr.suburb);
      else if (addr.neighbourhood) parts.push(addr.neighbourhood);
      else if (addr.village) parts.push(addr.village);
      else if (addr.hamlet) parts.push(addr.hamlet);

      // Add city/town
      if (addr.city) parts.push(addr.city);
      else if (addr.town) parts.push(addr.town);

      // Add postcode/pincode
      if (addr.postcode) parts.push(`Pin Code ${addr.postcode}`);

      // Add state
      if (addr.state) parts.push(addr.state);

      // Add country
      if (addr.country) parts.push(addr.country);

      const fullAddress = parts.filter(Boolean).join(", ");
      return fullAddress || "Location detected";
    }

    return "Location detected";
  } catch (err) {
    console.error("Error fetching address:", err);
    return "Location detected";
  }
};

/* ---------------------------------------------------------
   0️⃣ GET ALL HOSPITALS
----------------------------------------------------------*/
router.get("/all", async (req, res) => {
  try {
    const hospitals = await User.find(
      { role: "hospital" },
      "fullName phone location address"
    ).lean();

    console.log(`Found ${hospitals.length} hospitals in database`);

    // Filter hospitals that have valid locations only
    const hospitalsWithValidLocation = hospitals.filter(h => 
      h.location && h.location.latitude && h.location.longitude
    );

    console.log(`Hospitals with valid locations: ${hospitalsWithValidLocation.length}`);
    
    // Log hospitals without locations
    const hospitalsWithoutLocation = hospitals.filter(h => 
      !h.location || !h.location.latitude || !h.location.longitude
    );
    if (hospitalsWithoutLocation.length > 0) {
      console.warn(`${hospitalsWithoutLocation.length} hospitals without valid locations:`, 
        hospitalsWithoutLocation.map(h => h.fullName)
      );
    }

    // Convert hospital data with address from coordinates
    const formatted = await Promise.all(hospitalsWithValidLocation.map(async (hospital) => {
      // Use stored address if available, otherwise convert from coordinates
      let address = hospital.address;
      if (!address) {
        address = await getAddressFromCoordinates(
          hospital.location.latitude,
          hospital.location.longitude
        );
      }

      return {
        id: hospital._id,
        hospitalName: hospital.fullName || "Hospital",
        phone: hospital.phone || "N/A",
        location: {
          latitude: hospital.location.latitude,
          longitude: hospital.location.longitude,
          address: address
        },
        address: address,
      };
    }));

    res.json({ 
      success: true, 
      hospitals: formatted,
      count: formatted.length 
    });

  } catch (err) {
    console.error("Error fetching hospitals:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

/* ---------------------------------------------------------
   1️⃣ REAL HOSPITAL STATS (ACTIVE DONORS + AVG MATCH TIME)
----------------------------------------------------------*/
router.get("/stats", async (req, res) => {
  try {
    const hospitalName = typeof req.query.hospitalName === "string" ? req.query.hospitalName.trim() : "";
    const activeDonors = await User.countDocuments({
      role: "donor",
      available: true,
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true }
    });

    const requestFilter = hospitalName ? { hospital: hospitalName } : {};
    const requests = await Request.find(requestFilter, "createdAt status hospital").lean();
    const requestIds = requests.map((request) => request._id);

    const schedules = requestIds.length
      ? await DonationSchedule.find({ requestId: { $in: requestIds } })
          .populate("requestId", "createdAt hospital")
          .lean()
      : [];

    let totalMinutes = 0;
    let matchedCount = 0;

    schedules.forEach((schedule) => {
      const createdAt = schedule.requestId?.createdAt;
      if (!createdAt || !schedule.createdAt) return;

      const diffMin = Math.floor((new Date(schedule.createdAt) - new Date(createdAt)) / 1000 / 60);
      if (diffMin >= 0) {
        totalMinutes += diffMin;
        matchedCount += 1;
      }
    });

    const pendingSchedules = schedules.filter((schedule) => schedule.status === "pending").length;
    const completedDonations = schedules.filter((schedule) => schedule.status === "completed").length;
    const fulfilledRequests = requests.filter((request) => request.status === "Fulfilled").length;

    res.json({
      success: true,
      donorsNearby: activeDonors,
      avgMatchTime: matchedCount > 0 ? Math.floor(totalMinutes / matchedCount) : 0,
      totalSchedules: schedules.length,
      pendingSchedules,
      completedDonations,
      fulfilledRequests,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------------
   2️⃣ GET ACTIVE DONORS (FOR MAP)
----------------------------------------------------------*/
router.get("/active-donors", async (req, res) => {
  try {
    const donors = await User.find(
      { available: true, "location.latitude": { $exists: true } },
      "fullName bloodType location"
    );

    res.json({ success: true, donors });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------------
   3️⃣ GET SCHEDULES FOR SPECIFIC HOSPITAL
----------------------------------------------------------*/
router.get("/schedules/:hospitalName", async (req, res) => {
  try {
    const hospitalName = req.params.hospitalName;
    const requests = await Request.find({ hospital: hospitalName }, "_id").lean();
    const requestIds = requests.map((request) => request._id);

    if (requestIds.length === 0) {
      return res.json({ success: true, schedules: [] });
    }

    const schedules = await DonationSchedule.find({ requestId: { $in: requestIds } })
      .populate("donorId", "fullName email")
      .populate("requestId")
      .sort({ createdAt: -1 });

    const formatted = schedules.map((schedule) => ({
      _id: schedule._id,
      donorName: schedule.donorId?.fullName,
      donorId: schedule.donorId
        ? {
            _id: schedule.donorId._id,
            fullName: schedule.donorId.fullName,
            email: schedule.donorId.email,
          }
        : null,
      contact: schedule.contact,
      date: schedule.date,
      time: schedule.time,
      notes: schedule.notes,
      status: schedule.status,
      hospitalResponse: schedule.hospitalResponse ?? "none",
      bloodType: schedule.requestId?.bloodType,
      unitsNeeded: schedule.requestId?.unitsNeeded,
      requestId: schedule.requestId
        ? {
            _id: schedule.requestId._id,
            hospital: schedule.requestId.hospital,
            bloodType: schedule.requestId.bloodType,
            unitsNeeded: schedule.requestId.unitsNeeded,
            status: schedule.requestId.status,
            confirmationStatus: schedule.requestId.confirmationStatus,
          }
        : null,
      createdAt: schedule.createdAt,
    }));

    res.json({ success: true, schedules: formatted });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------------
   4️⃣ SEED TEST HOSPITALS (FOR DEVELOPMENT)
----------------------------------------------------------*/
router.post("/seed-hospitals", async (req, res) => {
  try {
    // Check if hospitals already exist
    const existingHospitals = await User.find({ role: "hospital" });
    if (existingHospitals.length > 0) {
      return res.json({ 
        success: true, 
        message: `${existingHospitals.length} hospitals already exist in database` 
      });
    }

    const testHospitals = [
      {
        fullName: "Apollo Hospital Nagpur",
        email: "apollo.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-234567",
        role: "hospital",
        location: {
          latitude: 21.1489,
          longitude: 79.0873
        },
        address: "Ramdaspeth, Nagpur 440010"
      },
      {
        fullName: "Care Hospital Nagpur",
        email: "care.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-445678",
        role: "hospital",
        location: {
          latitude: 21.1520,
          longitude: 79.0940
        },
        address: "Sitabuldi, Nagpur 440013"
      },
      {
        fullName: "Ruby Hall Clinic",
        email: "ruby.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-556789",
        role: "hospital",
        location: {
          latitude: 21.1410,
          longitude: 79.0810
        },
        address: "Lakhanpal, Nagpur 440009"
      },
      {
        fullName: "Government Medical College Hospital",
        email: "gmch.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-667890",
        role: "hospital",
        location: {
          latitude: 21.1460,
          longitude: 79.0920
        },
        address: "Mahal Road, Nagpur 440009"
      }
    ];

    const created = await User.insertMany(testHospitals);
    res.json({ 
      success: true, 
      message: `Created ${created.length} test hospitals`,
      hospitals: created.map(h => ({ id: h._id, name: h.fullName }))
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------------
   RESET HOSPITALS (DELETE OLD AND CREATE NEW)
----------------------------------------------------------*/
router.post("/reset-hospitals", async (req, res) => {
  try {
    // Delete all existing hospitals
    const deleted = await User.deleteMany({ role: "hospital" });
    console.log(`Deleted ${deleted.deletedCount} hospitals`);

    // Create new hospitals with proper locations
    const testHospitals = [
      {
        fullName: "Apollo Hospital Nagpur",
        email: "apollo.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-234567",
        role: "hospital",
        location: {
          latitude: 21.1489,
          longitude: 79.0873
        },
        address: "Ramdaspeth, Nagpur 440010"
      },
      {
        fullName: "Care Hospital Nagpur",
        email: "care.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-445678",
        role: "hospital",
        location: {
          latitude: 21.1520,
          longitude: 79.0940
        },
        address: "Sitabuldi, Nagpur 440013"
      },
      {
        fullName: "Ruby Hall Clinic",
        email: "ruby.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-556789",
        role: "hospital",
        location: {
          latitude: 21.1410,
          longitude: 79.0810
        },
        address: "Lakhanpal, Nagpur 440009"
      },
      {
        fullName: "Government Medical College Hospital",
        email: "gmch.nagpur@example.com",
        password: "password123",
        phone: "+91 7122-667890",
        role: "hospital",
        location: {
          latitude: 21.1460,
          longitude: 79.0920
        },
        address: "Mahal Road, Nagpur 440009"
      }
    ];

    const created = await User.insertMany(testHospitals);
    res.json({ 
      success: true, 
      message: `Reset complete: Deleted ${deleted.deletedCount}, Created ${created.length} new hospitals`,
      hospitals: created.map(h => ({ 
        id: h._id, 
        name: h.fullName,
        location: h.location
      }))
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------------------
   5️⃣ UPDATE HOSPITAL LOCATION
----------------------------------------------------------*/
router.post("/update-location", async (req, res) => {
  try {
    const { hospitalId, latitude, longitude, address } = req.body;

    if (!hospitalId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: "hospitalId, latitude, and longitude are required" 
      });
    }

    // Log the incoming ID for debugging
    console.log(`Attempting to update location for hospital ID: ${hospitalId}`);

    const updated = await User.findByIdAndUpdate(
      hospitalId,
      {
        location: { latitude, longitude },
        address: address || undefined
      },
      { new: true }
    );

    if (!updated) {
      console.error(`Hospital not found with ID: ${hospitalId}`);
      return res.status(404).json({ 
        success: false, 
        message: "Hospital not found. Please log in again." 
      });
    }

    console.log(`Hospital location updated: ${updated.fullName} - Lat: ${latitude}, Lon: ${longitude}`);

    res.json({ 
      success: true, 
      message: "Hospital location updated successfully",
      hospital: {
        id: updated._id,
        name: updated.fullName,
        location: updated.location
      }
    });

  } catch (err) {
    console.error("Error updating hospital location:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
