const Post = require("../models/Post");
const CandidateInPost = require("../models/CandidateInPost");
const Candidate = require("../models/Candidate");

const listPosts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.electionId) {
      filter.election = req.query.electionId;
    }
    const posts = await Post.find(filter).sort({ createdAt: 1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
};

const getPostCandidates = async (req, res, next) => {
  try {
    const data = await CandidateInPost.find({ post: req.params.id })
      .populate({
        path: "candidate",
        populate: {
          path: "user",
          select: "name grade username",
        },
      })
      .lean();

    const response = data.map((item) => ({
      id: item.candidate._id,
      name: item.candidate.user?.name,
      grade: item.candidate.grade,
      manifesto: item.candidate.manifesto,
      photoUrl: item.candidate.photoUrl,
      logoUrl: item.candidate.logoUrl,
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPosts,
  getPost,
  getPostCandidates,
};

