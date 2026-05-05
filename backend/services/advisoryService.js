/**
 * Generate agricultural advisory based on crop health, weather, market conditions, and growth stage.
 * @param {Object} params - Advisory parameters
 * @param {string} params.healthStatus - Crop health status ("Healthy" or "Stressed")
 * @param {number} params.ndvi - NDVI value
 * @param {Object} params.weather - Weather data object with heavyRainExpected, rainfallToday, temperature properties
 * @param {string} params.priceTrend - Market price trend ("Rising" or "Falling")
 * @param {number} params.cropGrowthStage - Crop growth stage (1-4)
 * @returns {Object} Advisory object with advisory message, risk level, and risk score
 */
const generateAdvisory = ({ healthStatus, ndvi, weather, priceTrend, cropGrowthStage }) => {
  let riskScore = 0;

  // Extract weather data
  const heavyRainExpected = weather?.heavyRainExpected || false;
  const rainfall = weather?.rainfallToday || 0;
  const temperature = weather?.temperature || null;

  // 1. Calculate riskScore using weighted scoring

  // NDVI risk scoring
  if (ndvi < 0.4) {
    riskScore += 30;
  } else if (ndvi >= 0.4 && ndvi <= 0.6) {
    riskScore += 15;
  } else if (ndvi > 0.6) {
    riskScore += 5;
  }

  // Weather risk scoring
  if (heavyRainExpected) {
    riskScore += 25;
  }
  if (rainfall > 20) {
    riskScore += 20;
  }
  if (temperature !== null && temperature > 38) {
    riskScore += 15;
  }

  // Health status risk scoring
  if (healthStatus === 'Stressed') {
    riskScore += 30;
  } else if (healthStatus === 'Healthy') {
    riskScore += 5;
  }

  // Growth stage risk scoring
  if (cropGrowthStage >= 4) {
    riskScore += 10;
  }

  // 2. Clamp riskScore between 0 and 100
  riskScore = Math.max(0, Math.min(100, riskScore));

  // 3. Derive riskLevel from riskScore
  let riskLevel;
  if (riskScore <= 30) {
    riskLevel = 'Low';
  } else if (riskScore <= 60) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }

  // 4. Generate advisory message based on risk level and market conditions
  let advisory;

  if (riskLevel === 'High') {
    // High risk scenarios
    if (heavyRainExpected || rainfall > 20) {
      advisory = 'Heavy rainfall expected. Harvest immediately to prevent damage.';
    } else if (healthStatus === 'Stressed' && priceTrend === 'Falling') {
      advisory = 'Crop under stress and prices dropping. Consider early sale.';
    } else if (healthStatus === 'Stressed') {
      advisory = 'Crop health declining. Apply corrective agronomic measures immediately.';
    } else {
      advisory = 'High risk conditions detected. Take immediate action to protect your crop.';
    }
  } else if (riskLevel === 'Medium') {
    // Medium risk scenarios
    if (healthStatus === 'Stressed') {
      advisory = 'Crop health declining. Apply corrective agronomic measures.';
    } else {
      advisory = 'Monitor crop conditions closely. Conditions require attention.';
    }
  } else {
    // Low risk scenarios
    if (priceTrend === 'Rising' && cropGrowthStage >= 3) {
      advisory = 'Crop is healthy. Market is favorable. Wait before selling.';
    } else if (priceTrend === 'Rising') {
      advisory = 'Crop is healthy and market is favorable. Continue monitoring.';
    } else {
      advisory = 'Crop conditions are stable. Continue regular monitoring.';
    }
  }

  return {
    advisory,
    riskLevel,
    riskScore,
  };
};

module.exports = {
  generateAdvisory,
};

