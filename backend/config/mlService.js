/**
 * FastAPI ML service base URL (no trailing slash).
 * Set ML_SERVICE_URL in production (e.g. https://agrifusion-ml.onrender.com).
 */
function mlServiceBase() {
  const raw = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  return String(raw).replace(/\/$/, '');
}

module.exports = {
  mlServiceBase,
  mlNdviUrl: () => `${mlServiceBase()}/ndvi`,
  mlPredictUrl: () => `${mlServiceBase()}/predict`,
};
