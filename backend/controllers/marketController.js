const { getMarketPrices } = require("../services/marketService");

const commodityMap = {
  Paddy: "Rice",
  paddy: "Rice",
  Rice: "Rice",
};

const getMarketData = async (req, res) => {
  try {
    const cropType = req.params.commodity;
    const district = req.user?.district ?? null;

    if (!cropType) {
      return res.status(400).json({
        message: "Commodity is required",
      });
    }

    const apiCommodity = commodityMap[cropType] ?? commodityMap[String(cropType).toLowerCase()] ?? cropType;
    const data = await getMarketPrices(cropType, district, apiCommodity);

    res.json({
      commodity: cropType,
      trend: data.trend,
      averagePrice: data.averagePrice,
    });
  } catch (error) {
    console.error("[Market Controller] Error:", error);
    res.status(500).json({
      message: "Failed to fetch market data",
    });
  }
};

module.exports = {
  getMarketData,
};
