const User = require("../models/User");
const Student = require("../models/Student");
const Candidate = require("../models/Candidate");
const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../config");

// Get user profile with full details
const getProfile = async (req, res, next) => {
  try {
    console.log("getProfile called for user:", req.user._id);
    let profileData = {};

    if (req.user.role === "admin") {
      // Admin profile
      profileData = {
        _id: req.user._id,
        name: req.user.name || "System Administrator",
        username: req.user.username || "admin",
        role: "admin",
        photoUrl: req.user.photoUrl || null,
      };
    } else {
      // Get user with populated profile
      const user = await User.findById(req.user._id)
        .select("-password")
        .lean();

      if (!user) {
        console.error("User not found:", req.user._id);
        return res.status(404).json({ message: "User not found" });
      }

      profileData = {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        grade: user.grade,
        dob: user.dob,
        photoUrl: user.photoUrl || null,
        createdAt: user.createdAt,
      };

      // Get profile-specific data
      if (user.profileModel === "Student" && user.profileRef) {
        const student = await Student.findById(user.profileRef).lean();
        if (student) {
          profileData.student = {
            _id: student._id,
            grade: student.grade,
            dob: student.dob,
            hasVoted: student.hasVoted,
            photoUrl: student.photoUrl || null,
          };
          // Use student photo if available, otherwise user photo
          if (student.photoUrl) {
            profileData.photoUrl = student.photoUrl;
          }
        }
      } else if (user.profileModel === "Candidate" && user.profileRef) {
        const candidate = await Candidate.findById(user.profileRef)
          .populate("user", "name username")
          .lean();
        if (candidate) {
          profileData.candidate = {
            _id: candidate._id,
            grade: candidate.grade,
            manifesto: candidate.manifesto,
            photoUrl: candidate.photoUrl || null,
            logoUrl: candidate.logoUrl || null,
            isApproved: candidate.isApproved,
          };
          // Use candidate photo if available, otherwise user photo
          if (candidate.photoUrl) {
            profileData.photoUrl = candidate.photoUrl;
          }
        }
      }
    }

    console.log("Profile retrieved successfully");
    res.json(profileData);
  } catch (error) {
    console.error("Error in getProfile:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    console.log("updateProfile called for user:", req.user._id, "body:", req.body);
    const { name, grade, dob } = req.body;

    if (req.user.role === "admin") {
      // Admin can only update name and photo
      const updateData = {};
      if (name) updateData.name = name;
      
      if (req.file) {
        // Delete old photo if exists
        if (req.user.photoUrl) {
          const oldFilePath = path.join(uploadDir, path.basename(req.user.photoUrl));
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
              console.log("Deleted old admin photo:", oldFilePath);
            } catch (fileError) {
              console.warn("Error deleting old photo (continuing):", fileError.message);
            }
          }
        }
        updateData.photoUrl = `/uploads/${req.file.filename}`;
      }

      // For admin, we need to handle it differently since it's not in DB
      if (Object.keys(updateData).length > 0) {
        // Admin is a special case - we'll just return success
        // In a real system, you'd store admin data in DB
        console.log("Admin profile update (not persisted):", updateData);
        return res.json({
          message: "Profile updated",
          profile: {
            ...req.user,
            ...updateData,
          },
        });
      }
    } else {
      // Regular user update
      const user = await User.findById(req.user._id);
      if (!user) {
        console.error("User not found:", req.user._id);
        return res.status(404).json({ message: "User not found" });
      }

      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (grade) userUpdate.grade = grade;
      if (dob) userUpdate.dob = dob;

      // Handle photo upload
      if (req.file) {
        // Delete old photo if exists
        if (user.photoUrl) {
          const oldFilePath = path.join(uploadDir, path.basename(user.photoUrl));
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
              console.log("Deleted old user photo:", oldFilePath);
            } catch (fileError) {
              console.warn("Error deleting old photo (continuing):", fileError.message);
            }
          }
        }
        userUpdate.photoUrl = `/uploads/${req.file.filename}`;
      }

      // Update user
      if (Object.keys(userUpdate).length > 0) {
        Object.assign(user, userUpdate);
        await user.save();
      }

      // Update profile-specific data
      if (user.profileModel === "Student" && user.profileRef) {
        const student = await Student.findById(user.profileRef);
        if (student) {
          const studentUpdate = {};
          if (grade) studentUpdate.grade = grade;
          if (dob) studentUpdate.dob = dob;

          // Handle student photo
          if (req.file) {
            // Delete old student photo if exists
            if (student.photoUrl) {
              const oldFilePath = path.join(uploadDir, path.basename(student.photoUrl));
              if (fs.existsSync(oldFilePath)) {
                try {
                  fs.unlinkSync(oldFilePath);
                  console.log("Deleted old student photo:", oldFilePath);
                } catch (fileError) {
                  console.warn("Error deleting old student photo (continuing):", fileError.message);
                }
              }
            }
            studentUpdate.photoUrl = `/uploads/${req.file.filename}`;
          }

          if (Object.keys(studentUpdate).length > 0) {
            Object.assign(student, studentUpdate);
            await student.save();
          }
        }
      } else if (user.profileModel === "Candidate" && user.profileRef) {
        const candidate = await Candidate.findById(user.profileRef);
        if (candidate) {
          const candidateUpdate = {};
          if (grade) candidateUpdate.grade = grade;

          // Handle candidate photo
          if (req.file) {
            // Delete old candidate photo if exists
            if (candidate.photoUrl) {
              const oldFilePath = path.join(uploadDir, path.basename(candidate.photoUrl));
              if (fs.existsSync(oldFilePath)) {
                try {
                  fs.unlinkSync(oldFilePath);
                  console.log("Deleted old candidate photo:", oldFilePath);
                } catch (fileError) {
                  console.warn("Error deleting old candidate photo (continuing):", fileError.message);
                }
              }
            }
            candidateUpdate.photoUrl = `/uploads/${req.file.filename}`;
          }

          if (Object.keys(candidateUpdate).length > 0) {
            Object.assign(candidate, candidateUpdate);
            await candidate.save();
          }
        }
      }

      console.log("Profile updated successfully");
      res.json({ message: "Profile updated successfully" });
    }
  } catch (error) {
    console.error("Error in updateProfile:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      userId: req.user._id,
      body: req.body
    });
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

