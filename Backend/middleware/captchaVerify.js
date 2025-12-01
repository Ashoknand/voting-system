const { verifyCaptcha } = require("../utils/captchaGenerator");

// Verify captcha using token-based system
const captchaVerify = (req, res, next) => {
  const incoming = (req.body?.captcha || "").toString().trim();
  const token = req.body?.captchaToken || "";

  if (incoming.length === 0) {
    return res.status(400).json({ message: "Captcha is required" });
  }

  if (!token) {
    return res.status(400).json({ message: "Captcha token is required. Please refresh the captcha." });
  }

  // Verify using token-based system
  const isValid = verifyCaptcha(token, incoming);
  if (!isValid) {
    return res.status(401).json({ message: "Captcha validation failed. Please check the code and try again." });
  }

  return next();
};

module.exports = captchaVerify;

