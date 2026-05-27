import Request from "../models/Request.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/email.js";

function normalizeRequestType(value) {
  if (value === "blood" || value === "organ") {
    return value;
  }

  return null;
}

function getRequestLabel(requestType) {
  return requestType === "organ" ? "organ request" : "blood request";
}

function getRequestNeedLabel(requestType) {
  return requestType === "organ" ? "Organ needed" : "Blood type";
}

function getRequestNeedValue(request) {
  return request.requestType === "organ"
    ? request.organType || "Not specified"
    : request.bloodType || "Not specified";
}

function isCompatible(requestBlood, donorBlood) {
  if (!requestBlood || !donorBlood) return false;
  if (requestBlood === donorBlood) return true;

  const compat = {
    "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "O+": ["A+", "B+", "AB+", "O+"],
    "A-": ["A+", "A-", "AB+", "AB-"],
    "A+": ["A+", "AB+"],
    "B-": ["B+", "B-", "AB+", "AB-"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB+", "AB-"],
    "AB+": ["AB+"],
  };

  const donorRecipients = compat[donorBlood] || [];
  return donorRecipients.includes(requestBlood);
}

function haversineKm(fromLat, fromLng, toLat, toLng) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    );
    const data = await response.json();

    if (data.address) {
      const addr = data.address;
      const parts = [];

      if (addr.house_number) parts.push(addr.house_number);
      if (addr.road) parts.push(addr.road);

      if (addr.suburb) parts.push(addr.suburb);
      else if (addr.neighbourhood) parts.push(addr.neighbourhood);
      else if (addr.village) parts.push(addr.village);
      else if (addr.hamlet) parts.push(addr.hamlet);

      if (addr.city) parts.push(addr.city);
      else if (addr.town) parts.push(addr.town);

      if (addr.postcode) parts.push(`Pin Code ${addr.postcode}`);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);

      const fullAddress = parts.filter(Boolean).join(", ");
      return fullAddress || "Location detected";
    }

    return "Location detected";
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Location detected";
  }
};

export const addRequest = async (req, res) => {
  try {
    const {
      requestType,
      bloodType,
      organType,
      unitsNeeded,
      hospital,
      urgency,
      searchRadiusKm,
      locationKm,
      requestedBy,
      recipientName,
      location,
      isRecipientRequest,
    } = req.body;

    const requestOwner = requestedBy
      ? await User.findById(requestedBy).select("fullName location")
      : null;

    const resolvedSearchRadiusKm = searchRadiusKm ?? locationKm ?? null;
    const resolvedLocation =
      location && location.latitude != null && location.longitude != null
        ? { latitude: location.latitude, longitude: location.longitude }
        : requestOwner?.location &&
            requestOwner.location.latitude != null &&
            requestOwner.location.longitude != null
          ? {
              latitude: requestOwner.location.latitude,
              longitude: requestOwner.location.longitude,
            }
      : null;

    const normalizedRequestType = normalizeRequestType(requestType || "blood");
    if (!normalizedRequestType) {
      return res.status(400).json({ success: false, message: "Invalid request type" });
    }

    if (!unitsNeeded || !urgency || !requestedBy) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (normalizedRequestType === "blood" && !bloodType) {
      return res.status(400).json({ success: false, message: "Blood type is required for blood requests" });
    }

    if (normalizedRequestType === "organ" && !organType) {
      return res.status(400).json({ success: false, message: "Organ type is required for organ requests" });
    }

    if (isRecipientRequest && !hospital) {
      return res.status(400).json({
        success: false,
        message: "A destination hospital is required for recipient requests",
      });
    }

    const resolvedHospital = hospital || requestOwner?.fullName || null;
    if (!resolvedHospital) {
      return res.status(400).json({ success: false, message: "Hospital is required for this request" });
    }

    const payload = {
      requestType: normalizedRequestType,
      bloodType: normalizedRequestType === "blood" ? bloodType : null,
      organType: normalizedRequestType === "organ" ? organType : null,
      unitsNeeded,
      hospital: resolvedHospital,
      destinationHospital: isRecipientRequest ? resolvedHospital : null,
      urgency,
      requestedBy,
      recipientName,
      isRecipientRequest: !!isRecipientRequest,
      status: "Pending",
      confirmationStatus: "Pending",
    };

    if (resolvedSearchRadiusKm != null) {
      payload.searchRadiusKm = resolvedSearchRadiusKm;
    }

    if (resolvedLocation) {
      payload.location = resolvedLocation;
    }

    const newRequest = await Request.create(payload);

    const io = req.app.locals.io;
    if (io) {
      const payload = {
        _id: newRequest._id,
        requestType: normalizedRequestType,
        bloodType: newRequest.bloodType,
        organType: newRequest.organType,
        unitsNeeded,
        hospital: newRequest.hospital,
        destinationHospital: newRequest.destinationHospital,
        urgency,
        searchRadiusKm: resolvedSearchRadiusKm,
        location: newRequest.location || null,
        recipientName: newRequest.recipientName || null,
        isRecipientRequest: newRequest.isRecipientRequest || false,
        status: "Pending",
        createdAt: newRequest.createdAt,
      };

      if (newRequest.isRecipientRequest) {
        const hospitalUser = await User.findOne(
          { fullName: newRequest.destinationHospital || newRequest.hospital, role: "hospital" },
          "_id",
        ).lean();

        if (hospitalUser?._id) {
          io.to(String(hospitalUser._id)).emit("recipient_request_created", payload);
        }
      } else {
        io.emit("request_created", payload);
      }
    }

    if (!newRequest.isRecipientRequest && normalizedRequestType === "blood") {
      const onlineMap = req.app.get("onlineMap") || new Map();
      const donors = await User.find({
        role: "donor",
        available: true,
        bloodType: { $exists: true, $ne: null },
      });

      const matches = donors.filter((donor) => donor.bloodType && isCompatible(bloodType, donor.bloodType));

      for (const donor of matches) {
        const socketId = onlineMap.get(donor._id.toString());
        if (!socketId || !io) {
          continue;
        }

        const distanceKm =
          donor.location?.latitude != null &&
          donor.location?.longitude != null &&
          newRequest.location?.latitude != null &&
          newRequest.location?.longitude != null
            ? Math.round(
                haversineKm(
                  donor.location.latitude,
                  donor.location.longitude,
                  newRequest.location.latitude,
                  newRequest.location.longitude,
                ) * 10,
              ) / 10
            : null;

        io.to(socketId).emit("new_request", {
          requestId: newRequest._id,
          requestType: normalizedRequestType,
          bloodType: newRequest.bloodType,
          organType: newRequest.organType,
          unitsNeeded,
          hospital: newRequest.hospital,
          urgency,
          searchRadiusKm: resolvedSearchRadiusKm,
          location: newRequest.location || null,
          distanceKm,
        });
      }
    }

    res.json({ success: true, message: "Request created successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllRequests = async (_req, res) => {
  try {
    const requests = await Request.find()
      .populate("requestedBy", "fullName phone address location role")
      .sort({ createdAt: -1 });

    const enrichedRequests = await Promise.all(
      requests.map(async (requestDoc) => {
        const request = requestDoc.toObject();
        const requestOwner = request.requestedBy || null;

        if (requestOwner) {
          request.requestedBy = {
            ...requestOwner,
            _id: requestOwner._id,
          };

          if (requestOwner.location?.latitude && requestOwner.location?.longitude) {
            let address = requestOwner.address;
            if (!address) {
              address = await getAddressFromCoordinates(
                requestOwner.location.latitude,
                requestOwner.location.longitude,
              );
            }

            request.location = request.location || {
              latitude: requestOwner.location.latitude,
              longitude: requestOwner.location.longitude,
              address,
            };
          }

          let ownerAddress = requestOwner.address;
          if (!ownerAddress && requestOwner.location?.latitude && requestOwner.location?.longitude) {
            ownerAddress = await getAddressFromCoordinates(
              requestOwner.location.latitude,
              requestOwner.location.longitude,
            );
          }

          request.phone = request.phone || requestOwner.phone || null;
          request.address = request.address || ownerAddress || null;
        }

        if (request.hospital) {
          const hospitalUser = await User.findOne(
            { fullName: request.hospital, role: "hospital" },
            "fullName phone address location",
          ).lean();

          if (hospitalUser) {
            request.hospitalName = hospitalUser.fullName;
            request.phone = request.phone || hospitalUser.phone || null;

            let hospitalAddress = hospitalUser.address || null;
            if (!hospitalAddress && hospitalUser.location?.latitude && hospitalUser.location?.longitude) {
              hospitalAddress = await getAddressFromCoordinates(
                hospitalUser.location.latitude,
                hospitalUser.location.longitude,
              );
            }

            if (request.isRecipientRequest) {
              request.phone = hospitalUser.phone || null;
              request.address = hospitalAddress;
              request.location = hospitalUser.location?.latitude && hospitalUser.location?.longitude
                ? {
                    latitude: hospitalUser.location.latitude,
                    longitude: hospitalUser.location.longitude,
                    address: hospitalAddress,
                  }
                : request.location;
            } else if (!request.address) {
              request.address = hospitalAddress;
            }
          } else {
            request.hospitalName = request.hospital;
          }
        }

        request.searchRadiusKm = request.searchRadiusKm ?? request.locationKm ?? null;
        return request;
      }),
    );

    res.json({ success: true, requests: enrichedRequests });
  } catch (error) {
    console.error("[getAllRequests] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const confirmRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, confirmedBy, hospitalId, notes } = req.body;
    const confirmerId = hospitalId || confirmedBy;

    if (!["Confirmed", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'Confirmed' or 'Rejected'",
      });
    }

    if (!confirmerId) {
      return res.status(400).json({
        success: false,
        message: "A hospital user is required to confirm or reject a request",
      });
    }

    const hospitalUser = await User.findById(confirmerId, "fullName email role");
    if (!hospitalUser || hospitalUser.role !== "hospital") {
      return res.status(400).json({
        success: false,
        message: "Only a hospital account can confirm or reject a request",
      });
    }

    const request = await Request.findById(requestId).populate("requestedBy", "email fullName role");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const assignedHospitalName = request.destinationHospital || request.hospital;
    if (assignedHospitalName && hospitalUser.fullName !== assignedHospitalName) {
      return res.status(403).json({
        success: false,
        message: "Only the selected hospital can confirm or reject this recipient request",
      });
    }

    request.confirmationStatus = action;
    request.confirmedBy = action === "Confirmed" ? hospitalUser._id : null;
    request.confirmationNotes = notes || null;
    await request.save();

    const io = req.app.locals.io;
    if (io) {
      io.emit("request_confirmed", {
        _id: request._id,
        confirmationStatus: request.confirmationStatus,
        confirmedBy: request.confirmedBy,
        confirmationNotes: request.confirmationNotes,
        hospitalId: hospitalUser._id,
        hospitalName: hospitalUser.fullName,
      });
    }

    const recipientUser =
      request.requestedBy && request.requestedBy.role === "recipient"
        ? request.requestedBy
        : null;

    if (recipientUser?.email) {
      const requestLabel = getRequestLabel(request.requestType);
      const requestNeedLabel = getRequestNeedLabel(request.requestType);
      const requestNeedValue = getRequestNeedValue(request);

      await sendEmail(
        recipientUser.email,
        action === "Confirmed"
          ? `Hospital Confirmed Your ${request.requestType === "organ" ? "Organ" : "Blood"} Request`
          : `Hospital Rejected Your ${request.requestType === "organ" ? "Organ" : "Blood"} Request`,
        `
        <h2>${action === "Confirmed" ? "Request confirmed by hospital" : "Request rejected by hospital"}</h2>
        <p>Hello <b>${recipientUser.fullName || "Recipient"}</b>,</p>
        <p>
          ${
            action === "Confirmed"
              ? `<b>${hospitalUser.fullName}</b> has confirmed your ${requestLabel} and will continue handling it from the hospital side.`
              : `<b>${hospitalUser.fullName}</b> has rejected your ${requestLabel}.`
          }
        </p>
        <ul>
          <li><b>Hospital:</b> ${hospitalUser.fullName}</li>
          <li><b>${requestNeedLabel}:</b> ${requestNeedValue}</li>
          <li><b>Units needed:</b> ${request.unitsNeeded || 1}</li>
        </ul>
        ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ""}
        <p>You can track the latest status from your Pulselife recipient dashboard.</p>
        `,
      );
    }

    res.json({ success: true, message: `Request ${action.toLowerCase()}`, request });
  } catch (error) {
    console.error("Error in confirmRequest:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
