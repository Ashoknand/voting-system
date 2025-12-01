const mongoose = require("mongoose");
const ElectionRegistration = require("../models/ElectionRegistration");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Post = require("../models/Post");
const CandidateInPost = require("../models/CandidateInPost");

// Candidate registers for an election and post
const registerForElection = async (req, res, next) => {
  try {
    console.log("registerForElection called with body:", req.body);
    const { electionId, postId } = req.body;
    const candidateId = req.user.profileRef;

    if (!electionId || !postId) {
      console.error("Validation failed: Missing electionId or postId");
      return res
        .status(400)
        .json({ message: "Election ID and Post ID are required" });
    }

    // Verify candidate exists and is approved
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      console.error("Candidate not found:", candidateId);
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    if (!candidate.isApproved) {
      console.error("Candidate not approved:", candidateId);
      return res
        .status(403)
        .json({ message: "Candidate must be approved before registering for elections" });
    }

    // Verify election and post exist
    const election = await Election.findById(electionId);
    if (!election) {
      console.error("Election not found:", electionId);
      return res.status(404).json({ message: "Election not found" });
    }

    const post = await Post.findOne({ _id: postId, election: electionId });
    if (!post) {
      console.error("Post not found:", { postId, electionId });
      return res.status(404).json({ message: "Post not found for this election" });
    }

    // Ensure candidate is eligible for the post based on grade
    if (post.eligibleGrades?.length) {
      const candidateGrade = candidate.grade?.trim();
      const isEligible = post.eligibleGrades.some(
        (grade) => grade.toLowerCase() === (candidateGrade || "").toLowerCase()
      );
      if (!isEligible) {
        console.warn("Candidate grade not eligible for post:", {
          candidateId,
          candidateGrade,
          eligibleGrades: post.eligibleGrades,
        });
        return res
          .status(403)
          .json({ message: "You are not eligible to register for this post based on grade" });
      }
    }

    // Check if candidate already has a pending/approved registration for this election
    const existingActive = await ElectionRegistration.findOne({
      candidate: candidateId,
      election: electionId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingActive) {
      console.warn("Candidate already has active registration for election:", {
        candidateId,
        electionId,
        existingRegistration: existingActive._id,
      });
      return res
        .status(400)
        .json({ message: "You already have an active registration for this election" });
    }

    // Check if already registered for exact same post (likely redundant but keep)
    const existing = await ElectionRegistration.findOne({
      candidate: candidateId,
      election: electionId,
      post: postId,
    });

    if (existing) {
      console.warn("Already registered:", { candidateId, electionId, postId });
      return res
        .status(409)
        .json({ message: "Already registered for this election and post" });
    }

    // Create registration
    const registration = await ElectionRegistration.create({
      candidate: candidateId,
      election: electionId,
      post: postId,
      status: "pending",
    });

    console.log("Registration created successfully:", registration._id);
    res.status(201).json({
      message: "Registration submitted. Awaiting admin approval.",
      registration,
    });
  } catch (error) {
    console.error("Error in registerForElection:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      body: req.body,
      candidateId: req.user?.profileRef
    });
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Already registered for this election and post" });
    }
    next(error);
  }
};

// Get registrations for a candidate
const getMyRegistrations = async (req, res, next) => {
  try {
    const candidateId = req.user.profileRef;
    const registrations = await ElectionRegistration.find({
      candidate: candidateId,
    })
      .populate("election", "name description startDate endDate")
      .populate("post", "name description")
      .sort({ createdAt: -1 })
      .lean();

    res.json(registrations);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all registrations (with filters)
const getAllRegistrations = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.electionId) filter.election = req.query.electionId;

    const registrations = await ElectionRegistration.find(filter)
      .populate("candidate", "user grade")
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name username" },
      })
      .populate("election", "name description startDate endDate")
      .populate("post", "name description")
      .populate("reviewedBy", "name username")
      .sort({ createdAt: -1 })
      .lean();

    res.json(registrations);
  } catch (error) {
    next(error);
  }
};

// Admin: Approve registration
const approveRegistration = async (req, res, next) => {
  try {
    console.log("approveRegistration called with id:", req.params.id);
    const { message } = req.body;
    const registration = await ElectionRegistration.findById(req.params.id);

    if (!registration) {
      console.error("Registration not found:", req.params.id);
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status !== "pending") {
      console.warn("Registration already reviewed:", {
        id: req.params.id,
        status: registration.status
      });
      return res
        .status(400)
        .json({ message: "Registration already reviewed" });
    }

    const reviewerName = req.user?.name || req.user?.username || "Administrator";
    const reviewerId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? req.user._id
      : null;

    registration.status = "approved";
    registration.message = message || "";
    registration.reviewedBy = reviewerId;
    registration.reviewedByName = reviewerName;
    registration.reviewedAt = new Date();
    await registration.save();

    // Automatically assign candidate to post if approved
    try {
      const cip = await CandidateInPost.create({
        election: registration.election,
        post: registration.post,
        candidate: registration.candidate,
      });
      console.log("Candidate automatically assigned to post:", cip._id);
    } catch (error) {
      // If already assigned, that's okay
      if (error.code !== 11000) {
        console.error("Error assigning candidate to post:", error);
        throw error;
      }
      console.warn("Candidate already assigned to post (duplicate key)");
    }

    console.log("Registration approved successfully:", req.params.id);
    res.json({
      message: "Registration approved and candidate added to ballot",
      registration,
    });
  } catch (error) {
    console.error("Error in approveRegistration:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      registrationId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

// Admin: Reject registration
const rejectRegistration = async (req, res, next) => {
  try {
    console.log("rejectRegistration called with id:", req.params.id);
    const { message } = req.body;
    const registration = await ElectionRegistration.findById(req.params.id);

    if (!registration) {
      console.error("Registration not found:", req.params.id);
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status !== "pending") {
      console.warn("Registration already reviewed:", {
        id: req.params.id,
        status: registration.status
      });
      return res
        .status(400)
        .json({ message: "Registration already reviewed" });
    }

    const reviewerName = req.user?.name || req.user?.username || "Administrator";
    const reviewerId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? req.user._id
      : null;

    registration.status = "rejected";
    registration.message = message || "Registration rejected";
    registration.reviewedBy = reviewerId;
    registration.reviewedByName = reviewerName;
    registration.reviewedAt = new Date();
    await registration.save();

    console.log("Registration rejected successfully:", req.params.id);
    res.json({
      message: "Registration rejected",
      registration,
    });
  } catch (error) {
    console.error("Error in rejectRegistration:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      registrationId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

module.exports = {
  registerForElection,
  getMyRegistrations,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
};

