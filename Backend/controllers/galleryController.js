const Gallery = require("../models/gallery");
const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../config");

// Get all gallery items (for students)
const getGallery = async (req, res, next) => {
  try {
    const items = await Gallery.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select("-__v");
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Get all gallery items (for admin - includes inactive)
const getAllGallery = async (req, res, next) => {
  try {
    const items = await Gallery.find()
      .sort({ createdAt: -1 })
      .select("-__v");
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// Upload gallery item
const uploadGalleryItem = async (req, res, next) => {
  try {
    console.log("uploadGalleryItem called with body:", req.body);
    if (!req.file) {
      console.error("No file provided in upload request");
      return res.status(400).json({ message: "File is required" });
    }

    const { title, description } = req.body;
    if (!title) {
      // Delete uploaded file if title is missing
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Title is required for gallery upload");
      return res.status(400).json({ message: "Title is required" });
    }

    // Determine file type
    const imageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const fileType = imageMimes.includes(req.file.mimetype) ? "image" : "video";

    // Create file URL - use just the filename since /uploads route serves the directory
    const filename = path.basename(req.file.path);
    const fileUrl = `/uploads/${filename}`;
    
    // Log for debugging
    console.log("Gallery upload:", {
      filePath: req.file.path,
      filename,
      fileUrl,
      fileType,
      uploadDir: require("../config").uploadDir,
    });

    const galleryItem = await Gallery.create({
      title,
      description: description || "",
      fileUrl,
      fileType,
      uploadedBy: "admin",
    });

    console.log("Gallery item uploaded successfully:", galleryItem._id);
    res.status(201).json(galleryItem);
  } catch (error) {
    console.error("Error in uploadGalleryItem:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Deleted uploaded file due to error");
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    next(error);
  }
};

// Update gallery item
const updateGalleryItem = async (req, res, next) => {
  try {
    console.log("updateGalleryItem called with id:", req.params.id, "body:", req.body);
    const { title, description, isActive } = req.body;
    const updateData = {};

    const item = await Gallery.findById(req.params.id);
    if (!item) {
      console.error("Gallery item not found:", req.params.id);
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Handle file replacement if new file is uploaded
    if (req.file) {
      // Delete old file if it exists
      if (item.fileUrl) {
        const oldFilePath = path.join(uploadDir, path.basename(item.fileUrl));
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log("Deleted old file:", oldFilePath);
          } catch (fileError) {
            console.warn("Error deleting old file (continuing):", fileError.message);
          }
        }
      }

      // Determine file type for new file
      const imageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const fileType = imageMimes.includes(req.file.mimetype) ? "image" : "video";
      
      // Create file URL
      const filename = path.basename(req.file.path);
      const fileUrl = `/uploads/${filename}`;
      
      updateData.fileUrl = fileUrl;
      updateData.fileType = fileType;
      console.log("File replaced:", { fileUrl, fileType });
    }

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedItem = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    console.log("Gallery item updated successfully:", req.params.id);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error in updateGalleryItem:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      galleryItemId: req.params.id,
      body: req.body
    });
    next(error);
  }
};

// Delete gallery item
const deleteGalleryItem = async (req, res, next) => {
  try {
    console.log("deleteGalleryItem called with id:", req.params.id);
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      console.error("Gallery item not found:", req.params.id);
      return res.status(404).json({ message: "Gallery item not found" });
    }

    // Delete file from filesystem
    if (item.fileUrl) {
      const filePath = path.join(uploadDir, path.basename(item.fileUrl));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("Deleted file from filesystem:", filePath);
        } catch (fileError) {
          console.warn("Error deleting file from filesystem (continuing):", fileError.message);
        }
      } else {
        console.warn("File not found at path:", filePath);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);
    console.log("Gallery item deleted successfully:", req.params.id);
    res.json({ message: "Gallery item deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGalleryItem:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      galleryItemId: req.params.id
    });
    next(error);
  }
};

module.exports = {
  getGallery,
  getAllGallery,
  uploadGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};

