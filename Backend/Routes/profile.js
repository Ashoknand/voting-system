const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// All profile routes require authentication
router.use(auth);

router.get("/", getProfile);
router.put("/", upload.single("photo"), updateProfile);

module.exports = router;

