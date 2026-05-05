const axios = require("axios");
const Farm = require("../models/Farm");
const Advisory = require("../models/Advisory");
const { getWeather, getPolygonCenter } = require("../services/weatherService");
const { getNDVIAndSAVI } = require("../services/satelliteService");
const { generateAdvisory } = require("../services/advisoryService");
const { calculateGrowthStage } = require("../services/growthStageService");

/**
 * Mock market trend service
 * Replace later with real market API
 */
// const getMarketTrend = async (cropType) => {
//   return "Rising"; // placeholder
// };

const { getMarketPrices } = require("../services/marketService");

/**
 * GET /api/farms/:id/advisory
 */
const getFarmAdvisory = async (req, res) => {
  try {
    // ✅ FIXED: read correct param name
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Farm ID is required" });
    }

    // 1️⃣ Fetch farm (must belong to current user)
    const farm = await Farm.findOne({ _id: id, user: req.user?.id });

    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }

    // 2️⃣ NDVI + SAVI
    const { ndvi, savi } = await getNDVIAndSAVI(
      farm.location.coordinates
    );

    // 3️⃣ Weather
    const center = getPolygonCenter(farm.location.coordinates);
    const weather = await getWeather(center.lat, center.lon);

    // 4️⃣ Market Trend
    const userDistrict = req.user?.district ?? null;
    const marketData = await getMarketPrices(farm.cropType, userDistrict);
    const priceTrend = marketData.trend;

    // 5️⃣ Growth Stage
    const cropGrowthStage = calculateGrowthStage(
      farm.sowingDate
    );

    // 5b️⃣ Baseline risk (BEFORE using latestObservation)
    const baselineRisk =
      (ndvi < 0.5 ? 40 : 10) +
      (weather.heavyRainExpected ? 20 : 0) +
      (weather.temperature > 35 ? 20 : 0);

    const obs = farm.latestObservation;
    const isObsValid =
      obs &&
      obs.updatedAt &&
      Date.now() - new Date(obs.updatedAt).getTime() < 24 * 60 * 60 * 1000;

    if (baselineRisk > 30 && !isObsValid) {
      return res.status(200).json({
        requireFieldCheck: true,
        baselineRisk,
        message: "Please answer quick field check questions",
      });
    }

    // 6️⃣ Call ML service (with quickCheck flags; fallback to 0 if missing)
    const mlServiceUrl = "http://localhost:8000/predict";

    const pestFlag = farm.quickCheck?.pestObserved ? 1 : 0;
    const yellowFlag = farm.quickCheck?.leafYellowing ? 1 : 0;
    const irrigationFlag = farm.quickCheck?.irrigationRecent ? 1 : 0;

    let healthStatus = "Unknown";
    let confidence = null;

    try {
      const mlResponse = await axios.post(
        mlServiceUrl,
        {
          ndvi,
          savi,
          temperature: weather.temperature,
          humidity: weather.humidity,
          rainfall: weather.rainfallToday || 0,
          wind_speed: weather.windSpeed || 0,
          crop_growth_stage: cropGrowthStage,
          pest_flag: pestFlag,
          yellow_flag: yellowFlag,
          irrigation_flag: irrigationFlag,
        },
        { timeout: 15000 }
      );

      healthStatus = mlResponse.data.health_prediction;
      confidence = mlResponse.data.confidence || null;

    } catch (mlError) {
      console.error("ML service failed. Using NDVI fallback.");

      // Fallback logic
      healthStatus = ndvi > 0.5 ? "Healthy" : "Stressed";
      confidence = null;
    }

    // Map ML service prediction to expected format if needed
    if (healthStatus === 0 || healthStatus === "0") {
      healthStatus = "Stressed";
    } else if (healthStatus === 1 || healthStatus === "1") {
      healthStatus = "Healthy";
    }

    // 7️⃣ Generate Advisory
    const advisoryResult = generateAdvisory({
      healthStatus,
      ndvi,
      weather,
      priceTrend,
      cropGrowthStage,
    });

    // Adjust riskScore if confidence is low
    let finalRiskScore = advisoryResult.riskScore;
    if (confidence !== null && confidence < 0.6) {
      finalRiskScore = Math.min(100, advisoryResult.riskScore + 10);
      
      // Recalculate riskLevel if riskScore changed significantly
      let finalRiskLevel = advisoryResult.riskLevel;
      if (finalRiskScore <= 30) {
        finalRiskLevel = 'Low';
      } else if (finalRiskScore <= 60) {
        finalRiskLevel = 'Medium';
      } else {
        finalRiskLevel = 'High';
      }
      advisoryResult.riskLevel = finalRiskLevel;
    }
    advisoryResult.riskScore = finalRiskScore;

    // 8️⃣ Save advisory snapshot to database
    try {
      await Advisory.create({
        farmId: farm._id,
        ndvi,
        savi,
        healthStatus,
        riskLevel: advisoryResult.riskLevel,
        riskScore: finalRiskScore,
        advisory: advisoryResult.advisory,
      });
    } catch (saveError) {
      console.error("Failed to save advisory snapshot:", saveError);
      // Continue even if save fails - don't break the response
    }

    // 9️⃣ Final Response
    return res.status(200).json({
      farmId: id,
      farmerName: farm.farmerName,
      farmName: `${farm.farmerName}'s Farm`,
      cropType: farm.cropType,
      market: {
        commodity: marketData.commodity,
        averagePrice: marketData.averagePrice,
        trend: marketData.trend ?? "No Data",
      },
      ndvi,
      savi,
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfallToday,
        windSpeed: weather.windSpeed,
        heavyRainExpected: weather.heavyRainExpected,
      },
      healthStatus,
      growthStage: cropGrowthStage,
      confidence,
      advisory: advisoryResult.advisory,
      riskLevel: advisoryResult.riskLevel,
      riskScore: finalRiskScore,
    });

  } catch (error) {
    console.error("Advisory Error:", error);
    return res.status(500).json({
      message: "Failed to generate farm advisory",
      error: error.message,
    });
  }
};

/**
 * GET /api/farms/:id/advisory-history
 * Fetch last 10 advisory records for a farm
 */
const getAdvisoryHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Farm ID is required' });
    }

    // Verify farm exists and belongs to current user
    const farm = await Farm.findOne({ _id: id, user: req.user?.id });
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Fetch last 10 advisory records, sorted by createdAt descending
    const advisories = await Advisory.find({ farmId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-__v'); // Exclude version field

    return res.status(200).json({
      farmId: id,
      count: advisories.length,
      advisories,
    });
  } catch (error) {
    console.error('Error fetching advisory history:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }

    return res.status(500).json({
      message: 'Failed to fetch advisory history',
      error: error.message,
    });
  }
};

/**
 * POST /api/advisory/:farmId/observation
 * Update field observation for a farm
 */
const updateFieldObservation = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { pestObserved, leafYellowingObserved, irrigationDoneRecently } = req.body;

    if (!farmId) {
      return res.status(400).json({ message: "Farm ID is required" });
    }

    const farm = await Farm.findOne({
      _id: farmId,
      user: req.user?.id,
    });

    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }

    farm.latestObservation = {
      pestObserved: Boolean(pestObserved),
      leafYellowingObserved: Boolean(leafYellowingObserved),
      irrigationDoneRecently: Boolean(irrigationDoneRecently),
      updatedAt: new Date(),
    };
    await farm.save();

    return res.status(200).json({
      success: true,
      message: "Observation saved",
      latestObservation: farm.latestObservation,
    });
  } catch (error) {
    console.error("updateFieldObservation Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid farm ID" });
    }
    return res.status(500).json({
      message: "Failed to update observation",
      error: error.message,
    });
  }
};

module.exports = {
  getFarmAdvisory,
  getAdvisoryHistory,
  updateFieldObservation,
};