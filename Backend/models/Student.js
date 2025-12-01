const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
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
    dob: {
      type: Date,
      required: true,
    },
    hasVoted: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);


