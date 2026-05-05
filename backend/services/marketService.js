const axios = require("axios");

// Extract raw API key (in case .env contains extra query params from copy-paste)
const rawKey = process.env.DATA_GOV_API_KEY || "";
const DATA_GOV_API_KEY = rawKey.split("&")[0].trim();

const TARGET_DISTRICTS = ["East Godavari", "West Godavari", "Krishna"];

const DATA_GOV_URL =
  "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24";

const commodityMap = {
  Paddy: "Rice",
  paddy: "Rice",
  Rice: "Rice",
};

// Fetch from government API
async function fetchMarketData(apiCommodity, district = null) {
  const params = {
    "api-key": DATA_GOV_API_KEY,
    format: "json",
    "filters[State]": "Andhra Pradesh",
    "filters[Commodity]": apiCommodity || "Rice",
    limit: 20,
  };
  if (district) {
    params["filters[District]"] = district;
  }

  const response = await axios.get(DATA_GOV_URL, {
    params,
    headers: {
      Accept: "application/json",
    },
  });
  return response.data;
}

// Fetch latest market prices - cropType is app's name (e.g. Paddy). Optional apiCommodity when provided by controller.
const getMarketPrices = async (cropType, district = null, apiCommodity = null) => {
  const commodity = apiCommodity ?? commodityMap[cropType] ?? commodityMap[String(cropType).toLowerCase()] ?? cropType;

  const failResponse = {
    commodity: cropType || "Rice",
    trend: "No Data",
    averagePrice: null,
  };

  if (!DATA_GOV_API_KEY) {
    console.error("[Market] No DATA_GOV_API_KEY configured");
    return failResponse;
  }

  try {
    const data = await fetchMarketData(commodity, district || null);
    const rawRecords = data?.records ?? [];

    const districtsToMatch = district ? [district] : TARGET_DISTRICTS;
    const filtered = rawRecords.filter(
      (r) =>
        r.District &&
        districtsToMatch.some((d) =>
          String(r.District).toLowerCase().includes(String(d).toLowerCase())
        )
    );

    const records = filtered.length > 0 ? filtered : rawRecords;

    if (records.length === 0) {
      return failResponse;
    }

    const parseDate = (s) => {
      if (!s) return 0;
      const [d, m, y] = String(s).split(/[/-]/);
      return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    };
    const sorted = [...records].sort((a, b) => parseDate(b.Arrival_Date) - parseDate(a.Arrival_Date));
    const latest5 = sorted.slice(0, 5);

    const prices = latest5
      .map((r) => {
        const v = r.Modal_Price;
        if (v == null) return NaN;
        const n = Number(String(v).replace(/[^\d.-]/g, ""));
        return isNaN(n) ? NaN : n;
      })
      .filter((n) => !isNaN(n) && n > 0);

    if (prices.length === 0) {
      return failResponse;
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    const average = sum / prices.length;
    const trend = average > 2000 ? "Rising" : average < 2000 ? "Falling" : "Stable";

    return {
      commodity: cropType || "Rice",
      trend,
      averagePrice: Math.round(average),
    };
  } catch (error) {
    const errRes = error?.response;
    console.error("[Market] API Error:", {
      message: error.message,
      status: errRes?.status,
      statusText: errRes?.statusText,
      data: errRes?.data,
    });
    return failResponse;
  }
};

module.exports = {
  getMarketPrices,
};
