const express = require('express');
const { updateQuickCheck } = require('../controllers/quickCheckController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/farms/:farmId/quick-check
router.post('/:farmId/quick-check', protect, updateQuickCheck);

module.exports = router;
