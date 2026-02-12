
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Info,
  RefreshCw,
  PieChart,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Loader2,
  Globe,
  ShieldCheck,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Clock,
  ExternalLink,
  ChevronDown,
  Activity,
  Sigma,
  Wind,
  Thermometer,
  HeartHandshake
} from 'lucide-react';
import {
  OptionType,
  MoneyStatus
} from './types';
import type {
  StockData,
  OptionData,
  MarketInsight
} from './types';
import { getMarketInsights, fetchStockDataFromB3 } from './services/geminiService';
import OptionBadge from './components/OptionBadge';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const INITIAL_STOCK: StockData = {
  ticker: 'PETR4',
  name: 'Petrobras PN',
  currentPrice: 38.50,
  change: 0.45,
  changePercent: 1.18
};

/**
 * Calcula as próximas datas de vencimento (3ª sexta-feira de cada mês, padrão atual B3)
 */
const getFutureExpiryDates = (count: number = 4): string[] => {
  const dates: string[] = [];
  let current = new Date();

  while (dates.length < count) {
    let year = current.getFullYear();
    let month = current.getMonth();

    let firstDayOfMonth = new Date(year, month, 1);
    let dayOfWeek = firstDayOfMonth.getDay();
    let firstFriday = (dayOfWeek <= 5) ? (5 - dayOfWeek + 1) : (5 - dayOfWeek + 8);
    let thirdFriday = new Date(year, month, firstFriday + 14);

    if (thirdFriday > new Date()) {
      dates.push(thirdFriday.toLocaleDateString('pt-BR'));
    }

    current.setMonth(current.getMonth() + 1);
  }
  return dates;
};

const EXPIRY_DATES = getFutureExpiryDates();

const getMarketStatusInfo = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brt = new Date(utc + (3600000 * -3));

  const day = brt.getDay();
  const hours = brt.getHours();
  const isOpen = day >= 1 && day <= 5 && hours >= 10 && hours < 18;

  return {
    isOpen,
    label: isOpen ? 'ABERTO' : 'FECHADO',
    time: brt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
};

const generateOptionsForStock = (stock: StockData, expiry: string): OptionData[] => {
  const price = stock.currentPrice;
  if (price <= 0) return [];

  const expiryIndex = EXPIRY_DATES.indexOf(expiry);
  const timeFactor = 1 + (expiryIndex * 0.15);
  const volatilityBase = 0.20 + (expiryIndex * 0.05);

  const baseStrike = Math.round(price);
  const strikes = [
    baseStrike - 2,
    baseStrike - 1,
    baseStrike,
    baseStrike + 1,
    baseStrike + 2,
  ].filter(s => s > 0);

  const options: OptionData[] = [];
  const atmThreshold = price * 0.012;

  strikes.forEach((strike, idx) => {
    // --- Geração de CALLS ---
    let callStatus: MoneyStatus;
    if (Math.abs(strike - price) <= atmThreshold) callStatus = MoneyStatus.ATM;
    else if (strike < price) callStatus = MoneyStatus.ITM;
    else callStatus = MoneyStatus.OTM;

    const callIntrinsic = Math.max(0, price - strike);
    const callTimeValue = ((Math.random() * 0.4) + 0.1) * timeFactor;
    const baseCallPremium = callIntrinsic + (callStatus === MoneyStatus.OTM ? callTimeValue * 0.4 : callTimeValue);
    const callSpread = Math.max(0.01, baseCallPremium * 0.03);

    const callDelta = callStatus === MoneyStatus.ITM ? (0.7 + Math.random() * 0.2).toFixed(2) :
      callStatus === MoneyStatus.ATM ? (0.4 + Math.random() * 0.2).toFixed(2) :
        (0.1 + Math.random() * 0.2).toFixed(2);
    const callGamma = (Math.random() * 0.08 + 0.02).toFixed(3);
    const callTheta = (-0.05 - Math.random() * 0.1).toFixed(3);
    const callVega = (0.1 + Math.random() * 0.1).toFixed(3);

    options.push({
      id: `CALL-${stock.ticker}-${strike}-${idx}-${expiry}`,
      ticker: `${stock.ticker}${String.fromCharCode(65 + expiryIndex)}${Math.round(strike)}`,
      type: OptionType.CALL,
      strike: strike,
      bidPrice: Number((baseCallPremium - callSpread / 2).toFixed(2)),
      askPrice: Number((baseCallPremium + callSpread / 2).toFixed(2)),
      premium: Number(baseCallPremium.toFixed(2)),
      expiry: expiry,
      status: callStatus,
      impliedVolatility: Number((volatilityBase + Math.random() * 0.1).toFixed(3)),
      delta: Number(callDelta),
      gamma: Number(callGamma),
      theta: Number(callTheta),
      vega: Number(callVega),
    });

    // --- Geração de PUTS ---
    let putStatus: MoneyStatus;
    if (Math.abs(strike - price) <= atmThreshold) putStatus = MoneyStatus.ATM;
    else if (strike > price) putStatus = MoneyStatus.ITM;
    else putStatus = MoneyStatus.OTM;

    const putIntrinsic = Math.max(0, strike - price);
    const putTimeValue = ((Math.random() * 0.35) + 0.1) * timeFactor;
    const basePutPremium = putIntrinsic + (putStatus === MoneyStatus.OTM ? putTimeValue * 0.4 : putTimeValue);
    const putSpread = Math.max(0.01, basePutPremium * 0.03);

    const putDelta = putStatus === MoneyStatus.ITM ? (-0.7 - Math.random() * 0.2).toFixed(2) :
      putStatus === MoneyStatus.ATM ? (-0.4 + Math.random() * 0.2).toFixed(2) :
        (-0.1 - Math.random() * 0.2).toFixed(2);
    const putGamma = (Math.random() * 0.08 + 0.02).toFixed(3);
    const putTheta = (-0.05 - Math.random() * 0.1).toFixed(3);
    const putVega = (0.1 + Math.random() * 0.1).toFixed(3);

    options.push({
      id: `PUT-${stock.ticker}-${strike}-${idx}-${expiry}`,
      ticker: `${stock.ticker}${String.fromCharCode(77 + expiryIndex)}${Math.round(strike)}`,
      type: OptionType.PUT,
      strike: strike,
      bidPrice: Number((basePutPremium - putSpread / 2).toFixed(2)),
      askPrice: Number((basePutPremium + putSpread / 2).toFixed(2)),
      premium: Number(basePutPremium.toFixed(2)),
      expiry: expiry,
      status: putStatus,
      impliedVolatility: Number((volatilityBase + Math.random() * 0.1).toFixed(3)),
      delta: Number(putDelta),
      gamma: Number(putGamma),
      theta: Number(putTheta),
      vega: Number(putVega),
    });
  });

  return options;
};

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([INITIAL_STOCK]);
  const [selectedStock, setSelectedStock] = useState<StockData>(INITIAL_STOCK);
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_DATES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<OptionData[]>([]);
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [sources, setSources] = useState<{ title: string, uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<OptionType>(OptionType.CALL);
  const [marketStatus, setMarketStatus] = useState(getMarketStatusInfo());
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(true);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

  // Check API Key status on mount
  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
        setShowApiKeyPrompt(!hasKey);
      } else {
        setApiKeySelected(true);
        setShowApiKeyPrompt(false);
      }
    };
    checkApiKey();
  }, []);

  // Market status timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketStatusInfo());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch options and AI insights
  useEffect(() => {
    if (selectedStock.currentPrice > 0) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          // Try to fetch real options from backend
          const backendUrl = "http://localhost:8000";
          const response = await fetch(`${backendUrl}/market/options/${selectedStock.ticker}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              // Convert backend data to frontend format
              const mappedOptions: OptionData[] = data.map((o: any) => ({
                id: o.symbol,
                ticker: o.symbol,
                type: o.type as OptionType,
                strike: o.strike,
                bidPrice: o.price * 0.98,
                askPrice: o.price * 1.02,
                premium: o.price,
                expiry: o.maturity_date,
                status: Math.abs(o.strike - selectedStock.currentPrice) < (selectedStock.currentPrice * 0.012)
                  ? MoneyStatus.ATM
                  : ((o.type === 'CALL' && o.strike < selectedStock.currentPrice) || (o.type === 'PUT' && o.strike > selectedStock.currentPrice) ? MoneyStatus.ITM : MoneyStatus.OTM),
                impliedVolatility: 0.32,
                delta: o.type === 'CALL' ? 0.5 : -0.5,
                gamma: 0.05,
                theta: -0.02,
                vega: 0.1
              }));
              setOptions(mappedOptions);
              return mappedOptions;
            }
          }
        } catch (err) {
          console.warn("Could not fetch options from backend, falling back to simulation.", err);
        }

        // Fallback to simulation
        const newOptions = generateOptionsForStock(selectedStock, selectedExpiry);
        setOptions(newOptions);
        return newOptions;
      };

      const runIntegration = async () => {
        setLoading(true);
        const currentOptions = await fetchOptions();

        if (!apiKeySelected) {
          setShowApiKeyPrompt(true);
          setInsights(null);
          setLoading(false);
          return;
        }

        try {
          const data = await getMarketInsights(selectedStock, currentOptions);
          setInsights(data);
        } catch (error: any) {
          console.error("Erro ao buscar insights do Gemini:", error);
          if (error.message === "API_QUOTA_EXCEEDED") {
            setApiKeySelected(false);
            setShowApiKeyPrompt(true);
            setInsights(null);
          } else {
            setInsights({
              summary: "Análise indisponível temporariamente devido a um erro inesperado.",
              sentiment: "neutral",
              recommendation: "Tente novamente mais tarde."
            });
          }
        } finally {
          setLoading(false);
        }
      };

      runIntegration();
    } else {
      setOptions([]);
      setInsights(null);
    }
  }, [selectedStock.ticker, selectedStock.currentPrice, selectedExpiry, apiKeySelected]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = searchQuery.toUpperCase().trim();
    if (!ticker) return;

    if (!apiKeySelected) {
      setShowApiKeyPrompt(true);
      alert("Por favor, selecione sua chave API para realizar buscas.");
      return;
    }

    setSearching(true);
    try {
      const result = await fetchStockDataFromB3(ticker);
      if (result.currentPrice > 0) {
        setStocks(prev => {
          const filtered = prev.filter(s => s.ticker !== ticker);
          return [result, ...filtered].slice(0, 5);
        });
        setSelectedStock(result);
        setSources(result.sources || []);
      } else {
        alert(`Ticker '${ticker}' não encontrado ou dados inválidos.`);
      }
    } catch (err: any) {
      if (err.message === "API_QUOTA_EXCEEDED") {
        setApiKeySelected(false);
        setShowApiKeyPrompt(true);
        alert(`Sua cota de API foi excedida.`);
      } else {
        alert(`Houve um erro ao processar sua busca.`);
      }
    } finally {
      setSearching(false);
      setSearchQuery('');
    }
  };

  const handleSelectApiKey = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
      setShowApiKeyPrompt(false);
      // Re-trigger data fetch
      if (selectedStock.currentPrice > 0) {
        const newOptions = generateOptionsForStock(selectedStock, selectedExpiry);
        setOptions(newOptions);
        setLoading(true);
        getMarketInsights(selectedStock, newOptions).then(data => {
          setInsights(data);
        }).catch(error => {
          if (error.message === "API_QUOTA_EXCEEDED") {
            setApiKeySelected(false);
            setShowApiKeyPrompt(true);
          }
        }).finally(() => {
          setLoading(false);
        });
      }
    } else {
      alert("Selecione sua Chave API no menu lateral.");
    }
  }, [selectedStock, selectedExpiry]);


  const filteredOptions = useMemo(() => {
    return options.filter(o => o.type === activeTab).sort((a, b) => a.strike - b.strike);
  }, [options, activeTab]);

  const chartData = useMemo(() => {
    return filteredOptions.map(o => ({
      strike: `R$ ${o.strike.toFixed(2)}`,
      premium: o.premium,
      status: o.status
    }));
  }, [filteredOptions]);

  const getStatusColor = (status: MoneyStatus) => {
    if (status === MoneyStatus.ITM) return '#10b981';
    if (status === MoneyStatus.ATM) return '#f59e0b';
    return '#f43f5e';
  };

  const getStatusIcon = (status: MoneyStatus) => {
    switch (status) {
      case MoneyStatus.ITM: return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case MoneyStatus.ATM: return <Target className="w-4 h-4 text-amber-400" />;
      case MoneyStatus.OTM: return <Zap className="w-4 h-4 text-rose-400" />;
    }
  };

  const getRowHighlight = (status: MoneyStatus) => {
    switch (status) {
      case MoneyStatus.ITM: return 'border-l-4 border-emerald-500 bg-emerald-500/[0.03]';
      case MoneyStatus.ATM: return 'border-l-4 border-amber-500 bg-amber-500/[0.03]';
      case MoneyStatus.OTM: return 'border-l-4 border-rose-500 bg-rose-500/[0.03]';
    }
  };

  const handleRowClick = (optionId: string) => {
    setExpandedOptionId(prevId => (prevId === optionId ? null : optionId));
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {showApiKeyPrompt && (
        <div className="fixed top-0 left-0 w-full bg-rose-800 text-white p-4 z-[9999] shadow-lg flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-medium">
          <Info className="w-5 h-5" />
          <span>É necessária uma chave API Geminim do Google AI Studio.</span>
          <button
            onClick={handleSelectApiKey}
            className="bg-white text-rose-800 px-4 py-2 rounded-lg font-bold hover:bg-rose-100 transition-colors active:scale-95 flex items-center gap-2"
          >
            <Sparkles size={16} />
            Configurar Chave API
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-2xl border-b border-slate-800 px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-500/20">
              <TrendingUp className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">OPÇÕES<span className="text-indigo-500 italic">EXPERT</span></h1>
              <div className="flex items-center gap-1.5 mt-1">
                <Globe className="text-emerald-500 w-3 h-3 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">B3 Future Connect</p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-lg w-full">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                placeholder="Busque ações B3 (Ex: VALE3, BBAS3, MGLU3...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searching || !apiKeySelected}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 disabled:opacity-50 backdrop-blur-sm"
              />
              <Search className={`absolute left-4 top-4 transition-colors ${searching ? 'text-indigo-500 animate-pulse' : 'text-slate-500 group-focus-within:text-indigo-400'}`} size={20} />
              <button type="submit" disabled={searching || !apiKeySelected} className="absolute right-2 top-2 bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-500 transition-all disabled:bg-slate-700 active:scale-95 flex items-center gap-2">
                {searching ? <Loader2 size={18} className="text-white animate-spin" /> : <Plus size={18} className="text-white" />}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {stocks.map(s => (
              <button
                key={`${s.ticker}-${s.currentPrice}`}
                onClick={() => setSelectedStock(s)}
                className={`px-5 py-2.5 rounded-2xl border text-left transition-all shrink-0 hover:scale-105 active:scale-95 ${selectedStock.ticker === s.ticker
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-indigo-500/10'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-slate-600'
                  }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest mb-0.5">{s.ticker}</div>
                <div className="text-sm font-mono font-bold leading-none">R$ {s.currentPrice.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main key={selectedStock.ticker + selectedStock.currentPrice} className="max-w-7xl mx-auto px-6 mt-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">

        <section className="bg-slate-900/40 rounded-[3rem] border border-slate-800/50 p-12 flex flex-col md:flex-row items-center gap-16 shadow-2xl relative overflow-hidden backdrop-blur-xl group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[140px] pointer-events-none group-hover:bg-indigo-600/10 transition-colors duration-1000" />

          <div className="flex-1 text-center md:text-left z-10">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-500/20">Market Active</span>
              <RefreshCw size={14} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-5 mb-8">
              <h2 className="text-7xl font-black text-white tracking-tighter leading-none">{selectedStock.ticker}</h2>
              <span className="text-slate-500 mb-2 font-bold text-xl uppercase tracking-tight">{selectedStock.name}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-10">
              <div className="text-7xl font-mono font-bold text-white tracking-tighter">
                R$ {selectedStock.currentPrice.toFixed(2)}
              </div>
              <div className={`flex flex-col ${selectedStock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <div className="flex items-center gap-1 text-4xl font-black tracking-tighter">
                  {selectedStock.changePercent >= 0 ? <TrendingUp size={40} /> : <TrendingDown size={40} />}
                  {Math.abs(selectedStock.changePercent).toFixed(2)}%
                </div>
                <span className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em] mt-1">B3 Real-Time Var</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-6 w-full md:w-auto z-10 shrink-0">
            <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-slate-700/30 shadow-inner text-center backdrop-blur-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-[0.2em]">Fech. Anterior</p>
              <p className="text-3xl font-bold text-slate-300 font-mono tracking-tight">R$ {(selectedStock.currentPrice - (selectedStock.change || 0)).toFixed(2)}</p>
            </div>
            <div className="bg-slate-800/40 p-6 rounded-[2rem] border border-slate-700/30 shadow-inner text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2 tracking-widest">
                <Clock size={14} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 font-black uppercase">Sessão B3</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${marketStatus.isOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                <p className={`text-2xl font-black tracking-widest ${marketStatus.isOpen ? 'text-white' : 'text-slate-500'}`}>{marketStatus.label}</p>
              </div>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-2 tracking-widest">{marketStatus.time} BRT</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <section className="lg:col-span-8 space-y-10">
            <div className="bg-slate-900/40 rounded-[3rem] border border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="bg-slate-900/80 p-8 space-y-8 border-b border-slate-800/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                      <CalendarDays className="text-indigo-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Próximos Vencimentos</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Vencimentos ativos (3ª Sexta-feira)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {EXPIRY_DATES.map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedExpiry(date)}
                        className={`px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap border shadow-sm ${selectedExpiry === date
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20 scale-105'
                          : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:border-slate-600'
                          }`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setActiveTab(OptionType.CALL)} className={`flex-1 py-6 px-8 rounded-3xl text-xs font-black transition-all flex items-center justify-center gap-4 border ${activeTab === OptionType.CALL ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                    <TrendingUp size={18} /> CALLS (COMPRA)
                  </button>
                  <button onClick={() => setActiveTab(OptionType.PUT)} className={`flex-1 py-6 px-8 rounded-3xl text-xs font-black transition-all flex items-center justify-center gap-4 border ${activeTab === OptionType.PUT ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-600/30' : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                    <TrendingDown size={18} /> PUTS (VENDA)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900/30">
                      <th className="px-10 py-8">Série / Ticker</th>
                      <th className="px-6 py-8">Exercício</th>
                      <th className="px-6 py-8 text-indigo-400">Ask (Compra)</th>
                      <th className="px-6 py-8 text-emerald-400">Bid (Venda)</th>
                      <th className="px-10 py-8 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 font-medium">
                    {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                      <React.Fragment key={opt.id}>
                        <tr
                          onClick={() => handleRowClick(opt.id)}
                          className={`hover:bg-indigo-500/[0.04] transition-all group cursor-pointer border-l-4 border-transparent ${getRowHighlight(opt.status)}`}
                        >
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="bg-slate-800/50 p-3 rounded-2xl group-hover:bg-slate-800 group-hover:scale-110 transition-all border border-slate-700/30 shadow-sm">
                                {getStatusIcon(opt.status)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-mono text-lg font-black text-slate-200 group-hover:text-indigo-400 transition-colors tracking-tighter">{opt.ticker}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Série {opt.ticker.charAt(4)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-8 font-mono text-lg text-slate-300 font-bold">R$ {opt.strike.toFixed(2)}</td>
                          <td className="px-6 py-8">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-mono text-xl font-black text-indigo-400 tracking-tighter">R$ {opt.askPrice.toFixed(2)}</span>
                            </div>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter ml-5">Você Paga</span>
                          </td>
                          <td className="px-6 py-8">
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-mono text-xl font-black text-emerald-400 tracking-tighter">R$ {opt.bidPrice.toFixed(2)}</span>
                            </div>
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter ml-5">Você Recebe</span>
                          </td>
                          <td className="px-10 py-8 text-center flex items-center justify-center gap-4">
                            <OptionBadge status={opt.status} />
                            {expandedOptionId === opt.id ?
                              <ChevronDown size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" /> :
                              <ChevronRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            }
                          </td>
                        </tr>
                        {expandedOptionId === opt.id && (
                          <tr className="bg-slate-900/60 transition-all duration-300 ease-in-out">
                            <td colSpan={5} className="px-10 py-6">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-8 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-2 text-indigo-400"><Activity size={14} /> Vol. Implícita</span>
                                  <span className="text-base font-mono text-slate-200">{opt.impliedVolatility?.toFixed(3) || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-2 text-indigo-400"><Sigma size={14} /> Delta</span>
                                  <span className="text-base font-mono text-slate-200">{opt.delta?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-2 text-indigo-400"><Wind size={14} /> Gamma</span>
                                  <span className="text-base font-mono text-slate-200">{opt.gamma?.toFixed(3) || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-2 text-indigo-400"><Thermometer size={14} /> Theta</span>
                                  <span className="text-base font-mono text-slate-200">{opt.theta?.toFixed(3) || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-2 text-indigo-400"><HeartHandshake size={14} /> Vega</span>
                                  <span className="text-base font-mono text-slate-200">{opt.vega?.toFixed(3) || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-10 py-24 text-center text-slate-500 italic font-medium tracking-wide">Busque um ativo válido para analisar as opções disponíveis.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 rounded-[3rem] border border-indigo-500/10 p-12 shadow-2xl relative overflow-hidden group border-b-4 border-b-indigo-500/30">
              <div className="absolute top-0 right-0 p-8">
                <div className="bg-indigo-500/10 w-2 h-2 rounded-full animate-ping" />
              </div>

              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                  <div className="bg-indigo-600/20 p-4 rounded-[1.5rem] border border-indigo-500/30">
                    <Sparkles className="text-indigo-400 w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white tracking-tight">Gemini Advanced Insight</h4>
                    <p className="text-[10px] text-indigo-400/60 uppercase font-black tracking-[0.3em] mt-1">Análise de IA para Vencimento {selectedExpiry}</p>
                  </div>
                </div>
                {loading && <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />}
              </div>

              {insights ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                  <div className="md:col-span-7 space-y-8">
                    <p className="text-slate-300 text-lg leading-relaxed font-medium italic">"{insights.summary}"</p>
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-xl">
                        <div className={`w-3 h-3 rounded-full blur-[2px] ${insights.sentiment === 'bullish' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : insights.sentiment === 'bearish' ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'}`} />
                        <span className="text-[11px] font-black uppercase text-slate-200 tracking-widest">{insights.sentiment} Outlook</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-5 bg-indigo-600/10 p-10 rounded-[2.5rem] border border-indigo-500/20 backdrop-blur-md shadow-2xl">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-5 border-b border-indigo-500/20 pb-2 flex items-center gap-2">
                      <Target size={14} /> Foco Estratégico
                    </h5>
                    <p className="text-white text-base font-bold leading-relaxed tracking-tight underline decoration-indigo-500/30 decoration-2 underline-offset-4">{insights.recommendation}</p>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase">Processando Big Data B3...</span>
                </div>
              )}
            </div>

            {sources.length > 0 && (
              <div className="bg-slate-900/20 p-8 rounded-3xl border border-slate-800/50">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Globe size={14} /> Fontes de Dados de Mercado
                </h4>
                <div className="flex flex-wrap gap-4">
                  {sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 bg-slate-800/30 px-3 py-1.5 rounded-full border border-slate-700/50"
                    >
                      {source.title} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 space-y-12">
            <div className="bg-slate-900/50 rounded-[3rem] border border-slate-800/50 p-10 backdrop-blur-md shadow-2xl">
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-12 flex items-center gap-3 border-b border-slate-800 pb-5">
                <PieChart className="text-indigo-400" size={20} /> Volatilidade e Liquidez
              </h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="strike" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '20px' }} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} itemStyle={{ color: '#818cf8', fontWeight: '900', fontSize: '14px', fontFamily: 'monospace' }} />
                    <Bar dataKey="premium" radius={[12, 12, 0, 0]} animationBegin={300} animationDuration={1200}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-12 flex justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ITM</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Target className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ATM</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Zap className="w-6 h-6 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">OTM</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 rounded-[3rem] p-12 text-white shadow-3xl shadow-indigo-950/50 group cursor-default overflow-hidden relative border border-indigo-400/20">
              <div className="relative z-10">
                <div className="bg-white/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 border border-white/10 backdrop-blur-md">
                  <Info className="text-white" size={32} />
                </div>
                <h4 className="text-3xl font-black mb-5 tracking-tighter">O Fator "Theta"</h4>
                <p className="text-indigo-100 text-base leading-relaxed mb-10 font-medium italic opacity-90">
                  Os vencimentos mostrados acima seguem o padrão de 3ª sexta-feira. Quanto maior o prazo, maior o prêmio extrínseco devido ao risco temporal.
                </p>
                <button className="w-full bg-white text-indigo-900 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2">
                  Explorar Calendário B3 <ChevronRight size={14} />
                </button>
              </div>
              <ArrowRightLeft className="absolute -bottom-16 -right-16 w-64 h-64 text-white opacity-[0.03] group-hover:rotate-45 group-hover:scale-110 transition-transform duration-[2000ms]" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 mt-32 text-center pb-12">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-12" />
        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em]">
            B3 Connect Protocol • Gemini 1.5 Flash AI • OpçõesExpert Pro v3.5
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
