const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./db");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./Routes/auth");
const studentRoutes = require("./Routes/students");
const candidateRoutes = require("./Routes/candidates");
const electionRoutes = require("./Routes/elections");
const adminRoutes = require("./Routes/admin");
const galleryRoutes = require("./Routes/gallery");
const electionRegistrationRoutes = require("./Routes/electionRegistrations");
const campaignPostRoutes = require("./Routes/campaignPosts");
const profileRoutes = require("./Routes/profile");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads directory - use same path as upload middleware
const { uploadDir } = require("./config");
// uploadDir from config is already an absolute path (using __dirname)
const uploadsPath = uploadDir;
console.log("Serving uploads from:", uploadsPath);
app.use("/uploads", express.static(uploadsPath));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/election-registrations", electionRegistrationRoutes);
app.use("/api/campaign-posts", campaignPostRoutes);
app.use("/api/profile", profileRoutes);

// Ignore favicon requests to prevent 404 errors
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/", (req, res) => {
  res.send("E-Voting Backend Running...");
});

app.use(errorHandler);

// Start Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
