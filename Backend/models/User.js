// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true, trim: true },
    bloodType: { type: String, enum: ["A+","A-","B+","B-","AB+","AB-","O+","O-"], default: null },
    gender: { type: String, enum: ["male", "female", "other"], default: null },
    role: { type: String, enum: ["donor","hospital","recipient","user"], default: "user" },
    // Optional hospital identifier for hospital accounts
    hospitalId: { type: String, default: null },
    available: { type: Boolean, default: false },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    // Profile image stored as base64 string
    profileImage: { type: String, default: null },
    // Address for hospital/recipient profiles
    address: { type: String, default: null },
    // Donor rewards and perks
    perks: [
      {
        type: {
          type: String,
          enum: [
            "basic_health_checkup",
            "bp_hemoglobin_check",
            "basic_health_checkup_bonus",
            "priority_appointment",
            "blood_test_report",
            "premium_donor_badge",
            "family_emergency_priority"
          ],
          default: "basic_health_checkup"
        },
        tierKey: { type: String, default: null },
        title: String,
        description: String,
        benefitDate: Date, // Date when perk becomes available
        expiryDate: Date,
        status: {
          type: String,
          enum: ["available", "used", "expired"],
          default: "available"
        },
        usedAt: Date,
        scheduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DonationSchedule",
          default: null
        },
        donationDate: Date, // Reference to when donation was completed
        claimedAt: String, // Hospital name/ID where perk was used
        awardYear: { type: Number, default: null }
      }
    ],
    lastHealthCheckupDate: Date, // Track last checkup date (90-day eligibility)
    totalDonations: { type: Number, default: 0 }, // Track total donations for rewards
    donationsThisYear: { type: Number, default: 0 },
    nextEligibleDonationDate: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
