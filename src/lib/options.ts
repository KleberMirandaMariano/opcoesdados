import type { OptionData, OptionResult, PayoffPoint, VolatilityData } from '@/types';

// Normal cumulative distribution function
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1 + sign * y);
}

// Normal probability density function
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Calculate d1 and d2 for Black-Scholes
function calculateD1D2(
  spot: number,
  strike: number,
  time: number,
  rate: number,
  vol: number,
  dividend: number = 0
): { d1: number; d2: number } {
  const d1 = (Math.log(spot / strike) + (rate - dividend + 0.5 * vol * vol) * time) / (vol * Math.sqrt(time));
  const d2 = d1 - vol * Math.sqrt(time);
  return { d1, d2 };
}

// Black-Scholes option pricing
export function calculateBlackScholes(data: OptionData): OptionResult {
  const { spot, strike, maturity, volatility, riskFreeRate, type, dividendYield = 0 } = data;
  
  if (maturity <= 0 || volatility <= 0) {
    const intrinsic = type === 'CALL' 
      ? Math.max(0, spot - strike)
      : Math.max(0, strike - spot);
    return {
      price: intrinsic,
      intrinsicValue: intrinsic,
      timeValue: 0,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
    };
  }
  
  const { d1, d2 } = calculateD1D2(spot, strike, maturity, riskFreeRate, volatility, dividendYield);
  
  const nd1 = normalCDF(d1);
  const nd2 = normalCDF(d2);
  const nNegD1 = normalCDF(-d1);
  const nNegD2 = normalCDF(-d2);
  
  let price: number;
  let delta: number;
  
  if (type === 'CALL') {
    price = spot * Math.exp(-dividendYield * maturity) * nd1 - strike * Math.exp(-riskFreeRate * maturity) * nd2;
    delta = Math.exp(-dividendYield * maturity) * nd1;
  } else {
    price = strike * Math.exp(-riskFreeRate * maturity) * nNegD2 - spot * Math.exp(-dividendYield * maturity) * nNegD1;
    delta = -Math.exp(-dividendYield * maturity) * nNegD1;
  }
  
  const intrinsicValue = type === 'CALL'
    ? Math.max(0, spot - strike)
    : Math.max(0, strike - spot);
  
  const timeValue = Math.max(0, price - intrinsicValue);
  
  // Gamma
  const gamma = Math.exp(-dividendYield * maturity) * normalPDF(d1) / (spot * volatility * Math.sqrt(maturity));
  
  // Theta (daily)
  const thetaBase = -spot * Math.exp(-dividendYield * maturity) * normalPDF(d1) * volatility / (2 * Math.sqrt(maturity));
  let theta: number;
  if (type === 'CALL') {
    theta = thetaBase - riskFreeRate * strike * Math.exp(-riskFreeRate * maturity) * nd2 + dividendYield * spot * Math.exp(-dividendYield * maturity) * nd1;
  } else {
    theta = thetaBase + riskFreeRate * strike * Math.exp(-riskFreeRate * maturity) * nNegD2 - dividendYield * spot * Math.exp(-dividendYield * maturity) * nNegD1;
  }
  theta = theta / 365; // Convert to daily
  
  // Vega (for 1% change in volatility)
  const vega = spot * Math.exp(-dividendYield * maturity) * normalPDF(d1) * Math.sqrt(maturity) / 100;
  
  // Rho (for 1% change in rate)
  let rho: number;
  if (type === 'CALL') {
    rho = strike * maturity * Math.exp(-riskFreeRate * maturity) * nd2 / 100;
  } else {
    rho = -strike * maturity * Math.exp(-riskFreeRate * maturity) * nNegD2 / 100;
  }
  
  return {
    price: Math.max(0, price),
    intrinsicValue,
    timeValue,
    greeks: {
      delta: Number(delta.toFixed(4)),
      gamma: Number(gamma.toFixed(4)),
      theta: Number(theta.toFixed(4)),
      vega: Number(vega.toFixed(4)),
      rho: Number(rho.toFixed(4))
    }
  };
}

// Calculate payoff at different spot prices
export function calculatePayoff(
  spotPrices: number[],
  strike: number,
  premium: number,
  type: 'CALL' | 'PUT',
  position: 'LONG' | 'SHORT' = 'LONG'
): PayoffPoint[] {
  return spotPrices.map(price => {
    let intrinsic = 0;
    if (type === 'CALL') {
      intrinsic = Math.max(0, price - strike);
    } else {
      intrinsic = Math.max(0, strike - price);
    }
    
    let payoff = position === 'LONG' ? intrinsic - premium : premium - intrinsic;
    
    return {
      price: Number(price.toFixed(2)),
      payoff: Number(payoff.toFixed(2)),
      intrinsic: Number(intrinsic.toFixed(2))
    };
  });
}

// Generate spot price range around strike
export function generatePriceRange(
  strike: number,
  range: number = 0.3,
  steps: number = 50
): number[] {
  const min = strike * (1 - range);
  const max = strike * (1 + range);
  const step = (max - min) / steps;
  
  const prices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    prices.push(min + step * i);
  }
  return prices;
}

// Calculate implied volatility (simplified approximation)
export function calculateImpliedVolatility(
  marketPrice: number,
  spot: number,
  strike: number,
  maturity: number,
  rate: number,
  type: 'CALL' | 'PUT'
): number {
  let vol = 0.3; // Initial guess
  const tolerance = 0.0001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const result = calculateBlackScholes({
      symbol: '',
      type,
      spot,
      strike,
      maturity,
      volatility: vol,
      riskFreeRate: rate
    });
    
    const priceDiff = result.price - marketPrice;
    
    if (Math.abs(priceDiff) < tolerance) {
      return vol;
    }
    
    // Vega tells us how much price changes with volatility
    const vega = result.greeks.vega * 100;
    if (vega === 0) break;
    
    vol = vol - priceDiff / vega;
    
    if (vol <= 0) vol = 0.01;
    if (vol > 5) vol = 5;
  }
  
  return vol;
}

// Generate volatility smile data
export function generateVolatilitySmile(
  spot: number,
  strikes: number[],
  maturity: number,
  rate: number,
  baseVol: number = 0.3
): VolatilityData[] {
  return strikes.map(strike => {
    // Simulate volatility skew/smile
    const moneyness = strike / spot;
    const skew = Math.pow(moneyness - 1, 2) * 0.1 + (1 - moneyness) * 0.05;
    const impliedVol = baseVol + skew;
    
    return {
      strike,
      impliedVol: Number(impliedVol.toFixed(4)),
      delta: Number(normalCDF((Math.log(spot / strike) + (rate + 0.5 * impliedVol * impliedVol) * maturity) / (impliedVol * Math.sqrt(maturity))).toFixed(4))
    };
  });
}

// Format currency
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Format number
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Calculate break-even points
export function calculateBreakEven(
  strike: number,
  premium: number,
  type: 'CALL' | 'PUT'
): number {
  if (type === 'CALL') {
    return strike + premium;
  } else {
    return strike - premium;
  }
}

// Calculate max profit/loss
export function calculateMaxProfitLoss(
  strike: number,
  premium: number,
  type: 'CALL' | 'PUT',
  position: 'LONG' | 'SHORT'
): { maxProfit: string; maxLoss: string } {
  if (position === 'LONG') {
    return {
      maxProfit: type === 'CALL' ? 'Ilimitado' : formatCurrency(strike - premium),
      maxLoss: formatCurrency(premium)
    };
  } else {
    return {
      maxProfit: formatCurrency(premium),
      maxLoss: type === 'CALL' ? 'Ilimitado' : formatCurrency(strike - premium)
    };
  }
}
