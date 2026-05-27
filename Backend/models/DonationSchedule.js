import mongoose from "mongoose";

const donationScheduleSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true },

  donorLocation: {
    latitude: Number,
    longitude: Number,
  },

  contact: String,
  date: String,
  time: String,
  notes: String,
  medicalEligibility: {
    age: { type: Number, min: 0, default: null },
    weightKg: { type: Number, min: 0, default: null },
    hasRecentFeverOrInfection: { type: Boolean, default: null },
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending",
  },

  hospitalResponse: {
    type: String,
    enum: ["none", "accepted", "rejected"],
    default: "none",
  }
}, { timestamps: true });

export default mongoose.model("DonationSchedule", donationScheduleSchema);
