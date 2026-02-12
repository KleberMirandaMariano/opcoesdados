
export enum OptionType {
    CALL = 'CALL',
    PUT = 'PUT'
}

export enum MoneyStatus {
    ITM = 'ITM', // In the Money (Dentro do Dinheiro)
    ATM = 'ATM', // At the Money (No Dinheiro)
    OTM = 'OTM'  // Out of the Money (Fora do Dinheiro)
}

export interface StockData {
    ticker: string;
    name: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    sources?: { title: string; uri: string }[];
}

export interface OptionData {
    id: string;
    ticker: string;
    type: OptionType;
    strike: number;
    bidPrice: number; // Preço que o mercado paga (venda do usuário)
    askPrice: number; // Preço que o mercado cobra (compra do usuário)
    premium: number;  // Preço médio
    expiry: string;
    status: MoneyStatus;
    // Novas propriedades para as "Gregas"
    impliedVolatility?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
}

export interface MarketInsight {
    summary: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    recommendation: string;
}
