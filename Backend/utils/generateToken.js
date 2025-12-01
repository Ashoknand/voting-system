const jwt = require("jsonwebtoken");

// Generate JWT for user authentication
const generateToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    username: user.username,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
};

module.exports = generateToken;


