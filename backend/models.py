from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class OptionRequest(BaseModel):
    symbol: str = "PETR4"
    type: str = Field(..., pattern="^(CALL|PUT)$")
    spot: float
    strike: float
    maturity: float  # Time to maturity in years
    volatility: float
    risk_free_rate: float
    dividend_yield: float = 0.0
    position: str = Field("LONG", pattern="^(LONG|SHORT)$")

class Greeks(BaseModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float

class OptionResult(BaseModel):
    price: float
    intrinsic_value: float
    time_value: float
    greeks: Greeks

class PayoffPoint(BaseModel):
    price: float
    payoff: float
    intrinsic: float

class PayoffRequest(BaseModel):
    strike: float
    premium: float
    type: str = Field(..., pattern="^(CALL|PUT)$")
    position: str = Field("LONG", pattern="^(LONG|SHORT)$")
    min_price: float
    max_price: float
    steps: int = 50

class MarketIndicator(BaseModel):
    label: str
    value: float
    change: float
    change_percent: float

class MarketAsset(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: float
    high: float
    low: float
    open: float
    close: float
