const Election = require("../models/Election");
const Post = require("../models/Post");
const Candidate = require("../models/Candidate");
const Student = require("../models/Student");
const Vote = require("../models/Vote");
const VotingToken = require("../models/VotingToken");
const generateVotingId = require("../utils/generateVotingId");

const getDashboard = async (req, res, next) => {
  try {
    console.log("getDashboard called");
    const [elections, candidates, students, votes] = await Promise.all([
      Election.countDocuments(),
      Candidate.countDocuments({ isApproved: true }),
      Student.countDocuments(),
      Vote.countDocuments(),
    ]);

    const totals = {
      elections,
      approvedCandidates: candidates,
      students,
      votes,
    };
    console.log("Dashboard stats calculated:", totals);
    res.json({ totals });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
};

const createElection = async (req, res, next) => {
  try {
    console.log("createElection called with body:", req.body);
    const { name, description, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      console.error("Validation failed: Missing required fields");
      return res
        .status(400)
        .json({ message: "Name, start date and end date are required" });
    }

    const election = await Election.create({
      name,
      description,
      startDate,
      endDate,
      isActive: false,
    });

    console.log("Election created successfully:", election._id);

    // Generate voting IDs for all existing students for this new election
    try {
      const students = await Student.find().select("_id").lean();
      if (students.length > 0) {
        const bulkOps = students.map((student) => ({
          updateOne: {
            filter: { student: student._id, election: election._id },
            update: {
              $setOnInsert: {
                student: student._id,
                election: election._id,
                token: generateVotingId(),
                isUsed: false,
              },
            },
            upsert: true,
          },
        }));
        const result = await VotingToken.bulkWrite(bulkOps, { ordered: false });
        console.log(
          "Voting tokens generated for new election:",
          JSON.stringify(
            {
              matched: result.matchedCount,
              upserts: result.upsertedCount,
              modified: result.modifiedCount,
            },
            null,
            2
          )
        );
      } else {
        console.log("No students found; skipping token generation for election.");
      }
    } catch (tokenError) {
      console.error("Error generating voting tokens for election:", tokenError);
      // Do not fail election creation because of token generation issues
    }

    res.status(201).json(election);
  } catch (error) {
    console.error("Error in createElection:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
};

const updateElection = async (req, res, next) => {
  try {
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    res.json(election);
  } catch (error) {
    next(error);
  }
};

const deleteElection = async (req, res, next) => {
  try {
    console.log("deleteElection called with id:", req.params.id);
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) {
      console.warn("Election not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Election not found" });
    }
    const deletedPosts = await Post.deleteMany({ election: req.params.id });
    console.log("Election deleted successfully. Posts deleted:", deletedPosts.deletedCount);
    res.json({ message: "Election deleted" });
  } catch (error) {
    console.error("Error in deleteElection:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      electionId: req.params.id
    });
    next(error);
  }
};

const toggleElection = async (req, res, next) => {
  try {
    console.log("toggleElection called with id:", req.params.id);
    const election = await Election.findById(req.params.id);
    if (!election) {
      console.error("Election not found:", req.params.id);
      return res.status(404).json({ message: "Election not found" });
    }

    election.isActive = !election.isActive;
    await election.save();

    console.log("Election toggled successfully. New status:", election.isActive);
    res.json({ message: "Election status updated", election });
  } catch (error) {
    console.error("Error in toggleElection:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      electionId: req.params.id
    });
    next(error);
  }
};

const normalizeEligibleGrades = (input) => {
  if (Array.isArray(input)) {
    return input
      .map((grade) => grade && grade.toString().trim())
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((grade) => grade.trim())
      .filter(Boolean);
  }
  return [];
};

const createPost = async (req, res, next) => {
  try {
    console.log("createPost called with body:", req.body);
    const { electionId, name, description, isMandatory = true } = req.body;
    if (!electionId || !name) {
      console.error("Validation failed: Missing electionId or name");
      return res
        .status(400)
        .json({ message: "Election ID and post name are required" });
    }

    const eligibleGrades = normalizeEligibleGrades(req.body.eligibleGrades);

    const post = await Post.create({
      election: electionId,
      name,
      description,
      isMandatory,
      eligibleGrades,
    });

    console.log("Post created successfully:", post._id);
    res.status(201).json(post);
  } catch (error) {
    console.error("Error in createPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (req.body.eligibleGrades !== undefined) {
      updateData.eligibleGrades = normalizeEligibleGrades(req.body.eligibleGrades);
    }
    const post = await Post.findByIdAndUpdate(req.params.postId, updateData, {
      new: true,
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    console.log("deletePost called with id:", req.params.postId);
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      console.warn("Post not found for deletion:", req.params.postId);
      return res.status(404).json({ message: "Post not found" });
    }
    console.log("Post deleted successfully:", req.params.postId);
    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      postId: req.params.postId
    });
    next(error);
  }
};

module.exports = {
  getDashboard,
  createElection,
  updateElection,
  deleteElection,
  toggleElection,
  createPost,
  updatePost,
  deletePost,
};

