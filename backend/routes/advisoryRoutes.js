const express = require("express");
const { updateFieldObservation } = require("../controllers/advisoryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/advisory/:farmId/observation
router.post("/:farmId/observation", protect, updateFieldObservation);

module.exports = router;
