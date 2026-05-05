const { getWeatherForDistrict } = require("../services/weatherService");
const { getMarketPrices } = require("../services/marketService");

/**
 * GET /api/dashboard
 * Returns dashboard data for the authenticated user's district
 */
const getDashboardData = async (req, res) => {
  try {
    const district = req.user?.district;

    if (!district) {
      return res.status(400).json({
        message: "User district is required. Please complete your profile.",
      });
    }

    const [weatherData, marketData] = await Promise.all([
      getWeatherForDistrict(district),
      getMarketPrices("Paddy", district),
    ]);

    const { todayWeather, weeklyWeather } = weatherData;

    res.json({
      district,
      todayWeather,
      weeklyWeather,
      market: {
        commodity: marketData.commodity ?? "Paddy",
        averagePrice: marketData.averagePrice,
        trend: marketData.trend ?? "No Data",
      },
    });
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch dashboard data",
    });
  }
};

module.exports = {
  getDashboardData,
};
