import numpy as np
from scipy.stats import norm
from typing import Dict, List, Optional, Union

def calculate_d1_d2(
    spot: float,
    strike: float,
    time: float,
    rate: float,
    vol: float,
    dividend: float = 0.0
) -> tuple:
    """Calculate d1 and d2 for Black-Scholes."""
    d1 = (np.log(spot / strike) + (rate - dividend + 0.5 * vol**2) * time) / (vol * np.sqrt(time))
    d2 = d1 - vol * np.sqrt(time)
    return d1, d2

def calculate_black_scholes(
    spot: float,
    strike: float,
    maturity: float,
    volatility: float,
    risk_free_rate: float,
    option_type: str,
    dividend_yield: float = 0.0
) -> Dict:
    """
    Calculate Black-Scholes option price and Greeks.
    option_type: 'CALL' or 'PUT'
    """
    if maturity <= 0 or volatility <= 0:
        intrinsic = max(0.0, spot - strike) if option_type == 'CALL' else max(0.0, strike - spot)
        return {
            "price": intrinsic,
            "intrinsic_value": intrinsic,
            "time_value": 0.0,
            "greeks": {
                "delta": 0.0,
                "gamma": 0.0,
                "theta": 0.0,
                "vega": 0.0,
                "rho": 0.0
            }
        }

    d1, d2 = calculate_d1_d2(spot, strike, maturity, risk_free_rate, volatility, dividend_yield)
    
    # Normal CDF and PDF
    nd1 = norm.cdf(d1)
    nd2 = norm.cdf(d2)
    n_neg_d1 = norm.cdf(-d1)
    n_neg_d2 = norm.cdf(-d2)
    pdf_d1 = norm.pdf(d1)
    
    exp_div = np.exp(-dividend_yield * maturity)
    exp_rate = np.exp(-risk_free_rate * maturity)
    
    if option_type == 'CALL':
        price = spot * exp_div * nd1 - strike * exp_rate * nd2
        delta = exp_div * nd1
    else:
        price = strike * exp_rate * n_neg_d2 - spot * exp_div * n_neg_d1
        delta = -exp_div * n_neg_d1
        
    intrinsic_value = max(0.0, spot - strike) if option_type == 'CALL' else max(0.0, strike - spot)
    time_value = max(0.0, float(price) - intrinsic_value)
    
    # Gamma
    gamma = exp_div * pdf_d1 / (spot * volatility * np.sqrt(maturity))
    
    # Theta (daily)
    theta_base = -spot * exp_div * pdf_d1 * volatility / (2 * np.sqrt(maturity))
    if option_type == 'CALL':
        theta = theta_base - risk_free_rate * strike * exp_rate * nd2 + dividend_yield * spot * exp_div * nd1
    else:
        theta = theta_base + risk_free_rate * strike * exp_rate * n_neg_d2 - dividend_yield * spot * exp_div * n_neg_d1
    
    theta_daily = theta / 365.0
    
    # Vega (for 1% change in volatility)
    vega = spot * exp_div * pdf_d1 * np.sqrt(maturity) / 100.0
    
    # Rho (for 1% change in rate)
    if option_type == 'CALL':
        rho = strike * maturity * exp_rate * nd2 / 100.0
    else:
        rho = -strike * maturity * exp_rate * n_neg_d2 / 100.0
        
    return {
        "price": max(0.0, float(price)),
        "intrinsic_value": float(intrinsic_value),
        "time_value": float(time_value),
        "greeks": {
            "delta": round(float(delta), 4),
            "gamma": round(float(gamma), 4),
            "theta": round(float(theta_daily), 4),
            "vega": round(float(vega), 4),
            "rho": round(float(rho), 4)
        }
    }

def calculate_payoff(
    spot_prices: np.ndarray,
    strike: float,
    premium: float,
    option_type: str,
    position: str = 'LONG'
) -> List[Dict]:
    """Calculate payoff at different spot prices."""
    if option_type == 'CALL':
        intrinsic = np.maximum(0, spot_prices - strike)
    else:
        intrinsic = np.maximum(0, strike - spot_prices)
        
    if position == 'LONG':
        payoff = intrinsic - premium
    else:
        payoff = premium - intrinsic
        
    return [
        {
            "price": round(float(p), 2),
            "payoff": round(float(pay), 2),
            "intrinsic": round(float(i), 2)
        }
        for p, pay, i in zip(spot_prices, payoff, intrinsic)
    ]

def calculate_implied_volatility(
    market_price: float,
    spot: float,
    strike: float,
    maturity: float,
    rate: float,
    option_type: str,
    dividend: float = 0.0
) -> float:
    """Calculate implied volatility using Newton-Raphson."""
    vol = 0.3  # Initial guess
    tolerance = 0.0001
    max_iterations = 100
    
    for _ in range(max_iterations):
        result = calculate_black_scholes(spot, strike, maturity, vol, rate, option_type, dividend)
        price_diff = result["price"] - market_price
        
        if abs(price_diff) < tolerance:
            return float(vol)
            
        vega = result["greeks"]["vega"] * 100.0
        if vega == 0:
            break
            
        vol = vol - price_diff / vega
        vol = np.clip(vol, 0.01, 5.0)
        
    return float(vol)
