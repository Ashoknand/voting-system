const Candidate = require("../models/Candidate");
const CandidateInPost = require("../models/CandidateInPost");
const Post = require("../models/Post");
const User = require("../models/User");

const listCandidates = async (req, res, next) => {
  try {
    console.log("listCandidates called with query:", req.query);
    const filter = {};
    if (req.query.approved === "true") filter.isApproved = true;
    if (req.query.approved === "false") filter.isApproved = false;

    const candidates = await Candidate.find(filter)
      .populate("user", "name username grade isBlocked")
      .lean();

    const candidateIds = candidates.map((candidate) => candidate._id);
    let assignmentsByCandidate = {};

    if (candidateIds.length > 0) {
      const placements = await CandidateInPost.find({
        candidate: { $in: candidateIds },
      })
        .populate("election", "name")
        .populate("post", "name")
        .lean();

      assignmentsByCandidate = placements.reduce((acc, placement) => {
        const candidateKey = placement.candidate.toString();
        if (!acc[candidateKey]) {
          acc[candidateKey] = [];
        }
        acc[candidateKey].push({
          _id: placement._id,
          election: placement.election,
          post: placement.post,
        });
        return acc;
      }, {});
    }

    const enrichedCandidates = candidates.map((candidate) => ({
      ...candidate,
      assignments: assignmentsByCandidate[candidate._id.toString()] || [],
    }));

    console.log("Candidates loaded:", enrichedCandidates.length, "with assignments");
    res.json(enrichedCandidates);
  } catch (error) {
    console.error("Error in listCandidates:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    next(error);
  }
};

const getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate(
      "user",
      "name username grade isBlocked"
    );
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.json(candidate);
  } catch (error) {
    next(error);
  }
};

const updateCandidate = async (req, res, next) => {
  try {
    console.log("updateCandidate called with id:", req.params.id, "body:", req.body);
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      console.error("Candidate not found:", req.params.id);
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (
      req.user.role === "candidate" &&
      candidate.user.toString() !== req.user._id.toString()
    ) {
      console.error("Unauthorized update attempt");
      return res.status(403).json({ message: "Cannot modify other candidates" });
    }

    const { manifesto, grade, name, username } = req.body;
    if (manifesto !== undefined) candidate.manifesto = manifesto;
    if (grade !== undefined) candidate.grade = grade;

    if (req.files?.photo) {
      candidate.photoUrl = `/uploads/${req.files.photo[0].filename}`;
    }

    if (req.files?.logo) {
      candidate.logoUrl = `/uploads/${req.files.logo[0].filename}`;
    }

    await candidate.save();

    // Update user if admin is updating
    if (req.user.role === "admin") {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (grade) userUpdate.grade = grade;
      if (username) {
        // Check if username is already taken by another user
        const existing = await User.findOne({ 
          username: username.toLowerCase(),
          _id: { $ne: candidate.user }
        });
        if (existing) {
          console.error("Username already taken:", username);
          return res.status(409).json({ message: "Username already taken" });
        }
        userUpdate.username = username.toLowerCase();
      }
      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(candidate.user, userUpdate);
      }
    }

    console.log("Candidate updated successfully:", req.params.id);
    res.json({ message: "Candidate updated", candidate });
  } catch (error) {
    console.error("Error in updateCandidate:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

const approveCandidate = async (req, res, next) => {
  try {
    console.log("approveCandidate called with id:", req.params.id);
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      console.error("Candidate not found:", req.params.id);
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.isApproved = true;
    await candidate.save();

    console.log("Candidate approved successfully:", req.params.id);
    res.json({ message: "Candidate approved", candidate });
  } catch (error) {
    console.error("Error in approveCandidate:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id
    });
    next(error);
  }
};

const assignCandidateToPost = async (req, res, next) => {
  try {
    console.log("assignCandidateToPost called with:", {
      candidateId: req.params.id,
      body: req.body
    });
    const { electionId, postId } = req.body;
    if (!electionId || !postId) {
      console.error("Validation failed: Missing electionId or postId");
      return res
        .status(400)
        .json({ message: "Election ID and Post ID are required" });
    }

    const post = await Post.findOne({ _id: postId, election: electionId });
    if (!post) {
      console.error("Post not found:", { postId, electionId });
      return res.status(404).json({ message: "Post not found for election" });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate || !candidate.isApproved) {
      console.error("Candidate validation failed:", {
        candidateId: req.params.id,
        exists: !!candidate,
        isApproved: candidate?.isApproved
      });
      return res
        .status(400)
        .json({ message: "Candidate not found or not approved" });
    }

    const cip = await CandidateInPost.create({
      election: electionId,
      post: postId,
      candidate: candidate._id,
    });

    console.log("Candidate assigned successfully:", cip._id);
    res.status(201).json({ message: "Candidate placed on ballot", record: cip });
  } catch (error) {
    console.error("Error in assignCandidateToPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      candidateId: req.params.id,
      body: req.body
    });
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Candidate already assigned to this post" });
    }
    next(error);
  }
};

const removeCandidateFromPost = async (req, res, next) => {
  try {
    console.log("removeCandidateFromPost called with:", {
      candidateId: req.params.id,
      body: req.body
    });
    
    const { electionId, postId } = req.body;
    
    if (!electionId || !postId) {
      console.error("Missing required fields:", { electionId, postId });
      return res.status(400).json({ 
        message: "Election ID and Post ID are required" 
      });
    }
    
    if (!req.params.id) {
      console.error("Missing candidate ID in params");
      return res.status(400).json({ 
        message: "Candidate ID is required" 
      });
    }
    
    const result = await CandidateInPost.findOneAndDelete({
      election: electionId,
      post: postId,
      candidate: req.params.id,
    });
    
    console.log("Delete result:", result);
    
    if (!result) {
      console.warn("No matching record found to delete:", {
        election: electionId,
        post: postId,
        candidate: req.params.id
      });
      return res.status(404).json({ 
        message: "Candidate assignment not found" 
      });
    }

    res.json({ message: "Candidate removed from post" });
  } catch (error) {
    console.error("Error in removeCandidateFromPost:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

const deleteCandidate = async (req, res, next) => {
  try {
    console.log("deleteCandidate called with id:", req.params.id);
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      console.error("Candidate not found:", req.params.id);
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Remove all candidate assignments
    await CandidateInPost.deleteMany({ candidate: candidate._id });
    
    // Delete user account
    await User.findByIdAndDelete(candidate.user);
    
    // Delete candidate profile
    await candidate.deleteOne();

    console.log("Candidate deleted successfully:", req.params.id);
    res.json({ message: "Candidate removed" });
  } catch (error) {
    console.error("Error in deleteCandidate:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id
    });
    next(error);
  }
};

const blockCandidate = async (req, res, next) => {
  try {
    console.log("blockCandidate called with id:", req.params.id);
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      console.error("Candidate not found:", req.params.id);
      return res.status(404).json({ message: "Candidate not found" });
    }

    await User.findByIdAndUpdate(candidate.user, { isBlocked: true });
    console.log("Candidate blocked successfully:", req.params.id);
    res.json({ message: "Candidate blocked" });
  } catch (error) {
    console.error("Error in blockCandidate:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id
    });
    next(error);
  }
};

const unblockCandidate = async (req, res, next) => {
  try {
    console.log("unblockCandidate called with id:", req.params.id);
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      console.error("Candidate not found:", req.params.id);
      return res.status(404).json({ message: "Candidate not found" });
    }

    await User.findByIdAndUpdate(candidate.user, { isBlocked: false });
    console.log("Candidate unblocked successfully:", req.params.id);
    res.json({ message: "Candidate unblocked" });
  } catch (error) {
    console.error("Error in unblockCandidate:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      candidateId: req.params.id
    });
    next(error);
  }
};

module.exports = {
  listCandidates,
  getCandidate,
  updateCandidate,
  approveCandidate,
  assignCandidateToPost,
  removeCandidateFromPost,
  deleteCandidate,
  blockCandidate,
  unblockCandidate,
};

