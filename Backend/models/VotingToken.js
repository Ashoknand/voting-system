const mongoose = require("mongoose");

// Unique voting ID for a student in a specific election
const votingTokenSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

votingTokenSchema.index({ student: 1, election: 1 }, { unique: true });

module.exports = mongoose.model("VotingToken", votingTokenSchema);


