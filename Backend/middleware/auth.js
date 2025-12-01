const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach user to request
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token =
      authHeader.startsWith("Bearer ") && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    let user;
    if (decoded.role === "admin" && decoded.id === "admin") {
      user = {
        _id: "admin",
        name: "System Administrator",
        role: "admin",
        username: "admin",
      };
    } else {
      user = await User.findById(decoded.id).lean(); // Use lean() to get plain object
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      // Check if user is blocked (except for admin routes)
      if (user.isBlocked && user.role !== "admin") {
        console.warn("Blocked user attempted to access:", {
          userId: user._id,
          username: user.username,
          role: user.role
        });
        return res.status(403).json({ message: "Your account has been blocked. Please contact administrator." });
      }
      // Ensure role property exists (fallback to decoded role if missing)
      if (!user.role && decoded.role) {
        user.role = decoded.role;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;


