const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadDir } = require("../config");

// Ensure uploads directory exists
// uploadDir from config is already an absolute path (using __dirname)
const uploadsPath = uploadDir;
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
console.log("Gallery uploads directory:", uploadsPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedVideos = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
  
  if (allowedImages.includes(file.mimetype) || allowedVideos.includes(file.mimetype)) {
    return cb(null, true);
  }
  
  return cb(
    new Error("Only image (jpeg, png, webp, gif) and video (mp4, webm, ogg, mov) files are allowed")
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;

