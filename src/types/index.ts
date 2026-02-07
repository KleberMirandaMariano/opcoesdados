export interface OptionData {
  symbol: string;
  type: 'CALL' | 'PUT';
  strike: number;
  spot: number;
  maturity: number;
  volatility: number;
  riskFreeRate: number;
  dividendYield?: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionResult {
  price: number;
  intrinsicValue: number;
  timeValue: number;
  greeks: Greeks;
}

export interface PayoffPoint {
  price: number;
  payoff: number;
  intrinsic: number;
}

export interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
}

export interface OptionChain {
  symbol: string;
  expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface OptionContract {
  symbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface VolatilityData {
  strike: number;
  impliedVol: number;
  delta: number;
}

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
