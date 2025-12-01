const Student = require("../models/Student");
const User = require("../models/User");
const VotingToken = require("../models/VotingToken");
const Vote = require("../models/Vote");

const listStudents = async (req, res, next) => {
  try {
    console.log("listStudents called with query:", req.query);
    const filter = {};
    if (req.query.blocked === "true") {
      // Find students with blocked users
      const blockedUsers = await User.find({ isBlocked: true, role: "student" }).select("_id").lean();
      filter.user = { $in: blockedUsers.map(u => u._id) };
    } else if (req.query.blocked === "false") {
      const activeUsers = await User.find({ isBlocked: false, role: "student" }).select("_id").lean();
      filter.user = { $in: activeUsers.map(u => u._id) };
    }

    const students = await Student.find(filter)
      .populate("user", "name username grade createdAt isBlocked")
      .lean();

    console.log("Students loaded:", students.length);
    res.json(students);
  } catch (error) {
    console.error("Error in listStudents:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "user",
      "name username grade dob"
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    console.log("updateStudent called with id:", req.params.id, "body:", req.body);
    const { grade, name, dob, username } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.error("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    if (grade) student.grade = grade;
    if (dob) student.dob = dob;
    await student.save();

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (grade) userUpdate.grade = grade;
    if (username) {
      // Check if username is already taken by another user
      const existing = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: student.user }
      });
      if (existing) {
        console.error("Username already taken:", username);
        return res.status(409).json({ message: "Username already taken" });
      }
      userUpdate.username = username.toLowerCase();
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(student.user, userUpdate);
    }

    console.log("Student updated successfully:", req.params.id);
    res.json({ message: "Student updated", student });
  } catch (error) {
    console.error("Error in updateStudent:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      studentId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    console.log("deleteStudent called with id:", req.params.id);
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.error("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    const userId = student.user;
    const studentId = student._id;

    console.log("Deleting student with ID:", studentId, "and user ID:", userId);

    // Delete associated votes first
    try {
      const voteResult = await Vote.deleteMany({ student: studentId });
      console.log("Deleted votes:", voteResult.deletedCount);
    } catch (voteError) {
      console.warn("Error deleting votes (continuing):", voteError.message);
    }
    
    // Delete voting tokens
    try {
      const tokenResult = await VotingToken.deleteMany({ student: studentId });
      console.log("Deleted voting tokens:", tokenResult.deletedCount);
    } catch (tokenError) {
      console.warn("Error deleting voting tokens (continuing):", tokenError.message);
    }

    // Delete user account if it exists
    if (userId) {
      try {
        await User.findByIdAndDelete(userId);
        console.log("Deleted user:", userId);
      } catch (userError) {
        console.warn("Error deleting user (continuing):", userError.message);
      }
    }
    
    // Delete student profile last
    await student.deleteOne();
    console.log("Deleted student profile:", studentId);

    console.log("Student deleted successfully:", req.params.id);
    res.json({ message: "Student removed" });
  } catch (error) {
    console.error("Error in deleteStudent:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      studentId: req.params.id
    });
    next(error);
  }
};

const blockStudent = async (req, res, next) => {
  try {
    console.log("blockStudent called with id:", req.params.id);
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.error("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    await User.findByIdAndUpdate(student.user, { isBlocked: true });
    console.log("Student blocked successfully:", req.params.id);
    res.json({ message: "Student blocked" });
  } catch (error) {
    console.error("Error in blockStudent:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      studentId: req.params.id
    });
    next(error);
  }
};

const unblockStudent = async (req, res, next) => {
  try {
    console.log("unblockStudent called with id:", req.params.id);
    const student = await Student.findById(req.params.id);
    if (!student) {
      console.error("Student not found:", req.params.id);
      return res.status(404).json({ message: "Student not found" });
    }

    await User.findByIdAndUpdate(student.user, { isBlocked: false });
    console.log("Student unblocked successfully:", req.params.id);
    res.json({ message: "Student unblocked" });
  } catch (error) {
    console.error("Error in unblockStudent:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      studentId: req.params.id
    });
    next(error);
  }
};

const getVotingTokens = async (req, res, next) => {
  try {
    const tokens = await VotingToken.find({ student: req.user.profileRef })
      .populate("election", "name startDate endDate")
      .lean();

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  blockStudent,
  unblockStudent,
  getVotingTokens,
};

