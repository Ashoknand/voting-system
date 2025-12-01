require("dotenv").config();
const path = require("path");

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri:
    process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "72h",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  captchaSecret: process.env.CAPTCHA_SECRET || "12345",
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "uploads"),
};

module.exports = config;

