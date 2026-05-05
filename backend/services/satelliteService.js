const axios = require("axios");
const { mlNdviUrl } = require("../config/mlService");

/**
 * Calls Python NDVI microservice to calculate NDVI and SAVI.
 * @param {Array} polygonCoordinates - GeoJSON polygon coordinates [[[lon, lat], ...]]
 * @returns {Promise<{ndvi: number, savi: number}>}
 */
const getNDVIAndSAVI = async (polygonCoordinates) => {
  try {
    if (!polygonCoordinates || !Array.isArray(polygonCoordinates)) {
      throw new Error("Invalid polygon coordinates");
    }

    const response = await axios.post(
      mlNdviUrl(),
      {
        coordinates: polygonCoordinates,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60 seconds (Earth Engine can be slow)
      }
    );

    if (!response.data || response.data.ndvi === undefined) {
      throw new Error("Invalid response from NDVI service");
    }

    return {
      ndvi: response.data.ndvi,
      savi: response.data.savi,
    };

  } catch (error) {
    console.error("NDVI Service Error:", error.message);

    if (error.response) {
      throw new Error(error.response.data.detail || "NDVI service failed");
    }

    throw new Error("Could not connect to NDVI microservice");
  }
};

module.exports = {
  getNDVIAndSAVI,
};
