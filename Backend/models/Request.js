import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["blood", "organ"],
      default: "blood",
    },

    bloodType: {
      type: String,
      default: null,
    },

    organType: {
      type: String,
      default: null,
      trim: true,
    },

    unitsNeeded: {
      type: Number,
      required: true,
      min: 1,
    },

    hospital: {
      type: String,
      required: true,
      trim: true,
    },

    // For recipient requests: the hospital they selected to send this request to
    destinationHospital: {
      type: String,
      default: null,
      trim: true,
    },

    urgency: {
      type: String,
      enum: ["HIGH", "MODERATE", "LOW"],
      default: "LOW",
    },

    searchRadiusKm: {
      type: Number,
      default: null,
    },
    // Legacy field kept for older records during transition.
    locationKm: {
      type: Number,
      default: null,
    },
    // Optional exact coordinates for hospital location
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },

    // Flag to indicate this request was created by a recipient (not a hospital)
    isRecipientRequest: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Pending", "Fulfilled", "Cancelled"],
      default: "Pending",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Only if request is tied to a user
    },

    recipientName: {
      type: String,
      default: null,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Hospital user who confirmed the request
    },

    confirmationStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected"],
      default: "Pending",
    },

    confirmationNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Sorting urgent requests faster
requestSchema.index({ urgency: 1, createdAt: -1 });

export default mongoose.model("Request", requestSchema);
