const express = require("express");
const {
  createCampaignPost,
  getMyCampaignPosts,
  getApprovedCampaignPosts,
  getAllCampaignPosts,
  approveCampaignPost,
  rejectCampaignPost,
  updateCampaignPost,
  deleteCampaignPost,
} = require("../controllers/campaignPostController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const upload = require("../middleware/upload");

const router = express.Router();

// IMPORTANT: Specific routes must come before parameterized routes
// Public route - students can view approved campaign posts
router.get("/approved", getApprovedCampaignPosts);

// Candidate routes - specific routes first
router.get(
  "/my",
  auth,
  allowRoles("candidate"),
  getMyCampaignPosts
);

router.post(
  "/",
  auth,
  allowRoles("candidate"),
  upload.single("image"),
  createCampaignPost
);

// Admin routes - specific routes first
router.get(
  "/",
  auth,
  allowRoles("admin"),
  getAllCampaignPosts
);

// Parameterized routes come last
router.put(
  "/:id",
  auth,
  allowRoles("candidate", "admin"),
  upload.single("image"),
  updateCampaignPost
);

router.delete(
  "/:id",
  auth,
  allowRoles("candidate", "admin"),
  deleteCampaignPost
);

router.patch(
  "/:id/approve",
  auth,
  allowRoles("admin"),
  approveCampaignPost
);

router.patch(
  "/:id/reject",
  auth,
  allowRoles("admin"),
  rejectCampaignPost
);

module.exports = router;

