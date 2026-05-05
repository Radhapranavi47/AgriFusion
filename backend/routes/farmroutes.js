const express = require('express');
const {
  createFarm,
  getAllFarms,
  getFarmById,
  updateFarmObservation,
} = require('../controllers/farmController');

const {
  getFarmAdvisory,
  getAdvisoryHistory,
  updateFieldObservation,
} = require('../controllers/advisoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ---------------------
// FARM ROUTES
// ---------------------

// POST /api/farms
router.post('/', protect, createFarm);

// GET /api/farms
router.get('/', protect, getAllFarms);

// GET /api/farms/:id
router.get('/:id', protect, getFarmById);

// PATCH /api/farms/:id/observation (farmer field check submission)
router.patch('/:id/observation', protect, updateFarmObservation);

// POST /api/farms/:farmId/observation
router.post('/:farmId/observation', protect, updateFieldObservation);

// ---------------------
// ADVISORY ROUTES
// ---------------------

// GET /api/farms/:id/advisory-history (must come before /:id/advisory)
router.get('/:id/advisory-history', protect, getAdvisoryHistory);

// GET /api/farms/:id/advisory
router.get('/:id/advisory', protect, getFarmAdvisory);

module.exports = router;
