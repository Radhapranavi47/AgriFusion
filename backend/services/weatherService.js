const axios = require('axios');
require('dotenv').config();

const getWeather = async (lat, lon) => {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;

  if (!apiKey) {
    throw new Error('VISUAL_CROSSING_API_KEY is not set in environment variables');
  }

  if (!lat || !lon) {
    throw new Error('Latitude and longitude are required');
  }

  try {
    const baseUrl = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
    const url = `${baseUrl}/${lat},${lon}?unitGroup=metric&key=${apiKey}&contentType=json`;

    const response = await axios.get(url);

    if (!response.data) {
      throw new Error('Invalid response from weather API');
    }

    const { currentConditions, days } = response.data;

    if (!currentConditions || !days || !Array.isArray(days)) {
      throw new Error('Unexpected response structure from weather API');
    }

    // Extract current weather
    const temperature = currentConditions.temp || null;
    const humidity = currentConditions.humidity || null;
    const windSpeed = currentConditions.windspeed || null;

    // Extract today's rainfall (from first day in forecast)
    const rainfallToday = days[0]?.precip || 0;

    // Extract next 3 days rainfall forecast
    const rainNext3Days = [];
    for (let i = 1; i <= 3 && i < days.length; i++) {
      rainNext3Days.push({
        date: days[i].datetime || null,
        rainfall: days[i].precip || 0,
      });
    }

    // Check if any day has heavy rain (> 20mm)
    const heavyRainExpected = rainNext3Days.some((day) => day.rainfall > 20) || rainfallToday > 20;

    return {
      temperature,
      humidity,
      windSpeed,
      rainfallToday,
      rainNext3Days,
      heavyRainExpected,
    };
  } catch (error) {
    if (error.response) {
      // API returned an error response
      throw new Error(`Weather API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from weather API. Please check your internet connection.');
    } else {
      // Error in request setup
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }
};

const getPolygonCenter = (polygonCoordinates) => {
  if (!polygonCoordinates || !Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) {
    throw new Error('Invalid polygon coordinates');
  }

  // Extract the first ring (exterior ring) from GeoJSON Polygon format
  const exteriorRing = polygonCoordinates[0];

  if (!exteriorRing || !Array.isArray(exteriorRing) || exteriorRing.length === 0) {
    throw new Error('Invalid polygon ring');
  }

  // Calculate average latitude and longitude
  let sumLat = 0;
  let sumLon = 0;
  const pointCount = exteriorRing.length;

  for (const point of exteriorRing) {
    if (!Array.isArray(point) || point.length < 2) {
      throw new Error('Invalid coordinate point');
    }
    const [lon, lat] = point;
    sumLat += lat;
    sumLon += lon;
  }

  return {
    lat: sumLat / pointCount,
    lon: sumLon / pointCount,
  };
};

// Andhra Pradesh district coordinates (approximate center)
const DISTRICT_COORDS = {
  'East Godavari': { lat: 16.9891, lon: 82.2475 },
  'West Godavari': { lat: 16.7050, lon: 81.1047 },
  Krishna: { lat: 16.5062, lon: 80.6480 },
  Guntur: { lat: 16.3067, lon: 80.4365 },
  Prakasam: { lat: 15.9129, lon: 79.7400 },
  Nellore: { lat: 14.4426, lon: 79.9865 },
  Chittoor: { lat: 13.2186, lon: 79.0962 },
  Anantapur: { lat: 14.6819, lon: 77.6006 },
  Kurnool: { lat: 15.8281, lon: 78.0373 },
  Kadapa: { lat: 14.4673, lon: 78.8242 },
};

const resolveDistrictCoords = (district) => {
  if (!district) return null;
  const key = Object.keys(DISTRICT_COORDS).find(
    (k) => k.toLowerCase() === String(district).toLowerCase()
  );
  return key ? DISTRICT_COORDS[key] : { lat: 16.5062, lon: 80.6480 }; // default: Vijayawada
};

/**
 * Fetch weather for a district (today + next 7 days)
 */
const getWeatherForDistrict = async (district) => {
  const coords = resolveDistrictCoords(district);
  if (!coords) throw new Error('District is required');
  return getWeatherWithWeekly(coords.lat, coords.lon);
};

/**
 * Fetch weather with today + weekly forecast (next 7 days)
 */
const getWeatherWithWeekly = async (lat, lon) => {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY;
  if (!apiKey) throw new Error('VISUAL_CROSSING_API_KEY is not set');
  if (!lat || !lon) throw new Error('Latitude and longitude are required');

  try {
    const baseUrl = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';
    const url = `${baseUrl}/${lat},${lon}?unitGroup=metric&key=${apiKey}&contentType=json`;

    const response = await axios.get(url);
    if (!response.data) throw new Error('Invalid response from weather API');

    const { currentConditions, days } = response.data;
    if (!currentConditions || !days || !Array.isArray(days)) {
      throw new Error('Unexpected response structure from weather API');
    }

    const todayWeather = {
      temperature: currentConditions.temp ?? null,
      humidity: currentConditions.humidity ?? null,
      windSpeed: currentConditions.windspeed ?? null,
      rainfallToday: days[0]?.precip ?? 0,
    };

    const weeklyWeather = days.slice(0, 7).map((d) => ({
      date: d.datetime ?? null,
      temperature: d.tempmax ?? d.temp ?? null,
      rainfall: d.precip ?? 0,
    }));

    return { todayWeather, weeklyWeather };
  } catch (error) {
    if (error.response) {
      throw new Error(`Weather API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    }
    if (error.request) throw new Error('No response from weather API');
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
};

module.exports = {
  getWeather,
  getPolygonCenter,
  getWeatherForDistrict,
  getWeatherWithWeekly,
};

