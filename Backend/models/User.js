const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "student", "candidate"],
      required: true,
    },
    grade: {
      type: String,
    },
    dob: {
      type: Date,
    },
    // link to specific profile document if needed
    profileRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "profileModel",
    },
    profileModel: {
      type: String,
      enum: ["Student", "Candidate", null],
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);


