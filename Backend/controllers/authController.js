const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const VotingToken = require("../models/VotingToken");
const generateVotingId = require("../utils/generateVotingId");
const generateToken = require("../utils/generateToken");
const config = require("../config");
const { generateCaptcha } = require("../utils/captchaGenerator");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  role: user.role,
  grade: user.grade,
  photoUrl: user.photoUrl || null,
});

// Student registration
const registerStudent = async (req, res, next) => {
  try {
    const { name, grade, dob, username, password, confirmPassword } = req.body;

    if (!name || !grade || !dob || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      password: hashed,
      role: "student",
      grade,
      dob,
    });

    const student = await Student.create({
      user: user._id,
      grade,
      dob,
    });

    user.profileRef = student._id;
    user.profileModel = "Student";
    await user.save();

    // Generate voting IDs for this student for all existing elections
    try {
      const elections = await Election.find().select("_id").lean();
      if (elections.length > 0) {
        const bulkOps = elections.map((election) => ({
          updateOne: {
            filter: { student: student._id, election: election._id },
            update: {
              $setOnInsert: {
                student: student._id,
                election: election._id,
                token: generateVotingId(),
                isUsed: false,
              },
            },
            upsert: true,
          },
        }));
        const result = await VotingToken.bulkWrite(bulkOps, { ordered: false });
        console.log(
          "Voting tokens generated for new student:",
          JSON.stringify(
            {
              matched: result.matchedCount,
              upserts: result.upsertedCount,
              modified: result.modifiedCount,
            },
            null,
            2
          )
        );
      } else {
        console.log("No elections found; skipping token generation for student.");
      }
    } catch (tokenError) {
      console.error("Error generating voting tokens for student:", tokenError);
      // Do not fail student registration because of token generation issues
    }

    const token = generateToken(user);
    return res.status(201).json({
      message: "Student registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Candidate registration
const registerCandidate = async (req, res, next) => {
  try {
    const { name, grade, username, password, confirmPassword, manifesto } =
      req.body;

    if (
      !name ||
      !grade ||
      !username ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      password: hashed,
      role: "candidate",
      grade,
    });

    const candidate = await Candidate.create({
      user: user._id,
      grade,
      manifesto,
      isApproved: false,
    });

    user.profileRef = candidate._id;
    user.profileModel = "Candidate";
    await user.save();

    const token = generateToken(user);
    return res.status(201).json({
      message:
        "Candidate registered successfully. Await admin approval to appear on the ballot.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Login for admin, candidate, student
const login = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: "Username, password, role required" });
    }

    if (role === "student" && !req.body.captcha) {
      return res.status(400).json({ message: "Captcha is required for students" });
    }

    let user;

    if (role === "admin") {
      if (
        username === config.adminUsername &&
        password === config.adminPassword
      ) {
        user = {
          _id: "admin",
          name: "System Administrator",
          username,
          role: "admin",
        };
      } else {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
    } else {
      user = await User.findOne({ username: username.toLowerCase(), role });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    const token = generateToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    return res.json({ user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

const getCaptcha = (req, res) => {
  const { code, token } = generateCaptcha();
  return res.json({ captcha: code, token });
};

module.exports = {
  registerStudent,
  registerCandidate,
  login,
  getProfile,
  getCaptcha,
};

