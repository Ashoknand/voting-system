const mongoose = require("mongoose");
const VotingToken = require("../models/VotingToken");
const CandidateInPost = require("../models/CandidateInPost");
const Post = require("../models/Post");
const Vote = require("../models/Vote");
const Student = require("../models/Student");
const Election = require("../models/Election");
const generateVotingId = require("../utils/generateVotingId");

const requestToken = async (req, res, next) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can request tokens" });
    }

    const { electionId } = req.body;
    if (!electionId) {
      return res.status(400).json({ message: "Election ID required" });
    }

    const studentId = req.user.profileRef;
    const existing = await VotingToken.findOne({
      election: electionId,
      student: studentId,
    });
    if (existing) {
      return res.json(existing);
    }

    const token = await VotingToken.create({
      student: studentId,
      election: electionId,
      token: generateVotingId(),
    });

    res.status(201).json(token);
  } catch (error) {
    next(error);
  }
};

const issueTokenForStudent = async (req, res, next) => {
  try {
    const { electionId } = req.body;
    const { studentId } = req.params;

    if (!electionId) {
      return res.status(400).json({ message: "Election ID is required" });
    }

    const [student, election] = await Promise.all([
      Student.findById(studentId),
      Election.findById(electionId),
    ]);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const token = await VotingToken.findOneAndUpdate(
      { student: studentId, election: electionId },
      {
        $setOnInsert: {
          token: generateVotingId(),
          student: studentId,
          election: electionId,
        },
      },
      { new: true, upsert: true }
    ).populate("election", "name startDate endDate");

    res.json(token);
  } catch (error) {
    next(error);
  }
};

const validateToken = async (req, res, next) => {
  try {
    const token = await VotingToken.findOne({
      token: req.params.token,
      isUsed: false,
    });
    if (!token) {
      return res.status(404).json({ message: "Token invalid or used" });
    }
    res.json(token);
  } catch (error) {
    next(error);
  }
};

const castBallot = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role !== "student") {
      await session.abortTransaction();
      return res.status(403).json({ message: "Only students can cast ballots" });
    }

    const studentId = req.user.profileRef;
    const { electionId, token: tokenValue, selections } = req.body;

    console.log("castBallot called:", {
      studentId,
      electionId,
      tokenValue,
      tokenType: typeof tokenValue,
      selectionsCount: selections?.length,
      selections,
    });

    if (!electionId) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Election ID is required" });
    }

    if (!tokenValue || typeof tokenValue !== "string" || tokenValue.trim() === "") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Voting token is required and must be a valid string" });
    }

    // Normalize token to string and trim whitespace
    const normalizedToken = String(tokenValue).trim();

    // Validate token format (should be 6 digits)
    if (!/^\d{6}$/.test(normalizedToken)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid voting token format. Token must be exactly 6 digits." });
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "At least one selection is required" });
    }

    const token = await VotingToken.findOne({
      token: normalizedToken,
      student: studentId,
      election: electionId,
      isUsed: false,
    }).session(session);

    if (!token) {
      await session.abortTransaction();
      // Check if token exists but is used
      const usedToken = await VotingToken.findOne({
        token: normalizedToken,
        student: studentId,
        election: electionId,
      }).session(session);
      
      if (usedToken) {
        return res.status(400).json({ message: "This voting token has already been used" });
      }
      
      // Check if token exists for different student/election
      const otherToken = await VotingToken.findOne({
        token: normalizedToken,
      }).session(session);
      
      if (otherToken) {
        return res.status(400).json({ message: "This voting token does not belong to you or this election" });
      }
      
      return res.status(400).json({ message: "Invalid voting token. Please check your voting ID and try again." });
    }

    const posts = await Post.find({ election: electionId }).session(session);
    if (posts.length !== selections.length) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Votes must be cast for all posts in the election" });
    }

    const uniquePosts = new Set(selections.map((item) => item.postId));
    if (uniquePosts.size !== selections.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Duplicate post selections" });
    }

    const candidateRecords = await CandidateInPost.find({
      election: electionId,
    })
      .populate("candidate")
      .session(session);

    const ops = selections.map(({ postId, candidateId }) => {
      const candidateAllowed = candidateRecords.find(
        (rec) =>
          rec.post.toString() === postId &&
          rec.candidate._id.toString() === candidateId
      );
      if (!candidateAllowed) {
        throw new Error("Candidate not on ballot for post");
      }
      return {
        student: studentId,
        election: electionId,
        post: postId,
        candidate: candidateId,
      };
    });

    await Vote.deleteMany({ student: studentId, election: electionId }).session(
      session
    );
    await Vote.insertMany(ops, { session });

    token.isUsed = true;
    await token.save({ session });

    await Student.findByIdAndUpdate(
      studentId,
      { hasVoted: true },
      { session }
    );

    await session.commitTransaction();
    res.json({ message: "Ballot submitted successfully" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = {
  requestToken,
  issueTokenForStudent,
  validateToken,
  castBallot,
};

