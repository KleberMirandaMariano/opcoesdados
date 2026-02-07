from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import List
from .models import (
    OptionRequest, OptionResult, PayoffRequest, PayoffPoint, 
    MarketAsset, MarketIndicator
)
from .logic import calculate_black_scholes, calculate_payoff

app = FastAPI(title="Options Analysis API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Data (Replicating Dashboard.tsx)
MOCK_ASSETS = [
    {"symbol": "PETR4", "name": "Petrobras PN", "price": 36.85, "change": 0.72, "change_percent": 1.99, "volume": 125000000, "high": 37.12, "low": 36.20, "open": 36.20, "close": 36.13},
    {"symbol": "VALE3", "name": "Vale ON", "price": 68.42, "change": -1.23, "change_percent": -1.77, "volume": 89000000, "high": 69.80, "low": 67.95, "open": 69.50, "close": 69.65},
    {"symbol": "ITUB4", "name": "Itaú Unibanco PN", "price": 32.15, "change": 0.45, "change_percent": 1.42, "volume": 67000000, "high": 32.48, "low": 31.78, "open": 31.80, "close": 31.70},
]

MOCK_INDICATORS = [
    {"label": "IBOV", "value": 128456, "change": 1.23, "change_percent": 0.96},
    {"label": "DÓLAR", "value": 5.7423, "change": -0.02, "change_percent": -0.35},
    {"label": "SELIC", "value": 10.50, "change": 0, "change_percent": 0},
]

@app.get("/")
async def root():
    return {"message": "Options Analysis API is running"}

@app.get("/market/indicators", response_model=List[MarketIndicator])
async def get_indicators():
    return MOCK_INDICATORS

@app.get("/market/assets", response_model=List[MarketAsset])
async def get_assets():
    return MOCK_ASSETS

@app.post("/calculate/option", response_model=OptionResult)
async def calculate_option(request: OptionRequest):
    try:
        result = calculate_black_scholes(
            spot=request.spot,
            strike=request.strike,
            maturity=request.maturity,
            volatility=request.volatility / 100.0 if request.volatility > 1.0 else request.volatility,
            risk_free_rate=request.risk_free_rate / 100.0 if request.risk_free_rate > 1.0 else request.risk_free_rate,
            option_type=request.type,
            dividend_yield=request.dividend_yield / 100.0 if request.dividend_yield > 1.0 else request.dividend_yield
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/calculate/payoff", response_model=List[PayoffPoint])
async def post_calculate_payoff(request: PayoffRequest):
    try:
        prices = np.linspace(request.min_price, request.max_price, request.steps)
        result = calculate_payoff(
            spot_prices=prices,
            strike=request.strike,
            premium=request.premium,
            option_type=request.type,
            position=request.position
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
