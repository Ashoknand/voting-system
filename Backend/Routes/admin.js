const express = require("express");
const {
  getDashboard,
  createElection,
  updateElection,
  deleteElection,
  toggleElection,
  createPost,
  updatePost,
  deletePost,
} = require("../controllers/adminController");
const { issueTokenForStudent } = require("../controllers/voteController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

const router = express.Router();

router.use(auth, allowRoles("admin"));

router.get("/dashboard", getDashboard);

router.post("/elections", createElection);
router.put("/elections/:id", updateElection);
router.delete("/elections/:id", deleteElection);
router.patch("/elections/:id/toggle", toggleElection);

router.post("/posts", createPost);
router.put("/posts/:postId", updatePost);
router.delete("/posts/:postId", deletePost);

router.post("/students/:studentId/token", issueTokenForStudent);

module.exports = router;

