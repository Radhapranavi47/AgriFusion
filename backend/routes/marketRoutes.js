const express = require("express");
const { getMarketData } = require("../controllers/marketController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/market/:commodity
router.get("/:commodity", protect, getMarketData);

module.exports = router;