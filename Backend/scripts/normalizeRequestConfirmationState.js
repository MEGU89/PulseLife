import dotenv from "dotenv";
import mongoose from "mongoose";

import DonationSchedule from "../models/DonationSchedule.js";
import Request from "../models/Request.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pulsebank";

async function normalizeRequest(request) {
  const updates = {};

  if (request.confirmationStatus === "Successful" || request.status === "Fulfilled") {
    updates.confirmationStatus = "Confirmed";
  }

  if (!request.confirmedBy) {
    const bestSchedule = await DonationSchedule.findOne({
      requestId: request._id,
      status: { $in: ["completed", "accepted"] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select("donorId status")
      .lean();

    if (bestSchedule?.donorId) {
      updates.confirmedBy = bestSchedule.donorId;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { updated: false, missingDonor: !request.confirmedBy };
  }

  await Request.findByIdAndUpdate(request._id, updates, {
    returnDocument: "after",
    runValidators: true,
  });

  return {
    updated: true,
    missingDonor: !updates.confirmedBy && !request.confirmedBy,
  };
}

async function main() {
  await mongoose.connect(MONGO_URI);

  const candidates = await Request.find({
    $or: [
      { confirmationStatus: "Successful" },
      { status: "Fulfilled", confirmedBy: null },
      { confirmationStatus: "Confirmed", confirmedBy: null },
    ],
  }).select("_id status confirmationStatus confirmedBy");

  let updatedCount = 0;
  let missingDonorCount = 0;

  for (const request of candidates) {
    const result = await normalizeRequest(request);
    if (result.updated) updatedCount += 1;
    if (result.missingDonor) missingDonorCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        scanned: candidates.length,
        updated: updatedCount,
        missingDonorAfterNormalization: missingDonorCount,
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
