const mongoose = require("mongoose");

// Tracks when a candidate registers for a specific election
const electionRegistrationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    message: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedByName: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate registrations for the same election and post
electionRegistrationSchema.index(
  { candidate: 1, election: 1, post: 1 },
  { unique: true }
);

module.exports = mongoose.model("ElectionRegistration", electionRegistrationSchema);

