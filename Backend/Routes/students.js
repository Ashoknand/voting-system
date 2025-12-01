const express = require("express");
const {
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  blockStudent,
  unblockStudent,
  getVotingTokens,
} = require("../controllers/studentController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

const router = express.Router();

// Student self-service
router.get(
  "/me/tokens",
  auth,
  allowRoles("student"),
  getVotingTokens
);

// Admin endpoints
router.get("/", auth, allowRoles("admin"), listStudents);
router.get("/:id", auth, allowRoles("admin"), getStudent);
router.put("/:id", auth, allowRoles("admin"), updateStudent);
router.delete("/:id", auth, allowRoles("admin"), deleteStudent);
router.patch("/:id/block", auth, allowRoles("admin"), blockStudent);
router.patch("/:id/unblock", auth, allowRoles("admin"), unblockStudent);

module.exports = router;

