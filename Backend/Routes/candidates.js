const express = require("express");
const {
  listCandidates,
  getCandidate,
  updateCandidate,
  approveCandidate,
  assignCandidateToPost,
  removeCandidateFromPost,
  deleteCandidate,
  blockCandidate,
  unblockCandidate,
} = require("../controllers/candidateController");
const auth = require("../middleware/auth");
const { allowRoles } = require("../middleware/roles");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", auth, allowRoles("admin"), listCandidates);
router.get("/:id", auth, allowRoles("admin", "candidate"), getCandidate);

router.put(
  "/:id",
  auth,
  allowRoles("candidate", "admin"),
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  updateCandidate
);

router.patch("/:id/approve", auth, allowRoles("admin"), approveCandidate);
router.patch("/:id/block", auth, allowRoles("admin"), blockCandidate);
router.patch("/:id/unblock", auth, allowRoles("admin"), unblockCandidate);
router.delete("/:id", auth, allowRoles("admin"), deleteCandidate);

router.post(
  "/:id/assign",
  auth,
  allowRoles("admin"),
  assignCandidateToPost
);

router.post(
  "/:id/remove",
  auth,
  allowRoles("admin"),
  removeCandidateFromPost
);

module.exports = router;

