const Election = require("../models/Election");
const Post = require("../models/Post");
const CandidateInPost = require("../models/CandidateInPost");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

const listElections = async (req, res, next) => {
  try {
    const now = new Date();
    const filter = {};
    if (req.query.active === "true") {
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gte: now };
    }

    const elections = await Election.find(filter).sort({ startDate: 1 });
    res.json(elections);
  } catch (error) {
    next(error);
  }
};

const getElection = async (req, res, next) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    res.json(election);
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ election: req.params.id }).sort({
      createdAt: 1,
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

const getBallot = async (req, res, next) => {
  try {
    const posts = await Post.find({ election: req.params.id }).lean();
    const candidateMap = await CandidateInPost.find({
      election: req.params.id,
    })
      .populate({
        path: "candidate",
        populate: {
          path: "user",
          select: "name grade username",
        },
      })
      .lean();

    const grouped = posts.map((post) => ({
      ...post,
      candidates: candidateMap
        .filter((c) => c.post.toString() === post._id.toString())
        .map((record) => ({
          id: record.candidate._id,
          name: record.candidate.user?.name,
          grade: record.candidate.grade,
          manifesto: record.candidate.manifesto,
          photoUrl: record.candidate.photoUrl,
          logoUrl: record.candidate.logoUrl,
        })),
    }));

    res.json(grouped);
  } catch (error) {
    next(error);
  }
};

const getResults = async (req, res, next) => {
  try {
    const pipeline = [
      { $match: { election: req.params.id } },
      {
        $group: {
          _id: { candidate: "$candidate", post: "$post" },
          votes: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "_id.candidate",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $lookup: {
          from: "users",
          localField: "candidate.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "posts",
          localField: "_id.post",
          foreignField: "_id",
          as: "post",
        },
      },
      { $unwind: "$post" },
      {
        $project: {
          candidateId: "$candidate._id",
          candidateName: "$user.name",
          photoUrl: "$candidate.photoUrl",
          logoUrl: "$candidate.logoUrl",
          postName: "$post.name",
          votes: 1,
        },
      },
      { $sort: { "postName": 1, votes: -1 } },
    ];

    const results = await Vote.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listElections,
  getElection,
  getPosts,
  getBallot,
  getResults,
};

