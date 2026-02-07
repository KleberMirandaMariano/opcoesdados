import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Clock, Search, X } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/options';

interface MarketData {
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

const mockAssets: MarketData[] = [
  { symbol: 'PETR4', name: 'Petrobras PN', price: 36.85, change: 0.72, changePercent: 1.99, volume: 125000000, high: 37.12, low: 36.20, open: 36.20, close: 36.13 },
  { symbol: 'PETR3', name: 'Petrobras ON', price: 38.42, change: 0.85, changePercent: 2.26, volume: 45000000, high: 38.75, low: 37.80, open: 37.80, close: 37.57 },
  { symbol: 'VALE3', name: 'Vale ON', price: 68.42, change: -1.23, changePercent: -1.77, volume: 89000000, high: 69.80, low: 67.95, open: 69.50, close: 69.65 },
  { symbol: 'ITUB4', name: 'Itaú Unibanco PN', price: 32.15, change: 0.45, changePercent: 1.42, volume: 67000000, high: 32.48, low: 31.78, open: 31.80, close: 31.70 },
  { symbol: 'BBDC4', name: 'Bradesco PN', price: 15.78, change: -0.12, changePercent: -0.75, volume: 45000000, high: 16.05, low: 15.62, open: 15.90, close: 15.90 },
  { symbol: 'ABEV3', name: 'Ambev ON', price: 13.42, change: 0.08, changePercent: 0.60, volume: 32000000, high: 13.55, low: 13.28, open: 13.35, close: 13.34 },
  { symbol: 'BOVA11', name: 'iShares Ibovespa', price: 128.65, change: 1.85, changePercent: 1.46, volume: 28000000, high: 129.20, low: 126.90, open: 126.90, close: 126.80 },
  { symbol: 'WEGE3', name: 'Weg ON', price: 42.15, change: 0.92, changePercent: 2.23, volume: 18000000, high: 42.50, low: 41.30, open: 41.35, close: 41.23 },
  { symbol: 'RENT3', name: 'Localiza ON', price: 58.75, change: -0.45, changePercent: -0.76, volume: 12000000, high: 59.50, low: 58.20, open: 59.20, close: 59.20 },
  { symbol: 'BBAS3', name: 'Banco do Brasil ON', price: 28.45, change: 0.35, changePercent: 1.25, volume: 22000000, high: 28.80, low: 28.10, open: 28.15, close: 28.10 },
  { symbol: 'SUZB3', name: 'Suzano ON', price: 52.30, change: 1.15, changePercent: 2.25, volume: 15000000, high: 52.80, low: 51.20, open: 51.25, close: 51.15 },
  { symbol: 'RADL3', name: 'Raia Drogasil ON', price: 25.80, change: -0.25, changePercent: -0.96, volume: 8500000, high: 26.20, low: 25.60, open: 26.05, close: 26.05 },
  { symbol: 'RAIL3', name: 'Rumo ON', price: 22.45, change: 0.18, changePercent: 0.81, volume: 9800000, high: 22.70, low: 22.15, open: 22.30, close: 22.27 },
  { symbol: 'GGBR4', name: 'Gerdau PN', price: 19.85, change: 0.42, changePercent: 2.16, volume: 16500000, high: 20.05, low: 19.45, open: 19.50, close: 19.43 },
  { symbol: 'CSNA3', name: 'CSN ON', price: 15.25, change: 0.28, changePercent: 1.87, volume: 14200000, high: 15.45, low: 14.95, open: 15.00, close: 14.97 },
  { symbol: 'JBSS3', name: 'JBS ON', price: 35.60, change: -0.45, changePercent: -1.25, volume: 19500000, high: 36.20, low: 35.40, open: 36.05, close: 36.05 },
  { symbol: 'MGLU3', name: 'Magazine Luiza ON', price: 2.85, change: 0.08, changePercent: 2.89, volume: 285000000, high: 2.92, low: 2.78, open: 2.78, close: 2.77 },
  { symbol: 'VIIA3', name: 'Vibra ON', price: 24.15, change: 0.32, changePercent: 1.34, volume: 11200000, high: 24.45, low: 23.85, open: 23.90, close: 23.83 },
  { symbol: 'HAPV3', name: 'Hapvida ON', price: 3.42, change: -0.05, changePercent: -1.44, volume: 125000000, high: 3.52, low: 3.38, open: 3.47, close: 3.47 },
  { symbol: 'CPLE6', name: 'Copel PNB', price: 12.85, change: 0.22, changePercent: 1.74, volume: 18500000, high: 13.05, low: 12.65, open: 12.70, close: 12.63 },
  { symbol: 'EQTL3', name: 'Equatorial ON', price: 38.95, change: 0.65, changePercent: 1.70, volume: 13500000, high: 39.30, low: 38.40, open: 38.45, close: 38.30 },
  { symbol: 'PRIO3', name: 'Prio ON', price: 48.75, change: 1.25, changePercent: 2.63, volume: 16800000, high: 49.20, low: 47.60, open: 47.65, close: 47.50 },
  { symbol: 'VBBR3', name: 'Vibra Energia ON', price: 24.35, change: 0.45, changePercent: 1.88, volume: 14500000, high: 24.65, low: 23.95, open: 24.00, close: 23.90 },
  { symbol: 'LREN3', name: 'Lojas Renner ON', price: 18.95, change: -0.35, changePercent: -1.81, volume: 22500000, high: 19.45, low: 18.75, open: 19.30, close: 19.30 },
  { symbol: 'TOTS3', name: 'Totvs ON', price: 28.75, change: 0.55, changePercent: 1.95, volume: 8500000, high: 29.05, low: 28.25, open: 28.30, close: 28.20 },
  { symbol: 'FLRY3', name: 'Fleury ON', price: 16.45, change: 0.25, changePercent: 1.54, volume: 7200000, high: 16.70, low: 16.15, open: 16.25, close: 16.20 },
  { symbol: 'KLBN4', name: 'Klabin PN', price: 4.85, change: 0.08, changePercent: 1.68, volume: 18500000, high: 4.92, low: 4.78, open: 4.78, close: 4.77 },
  { symbol: 'UGPA3', name: 'Ultrapar ON', price: 22.35, change: 0.42, changePercent: 1.92, volume: 9200000, high: 22.65, low: 21.95, open: 22.00, close: 21.93 },
  { symbol: 'SBSP3', name: 'Sabesp ON', price: 75.80, change: 1.20, changePercent: 1.61, volume: 4200000, high: 76.50, low: 74.80, open: 74.85, close: 74.60 },
  { symbol: 'CMIG4', name: 'Cemig PN', price: 11.95, change: 0.18, changePercent: 1.53, volume: 12800000, high: 12.10, low: 11.75, open: 11.80, close: 11.77 },
  { symbol: 'ELET3', name: 'Eletrobras ON', price: 42.85, change: 0.75, changePercent: 1.78, volume: 9800000, high: 43.30, low: 42.20, open: 42.25, close: 42.10 },
  { symbol: 'ELET6', name: 'Eletrobras PNB', price: 45.20, change: 0.82, changePercent: 1.85, volume: 7500000, high: 45.65, low: 44.50, open: 44.55, close: 44.38 },
  { symbol: 'ENGI11', name: 'Energisa UN', price: 42.35, change: 0.65, changePercent: 1.56, volume: 5200000, high: 42.80, low: 41.80, open: 41.85, close: 41.70 },
  { symbol: 'TAEE11', name: 'Taesa UN', price: 38.95, change: 0.45, changePercent: 1.17, volume: 4800000, high: 39.30, low: 38.50, open: 38.55, close: 38.50 },
  { symbol: 'TRPL4', name: 'Transmissão Paulista PN', price: 24.85, change: 0.35, changePercent: 1.43, volume: 3800000, high: 25.10, low: 24.50, open: 24.55, close: 24.50 },
  { symbol: 'SMTO3', name: 'São Martinho ON', price: 32.45, change: 0.55, changePercent: 1.72, volume: 2800000, high: 32.80, low: 31.95, open: 32.00, close: 31.90 },
  { symbol: 'SMFT3', name: 'Smart Fit ON', price: 16.75, change: 0.28, changePercent: 1.70, volume: 6500000, high: 17.05, low: 16.50, open: 16.55, close: 16.47 },
  { symbol: 'DXCO3', name: 'Dexco ON', price: 8.95, change: 0.15, changePercent: 1.71, volume: 9200000, high: 9.10, low: 8.80, open: 8.82, close: 8.80 },
  { symbol: 'YDUQ3', name: 'Yduqs ON', price: 14.25, change: -0.22, changePercent: -1.52, volume: 5800000, high: 14.65, low: 14.10, open: 14.47, close: 14.47 },
  { symbol: 'COGN3', name: 'Cogna ON', price: 2.15, change: 0.03, changePercent: 1.42, volume: 125000000, high: 2.20, low: 2.11, open: 2.12, close: 2.12 },
  { symbol: 'CVCB3', name: 'CVC Brasil ON', price: 3.85, change: 0.08, changePercent: 2.12, volume: 18500000, high: 3.95, low: 3.76, open: 3.77, close: 3.77 },
  { symbol: 'AZUL4', name: 'Azul PN', price: 8.45, change: 0.18, changePercent: 2.18, volume: 12500000, high: 8.65, low: 8.25, open: 8.30, close: 8.27 },
  { symbol: 'GOLL4', name: 'Gol PN', price: 4.25, change: 0.08, changePercent: 1.92, volume: 22500000, high: 4.35, low: 4.15, open: 4.18, close: 4.17 },
  { symbol: 'BEEF3', name: 'Minerva ON', price: 7.85, change: 0.12, changePercent: 1.55, volume: 8500000, high: 8.00, low: 7.72, open: 7.75, close: 7.73 },
  { symbol: 'BRFS3', name: 'BRF ON', price: 12.45, change: 0.22, changePercent: 1.80, volume: 11200000, high: 12.65, low: 12.25, open: 12.28, close: 12.23 },
  { symbol: 'MRFG3', name: 'Marfrig ON', price: 9.85, change: 0.15, changePercent: 1.55, volume: 9800000, high: 10.00, low: 9.70, open: 9.72, close: 9.70 },
  { symbol: 'PCAR3', name: 'Pão de Açúcar ON', price: 8.95, change: -0.12, changePercent: -1.32, volume: 5200000, high: 9.20, low: 8.85, open: 9.07, close: 9.07 },
  { symbol: 'NTCO3', name: 'Natura ON', price: 15.75, change: 0.28, changePercent: 1.81, volume: 7200000, high: 16.00, low: 15.50, open: 15.52, close: 15.47 },
  { symbol: 'AMER3', name: 'Americanas ON', price: 12.85, change: 0.35, changePercent: 2.80, volume: 18500000, high: 13.10, low: 12.50, open: 12.55, close: 12.50 },
  { symbol: 'ASAI3', name: 'Assaí ON', price: 14.25, change: 0.22, changePercent: 1.57, volume: 8200000, high: 14.50, low: 14.05, open: 14.08, close: 14.03 },
  { symbol: 'CRFB3', name: 'Carrefour ON', price: 11.85, change: 0.18, changePercent: 1.54, volume: 6800000, high: 12.05, low: 11.68, open: 11.70, close: 11.67 },
  { symbol: 'BHIA3', name: 'Casas Bahia ON', price: 4.85, change: 0.12, changePercent: 2.54, volume: 18500000, high: 4.95, low: 4.73, open: 4.75, close: 4.73 },
  { symbol: 'IGTI11', name: 'Iguatemi UN', price: 22.45, change: 0.38, changePercent: 1.72, volume: 3800000, high: 22.75, low: 22.15, open: 22.18, close: 22.07 },
  { symbol: 'MULT3', name: 'Multiplan ON', price: 28.95, change: 0.52, changePercent: 1.83, volume: 3200000, high: 29.30, low: 28.55, open: 28.58, close: 28.43 },
  { symbol: 'BRSR6', name: 'Banrisul PNB', price: 15.85, change: 0.25, changePercent: 1.60, volume: 4200000, high: 16.05, low: 15.62, open: 15.65, close: 15.60 },
  { symbol: 'ITSA4', name: 'Itaúsa PN', price: 9.85, change: 0.12, changePercent: 1.23, volume: 28500000, high: 9.98, low: 9.73, open: 9.75, close: 9.73 },
  { symbol: 'BPAC11', name: 'BTG Pactual UN', price: 36.45, change: 0.65, changePercent: 1.82, volume: 12500000, high: 36.85, low: 35.95, open: 35.98, close: 35.80 },
  { symbol: 'SANB11', name: 'Santander UN', price: 28.75, change: 0.42, changePercent: 1.48, volume: 8200000, high: 29.05, low: 28.40, open: 28.45, close: 28.33 },
];

const marketIndicators = [
  { label: 'IBOV', value: 128456, change: 1.23, changePercent: 0.96 },
  { label: 'DÓLAR', value: 5.7423, change: -0.02, changePercent: -0.35 },
  { label: 'SELIC', value: 10.50, change: 0, changePercent: 0 },
];

export function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAsset, setSelectedAsset] = useState<MarketData>(mockAssets[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar ativos baseado na busca
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return mockAssets;
    const query = searchQuery.toUpperCase();
    return mockAssets.filter(asset => 
      asset.symbol.includes(query) || 
      asset.name.toUpperCase().includes(query)
    );
  }, [searchQuery]);

  // Sugestões de busca (top 5 resultados)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toUpperCase();
    return mockAssets
      .filter(asset => asset.symbol.includes(query) || asset.name.toUpperCase().includes(query))
      .slice(0, 5);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredAssets.length > 0) {
      setSelectedAsset(filteredAssets[0]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSelectAsset = (asset: MarketData) => {
    setSelectedAsset(asset);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Dashboard de Mercado</h2>
            <p className="text-muted-foreground">
              Acompanhe os principais ativos do mercado brasileiro em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {currentTime.toLocaleTimeString('pt-BR')} - {currentTime.toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="glass-card mb-8">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Digite o código da ação (ex: PETR4, VALE3, ITUB4...)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    className="pl-10 pr-10 h-12 bg-secondary/50 border-border/50 text-white placeholder:text-muted-foreground"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="h-12 px-6 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-background font-semibold"
                >
                  Buscar
                </Button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 text-xs text-muted-foreground border-b border-border/50">
                    Sugestões ({suggestions.length})
                  </div>
                  {suggestions.map((asset) => (
                    <button
                      key={asset.symbol}
                      type="button"
                      onClick={() => handleSelectAsset(asset)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                      <div>
                        <span className="font-semibold text-white">{asset.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white">{formatCurrency(asset.price)}</span>
                        <span className={`text-xs ml-2 ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(asset.changePercent)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && searchQuery && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 p-4 text-center">
                  <p className="text-muted-foreground">Nenhum ativo encontrado para &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </form>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Populares:</span>
              {['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'WEGE3', 'BOVA11'].map((symbol) => {
                const asset = mockAssets.find(a => a.symbol === symbol);
                if (!asset) return null;
                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="px-3 py-1 text-xs rounded-full bg-white/5 hover:bg-teal-400/20 text-white hover:text-teal-400 transition-colors border border-white/10"
                  >
                    {symbol}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Market Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {marketIndicators.map((indicator) => (
            <Card key={indicator.label} className="glass-card glow-teal">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{indicator.label}</span>
                  <Activity className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {indicator.label === 'DÓLAR' 
                      ? `R$ ${indicator.value.toFixed(4)}`
                      : indicator.label === 'SELIC'
                      ? `${indicator.value.toFixed(2)}%`
                      : formatNumber(indicator.value, 0)
                    }
                  </span>
                  <span className={`text-sm flex items-center gap-1 ${
                    indicator.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {indicator.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPercent(indicator.changePercent)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets List */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                {searchQuery ? `Resultados da Busca (${filteredAssets.length})` : 'Ativos Mais Negociados'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ativo</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Preço</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Variação</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Volume</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Máx/Mín</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searchQuery ? filteredAssets : mockAssets.slice(0, 10)).map((asset) => (
                      <tr
                        key={asset.symbol}
                        className={`border-b border-border/30 cursor-pointer transition-colors hover:bg-white/5 ${
                          selectedAsset.symbol === asset.symbol ? 'bg-teal-400/10' : ''
                        }`}
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-white">{asset.symbol}</span>
                            <span className="text-sm text-muted-foreground block">{asset.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-mono text-white">{formatCurrency(asset.price)}</span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className={`flex items-center justify-end gap-1 ${
                            asset.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {asset.change >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-mono">{formatPercent(asset.changePercent)}</span>
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 hidden sm:table-cell">
                          <span className="font-mono text-muted-foreground">
                            {formatNumber(asset.volume / 1000000, 1)}M
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-col text-xs">
                            <span className="text-green-400">{formatCurrency(asset.high)}</span>
                            <span className="text-red-400">{formatCurrency(asset.low)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!searchQuery && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    Ver todos os {mockAssets.length} ativos
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Asset Details */}
          <Card className="glass-card glow-cyan">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                {selectedAsset.symbol} - Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground block mb-1">{selectedAsset.name}</span>
                  <span className="text-4xl font-bold text-white">
                    {formatCurrency(selectedAsset.price)}
                  </span>
                  <div className={`flex items-center justify-center gap-2 mt-2 ${
                    selectedAsset.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedAsset.change >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="text-lg font-semibold">
                      {selectedAsset.change >= 0 ? '+' : ''}{formatCurrency(selectedAsset.change)}
                    </span>
                    <span className="text-sm">
                      ({formatPercent(selectedAsset.changePercent)})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Abertura</span>
                    <span className="text-lg font-semibold text-white">
                      {formatCurrency(selectedAsset.open)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Fechamento Ant.</span>
                    <span className="text-lg font-semibold text-white">
                      {formatCurrency(selectedAsset.close)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Máxima</span>
                    <span className="text-lg font-semibold text-green-400">
                      {formatCurrency(selectedAsset.high)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Mínima</span>
                    <span className="text-lg font-semibold text-red-400">
                      {formatCurrency(selectedAsset.low)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Volume</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(selectedAsset.volume / 1000000, 1)}M
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Negócios</span>
                    <span className="text-lg font-semibold text-white">
                      {formatNumber(selectedAsset.volume / 1000, 0)}K
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-teal-400/10 to-cyan-400/10 border border-teal-400/20">
                  <span className="text-sm text-muted-foreground block mb-2">Sobre</span>
                  <p className="text-sm text-white">
                    {selectedAsset.name} é um dos ativos mais líquidos da B3, 
                    com forte presença no mercado de opções. Analise as gregas 
                    e estratégias disponíveis para este ativo.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-background font-semibold"
                    onClick={() => {
                      const calcSection = document.getElementById('calculator');
                      if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Calcular Opções
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-white/20 hover:bg-white/5"
                    onClick={() => {
                      const chainSection = document.getElementById('chain');
                      if (chainSection) chainSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Ver Chain
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
