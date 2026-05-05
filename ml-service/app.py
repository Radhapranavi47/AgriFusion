import pickle
from datetime import datetime, timedelta
from typing import List

import ee
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ==============================
# CONFIGURATION
# ==============================
GEE_PROJECT_ID = "agri-fusion-488013"
MODEL_PATH = "model.pkl"
ENCODER_PATH = "encoder.pkl"

# ==============================
# FASTAPI APP
# ==============================
app = FastAPI(title="AgriFusion ML Service", version="3.0.0")

ee_initialized = False
model = None
encoder = None


# ==============================
# REQUEST MODELS
# ==============================

class CoordinateRequest(BaseModel):
    coordinates: List[List[List[float]]]


class NDVIResponse(BaseModel):
    ndvi: float
    savi: float


class PredictionRequest(BaseModel):
    ndvi: float
    savi: float
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    crop_growth_stage: float
    pest_flag: int = 0
    yellow_flag: int = 0
    irrigation_flag: int = 0


class PredictionResponse(BaseModel):
    health_prediction: str
    confidence: float


# ==============================
# INITIALIZATION
# ==============================

def initialize_earth_engine():
    global ee_initialized
    if ee_initialized:
        return

    try:
        ee.Initialize(project=GEE_PROJECT_ID)
        ee_initialized = True
        print("✅ Earth Engine initialized.")
    except Exception as e:
        print("❌ Earth Engine init failed:", e)
        ee_initialized = False


def load_model():
    global model, encoder
    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        with open(ENCODER_PATH, "rb") as f:
            encoder = pickle.load(f)

        print("✅ ML model loaded successfully.")
    except Exception as e:
        print("❌ Model loading failed:", e)
        model = None
        encoder = None


@app.on_event("startup")
async def startup_event():
    initialize_earth_engine()
    load_model()


@app.get("/")
async def root():
    return {
        "status": "AgriFusion ML Service Running",
        "earth_engine_initialized": ee_initialized,
        "model_loaded": model is not None
    }


@app.get("/health")
async def health():
    """Lightweight check for Render (free tier health checks)."""
    return {"status": "ok"}


# ==============================
# NDVI + SAVI ENDPOINT
# ==============================

@app.post("/ndvi", response_model=NDVIResponse)
async def calculate_ndvi_savi(request: CoordinateRequest):

    if not ee_initialized:
        initialize_earth_engine()
        if not ee_initialized:
            raise HTTPException(status_code=500, detail="Earth Engine init failed")

    try:
        coordinates = request.coordinates
        if not coordinates or len(coordinates[0]) < 3:
            raise HTTPException(status_code=400, detail="Invalid polygon")

        ee_polygon = ee.Geometry.Polygon(coordinates)

        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        sentinel2 = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")  # Updated dataset
            .filterBounds(ee_polygon)
            .filterDate(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .sort("system:time_start", False)
        )

        image_count = sentinel2.size().getInfo()
        if image_count == 0:
            raise HTTPException(status_code=404, detail="No cloud-free images found")

        image = sentinel2.first()

        ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")

        nir = image.select("B8").multiply(0.0001)
        red = image.select("B4").multiply(0.0001)

        L = 0.5
        savi = (
            nir.subtract(red)
            .divide(nir.add(red).add(L))
            .multiply(1 + L)
            .rename("SAVI")
        )

        indices = ndvi.addBands(savi)

        mean_values = indices.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ee_polygon,
            scale=10,
            maxPixels=1e9,
        )

        result = mean_values.getInfo()

        if result is None or "NDVI" not in result:
            raise HTTPException(status_code=500, detail="Vegetation index calculation failed")

        return NDVIResponse(
            ndvi=round(float(result["NDVI"]), 4),
            savi=round(float(result["SAVI"]), 4),
        )

    except ee.EEException as e:
        raise HTTPException(status_code=500, detail=f"Earth Engine error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# ML PREDICTION ENDPOINT
# ==============================

@app.post("/predict", response_model=PredictionResponse)
async def predict_health(request: PredictionRequest):

    if model is None or encoder is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        features = np.array([[
            request.ndvi,
            request.savi,
            request.temperature,
            request.humidity,
            request.rainfall,
            request.wind_speed,
            request.crop_growth_stage,
            request.pest_flag,
            request.yellow_flag,
            request.irrigation_flag,
        ]])

        # Get prediction
        prediction = model.predict(features)
        decoded_label = encoder.inverse_transform(prediction)[0]

        # Get prediction probabilities
        probabilities = model.predict_proba(features)[0]
        
        # Calculate confidence as max probability rounded to 2 decimals
        confidence = round(float(np.max(probabilities)), 2)

        return PredictionResponse(
            health_prediction=str(decoded_label),
            confidence=confidence
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# RUN SERVER
# ==============================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
