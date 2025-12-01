const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    grade: {
      type: String,
      required: true,
    },
    manifesto: {
      type: String,
    },
    photoUrl: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);


