const Farm = require('../models/Farm');

// ==============================
// CREATE FARM
// ==============================
const createFarm = async (req, res) => {
  try {
    const { farmerName, cropType, sowingDate, location, cropGrowthStage } = req.body;

    if (!farmerName || !cropType || !sowingDate || !location) {
      return res.status(400).json({
        message: 'farmerName, cropType, sowingDate, and location are required',
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farm = new Farm({
      user: req.user.id,
      farmerName,
      cropType,
      sowingDate,
      location,
      cropGrowthStage: cropGrowthStage || 2,
    });

    const savedFarm = await farm.save();
    return res.status(201).json(savedFarm);
  } catch (error) {
    console.error('Error creating farm:', error);
    return res.status(500).json({ message: 'Failed to create farm' });
  }
};

// ==============================
// GET ALL FARMS (user's farms only)
// ==============================
const getAllFarms = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farms = await Farm.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(farms);
  } catch (error) {
    console.error('Error fetching farms:', error);
    return res.status(500).json({ message: 'Failed to fetch farms' });
  }
};

// ==============================
// GET FARM BY ID
// ==============================
const getFarmById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farm = await Farm.findOne({ _id: id, user: req.user.id });

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    return res.status(200).json(farm);
  } catch (error) {
    console.error('Error fetching farm by ID:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }

    return res.status(500).json({ message: 'Failed to fetch farm' });
  }
};

// ==============================
// UPDATE FARM OBSERVATION (farmer field check)
// ==============================
const updateFarmObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { pestObserved, leafYellowingObserved, irrigationDoneRecently } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const farm = await Farm.findOne({ _id: id, user: req.user.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    farm.latestObservation = {
      pestObserved: Boolean(pestObserved),
      leafYellowingObserved: Boolean(leafYellowingObserved),
      irrigationDoneRecently: Boolean(irrigationDoneRecently),
      updatedAt: new Date(),
    };
    await farm.save();

    return res.status(200).json({
      message: 'Observation saved',
      latestObservation: farm.latestObservation,
    });
  } catch (error) {
    console.error('Error updating farm observation:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }
    return res.status(500).json({ message: 'Failed to update observation' });
  }
};

module.exports = {
  createFarm,
  getAllFarms,
  getFarmById,
  updateFarmObservation,
};
