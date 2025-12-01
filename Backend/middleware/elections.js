const Election = require("../models/Election");

// Ensure the election exists and is currently active
const ensureActiveElection = async (req, res, next) => {
  try {
    const electionId =
      req.params.electionId ||
      req.params.id ||
      req.body.electionId ||
      req.body.election;

    if (!electionId) {
      return res.status(400).json({ message: "Election ID is required" });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    const now = new Date();
    const isActive =
      election.isActive &&
      now >= new Date(election.startDate) &&
      now <= new Date(election.endDate);

    if (!isActive) {
      return res.status(400).json({ message: "Election is not active" });
    }

    req.election = election;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { ensureActiveElection };

