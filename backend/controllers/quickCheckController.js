const Farm = require('../models/Farm');

/**
 * POST /api/farms/:farmId/quick-check
 * Update farm quickCheck field
 */
const updateQuickCheck = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { pestObserved, leafYellowing, irrigationRecent } = req.body;

    if (!farmId) {
      return res.status(400).json({ message: 'Farm ID is required' });
    }

    const farm = await Farm.findOne({
      _id: farmId,
      user: req.user?.id,
    });

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    farm.quickCheck = {
      pestObserved: Boolean(pestObserved),
      leafYellowing: Boolean(leafYellowing),
      irrigationRecent: Boolean(irrigationRecent),
      updatedAt: new Date(),
    };
    await farm.save();

    return res.status(200).json(farm);
  } catch (error) {
    console.error('updateQuickCheck Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }
    return res.status(500).json({
      message: 'Failed to update quick check',
      error: error.message,
    });
  }
};

module.exports = {
  updateQuickCheck,
};
