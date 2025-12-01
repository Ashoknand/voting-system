const express = require("express");
const {
  registerStudent,
  registerCandidate,
  login,
  getProfile,
  getCaptcha,
} = require("../controllers/authController");
const auth = require("../middleware/auth");
const captchaVerify = require("../middleware/captchaVerify");

const router = express.Router();

const captchaForStudentsOnly = (req, res, next) => {
  // Only require captcha for student role
  const role = (req.body?.role || "").toLowerCase().trim();
  if (role === "admin" || role === "candidate") {
    // Skip captcha verification for admin and candidate
    return next();
  }
  // For student role or if role is not specified, require captcha
  return captchaVerify(req, res, next);
};

router.post("/students/register", captchaVerify, registerStudent);
router.post("/candidates/register", registerCandidate);
router.post("/login", captchaForStudentsOnly, login);
router.get("/me", auth, getProfile);
router.get("/captcha", getCaptcha);

module.exports = router;

