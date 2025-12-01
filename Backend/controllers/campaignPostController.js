const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const CampaignPost = require("../models/CampaignPost");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const { uploadDir } = require("../config");

// Candidate creates a campaign post
const createCampaignPost = async (req, res, next) => {
  try {
    console.log("createCampaignPost called with body:", req.body);
    const { electionId, title, content } = req.body;
    const candidateId = req.user.profileRef;

    if (!electionId || !title || !content) {
      console.error("Validation failed: Missing required fields");
      return res
        .status(400)
        .json({ message: "Election ID, title, and content are required" });
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
        .json({ message: "Candidate must be approved before creating campaign posts" });
    }

    // Verify election exists
    const election = await Election.findById(electionId);
    if (!election) {
      console.error("Election not found:", electionId);
      return res.status(404).json({ message: "Election not found" });
    }

    // Check if candidate has registered for this election
    const ElectionRegistration = require("../models/ElectionRegistration");
    const registration = await ElectionRegistration.findOne({
      candidate: candidateId,
      election: electionId,
      status: { $in: ["pending", "approved"] },
    });

    if (!registration) {
      console.error("Candidate not registered for election:", { candidateId, electionId });
      return res
        .status(403)
        .json({
          message: "You must register for this election before creating campaign posts",
        });
    }

    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const campaignPost = await CampaignPost.create({
      candidate: candidateId,
      election: electionId,
      title,
      content,
      imageUrl,
      status: "pending",
    });

    console.log("Campaign post created successfully:", campaignPost._id);
    res.status(201).json({
      message: "Campaign post created. Awaiting admin approval.",
      campaignPost,
    });
  } catch (error) {
    console.error("Error in createCampaignPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      candidateId: req.user?.profileRef
    });
    next(error);
  }
};

// Get campaign posts for a candidate
const getMyCampaignPosts = async (req, res, next) => {
  try {
    const candidateId = req.user.profileRef;
    const campaignPosts = await CampaignPost.find({
      candidate: candidateId,
    })
      .populate("election", "name description startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    res.json(campaignPosts);
  } catch (error) {
    next(error);
  }
};

// Get all approved campaign posts (for students to view)
const getApprovedCampaignPosts = async (req, res, next) => {
  try {
    const filter = { status: "approved" };
    if (req.query.electionId) filter.election = req.query.electionId;

    const campaignPosts = await CampaignPost.find(filter)
      .populate("candidate", "user grade")
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name username" },
      })
      .populate("election", "name description startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    res.json(campaignPosts);
  } catch (error) {
    next(error);
  }
};

// Admin: Get all campaign posts (with filters)
const getAllCampaignPosts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.electionId) filter.election = req.query.electionId;

    const campaignPosts = await CampaignPost.find(filter)
      .populate("candidate", "user grade")
      .populate({
        path: "candidate",
        populate: { path: "user", select: "name username" },
      })
      .populate("election", "name description startDate endDate")
      .populate("reviewedBy", "name username")
      .sort({ createdAt: -1 })
      .lean();

    res.json(campaignPosts);
  } catch (error) {
    next(error);
  }
};

// Admin: Approve campaign post
const approveCampaignPost = async (req, res, next) => {
  try {
    console.log("approveCampaignPost called with id:", req.params.id);
    const { message } = req.body;
    const campaignPost = await CampaignPost.findById(req.params.id);

    if (!campaignPost) {
      console.error("Campaign post not found:", req.params.id);
      return res.status(404).json({ message: "Campaign post not found" });
    }

    if (campaignPost.status !== "pending") {
      console.warn("Campaign post already reviewed:", {
        id: req.params.id,
        status: campaignPost.status
      });
      return res.status(400).json({ message: "Campaign post already reviewed" });
    }

    const reviewerName = req.user?.name || req.user?.username || "Administrator";
    const reviewerId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? req.user._id
      : null;

    campaignPost.status = "approved";
    campaignPost.message = message || "";
    campaignPost.reviewedBy = reviewerId;
    campaignPost.reviewedByName = reviewerName;
    campaignPost.reviewedAt = new Date();
    await campaignPost.save();

    console.log("Campaign post approved successfully:", req.params.id);
    res.json({
      message: "Campaign post approved",
      campaignPost,
    });
  } catch (error) {
    console.error("Error in approveCampaignPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      campaignPostId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

// Admin: Reject campaign post
const rejectCampaignPost = async (req, res, next) => {
  try {
    console.log("rejectCampaignPost called with id:", req.params.id);
    const { message } = req.body;
    const campaignPost = await CampaignPost.findById(req.params.id);

    if (!campaignPost) {
      console.error("Campaign post not found:", req.params.id);
      return res.status(404).json({ message: "Campaign post not found" });
    }

    if (campaignPost.status !== "pending") {
      console.warn("Campaign post already reviewed:", {
        id: req.params.id,
        status: campaignPost.status
      });
      return res.status(400).json({ message: "Campaign post already reviewed" });
    }

    const reviewerName = req.user?.name || req.user?.username || "Administrator";
    const reviewerId = mongoose.Types.ObjectId.isValid(req.user._id)
      ? req.user._id
      : null;

    campaignPost.status = "rejected";
    campaignPost.message = message || "Campaign post rejected";
    campaignPost.reviewedBy = reviewerId;
    campaignPost.reviewedByName = reviewerName;
    campaignPost.reviewedAt = new Date();
    await campaignPost.save();

    console.log("Campaign post rejected successfully:", req.params.id);
    res.json({
      message: "Campaign post rejected",
      campaignPost,
    });
  } catch (error) {
    console.error("Error in rejectCampaignPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      campaignPostId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

// Update campaign post (candidate only)
const updateCampaignPost = async (req, res, next) => {
  try {
    console.log("updateCampaignPost called with id:", req.params.id, "body:", req.body);
    const { title, content } = req.body;
    const campaignPost = await CampaignPost.findById(req.params.id);

    if (!campaignPost) {
      console.error("Campaign post not found:", req.params.id);
      return res.status(404).json({ message: "Campaign post not found" });
    }

    const isAdmin = req.user.role === "admin";
    const candidateId = req.user.profileRef;

    if (!isAdmin) {
      if (campaignPost.candidate.toString() !== candidateId.toString()) {
        console.error("Unauthorized update attempt:", {
          candidateId,
          postCandidateId: campaignPost.candidate.toString(),
        });
        return res.status(403).json({ message: "Cannot modify other candidates' posts" });
      }

      // Candidates cannot edit rejected posts
      if (campaignPost.status === "rejected") {
        console.warn("Attempted to edit rejected campaign post:", req.params.id);
        return res
          .status(400)
          .json({ message: "Cannot update rejected campaign posts" });
      }
    }

    if (title !== undefined) campaignPost.title = title;
    if (content !== undefined) campaignPost.content = content;

    if (req.file) {
      // Delete old image if present
      if (campaignPost.imageUrl) {
        const oldFilePath = path.join(uploadDir, path.basename(campaignPost.imageUrl));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log("Deleted old campaign post image:", oldFilePath);
          } catch (fileError) {
            console.warn("Error deleting old campaign post image:", fileError.message);
          }
        }
      }
      campaignPost.imageUrl = `/uploads/${req.file.filename}`;
      console.log("Campaign post image updated");
    }

    await campaignPost.save();

    console.log("Campaign post updated successfully:", req.params.id);
    res.json({
      message: "Campaign post updated",
      campaignPost,
    });
  } catch (error) {
    console.error("Error in updateCampaignPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      campaignPostId: req.params.id,
      body: req.body,
    });
    next(error);
  }
};

// Delete campaign post (candidate/admin)
const deleteCampaignPost = async (req, res, next) => {
  try {
    console.log("deleteCampaignPost called with id:", req.params.id);
    const campaignPost = await CampaignPost.findById(req.params.id);

    if (!campaignPost) {
      console.error("Campaign post not found:", req.params.id);
      return res.status(404).json({ message: "Campaign post not found" });
    }

    const isAdmin = req.user.role === "admin";
    const candidateId = req.user.profileRef;

    if (!isAdmin) {
      if (!candidateId || campaignPost.candidate.toString() !== candidateId.toString()) {
        console.error("Unauthorized delete attempt:", {
          candidateId,
          postCandidateId: campaignPost.candidate.toString(),
        });
        return res.status(403).json({ message: "Cannot delete other candidates' posts" });
      }
    }

    // Delete associated image if it exists
    if (campaignPost.imageUrl) {
      const filePath = path.join(uploadDir, path.basename(campaignPost.imageUrl));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("Deleted campaign post image:", filePath);
        } catch (fileError) {
          console.warn("Error deleting campaign post image (continuing):", fileError.message);
        }
      }
    }

    await campaignPost.deleteOne();

    console.log("Campaign post deleted successfully:", req.params.id);
    res.json({ message: "Campaign post deleted" });
  } catch (error) {
    console.error("Error in deleteCampaignPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      campaignPostId: req.params.id,
    });
    next(error);
  }
};

module.exports = {
  createCampaignPost,
  getMyCampaignPosts,
  getApprovedCampaignPosts,
  getAllCampaignPosts,
  approveCampaignPost,
  rejectCampaignPost,
  updateCampaignPost,
  deleteCampaignPost,
};

