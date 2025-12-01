const express = require("express");
const {
  getGallery,
  getAllGallery,
  uploadGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require("../controllers/galleryController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const upload = require("../middleware/galleryUpload");

const router = express.Router();

// Public route for students to view gallery (requires authentication)
router.get("/", auth, allowRoles("student", "candidate", "admin"), getGallery);

// Admin routes
router.use(auth, allowRoles("admin"));

router.get("/admin/all", getAllGallery);
router.post("/admin/upload", upload.single("file"), uploadGalleryItem);
router.put("/admin/:id", upload.single("file"), updateGalleryItem);
router.delete("/admin/:id", deleteGalleryItem);

module.exports = router;

