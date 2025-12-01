const express = require("express");
const {
  registerForElection,
  getMyRegistrations,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
} = require("../controllers/electionRegistrationController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");

const router = express.Router();

// IMPORTANT: Specific routes must come before parameterized routes
// Candidate routes - specific routes first
router.get(
  "/my",
  auth,
  allowRoles("candidate"),
  getMyRegistrations
);

router.post(
  "/",
  auth,
  allowRoles("candidate"),
  registerForElection
);

// Admin routes - specific routes first
router.get(
  "/",
  auth,
  allowRoles("admin"),
  getAllRegistrations
);

// Parameterized routes come last
router.patch(
  "/:id/approve",
  auth,
  allowRoles("admin"),
  approveRegistration
);

router.patch(
  "/:id/reject",
  auth,
  allowRoles("admin"),
  rejectRegistration
);

module.exports = router;

