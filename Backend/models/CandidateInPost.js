const mongoose = require("mongoose");

// Links an approved candidate to a specific post in a specific election.
// This is what appears on the ballot for that post.
const candidateInPostSchema = new mongoose.Schema(
  {
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
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
  },
  { timestamps: true }
);

candidateInPostSchema.index(
  { election: 1, post: 1, candidate: 1 },
  { unique: true }
);

module.exports = mongoose.model("CandidateInPost", candidateInPostSchema);


