const express = require("express");
const {
  listElections,
  getElection,
  getPosts,
  getBallot,
  getResults,
} = require("../controllers/electionController");
const {
  requestToken,
  validateToken,
  castBallot,
} = require("../controllers/voteController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const { ensureActiveElection } = require("../middleware/elections");

const router = express.Router();

router.get("/", listElections);
router.get("/tokens/:token", validateToken);
router.get("/:id/results", auth, allowRoles("admin", "student"), getResults);
router.get("/:id/posts", getPosts);
router.get("/:id/ballot", auth, allowRoles("student", "admin"), getBallot);
router.get("/:id", getElection);

router.post(
  "/:id/token",
  auth,
  allowRoles("student"),
  ensureActiveElection,
  (req, res, next) => {
    req.body.electionId = req.params.id;
    next();
  },
  requestToken
);

router.post(
  "/:id/cast",
  auth,
  allowRoles("student"),
  ensureActiveElection,
  (req, res, next) => {
    req.body.electionId = req.params.id;
    next();
  },
  castBallot
);

module.exports = router;

