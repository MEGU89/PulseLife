import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB, { getMongoUri } from "../config/db.js";
import Request from "../models/Request.js";
import { findRequestHospitalUser } from "../utils/requestHospital.js";

dotenv.config();

const MONGO_URI = getMongoUri();

async function normalizeRequest(request) {
  const updates = {};

  if (request.confirmationStatus === "Successful" || request.status === "Fulfilled") {
    updates.confirmationStatus = "Confirmed";
  }

  if (!request.confirmedBy) {
    const hospitalUser = await findRequestHospitalUser(request, "_id fullName role");
    if (hospitalUser?._id) {
      updates.confirmedBy = hospitalUser._id;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { updated: false, missingHospital: !request.confirmedBy };
  }

  await Request.findByIdAndUpdate(request._id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  return {
    updated: true,
    missingHospital: !updates.confirmedBy && !request.confirmedBy,
  };
}

async function main() {
  await connectDB(MONGO_URI);

  const candidates = await Request.find({
    $or: [
      { confirmationStatus: "Successful" },
      { status: "Fulfilled", confirmedBy: null },
      { confirmationStatus: "Confirmed", confirmedBy: null },
    ],
  }).select("_id status confirmationStatus confirmedBy");

  let updatedCount = 0;
  let missingHospitalCount = 0;

  for (const request of candidates) {
    const result = await normalizeRequest(request);
    if (result.updated) updatedCount += 1;
    if (result.missingHospital) missingHospitalCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        scanned: candidates.length,
        updated: updatedCount,
        missingHospitalAfterNormalization: missingHospitalCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Normalization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
