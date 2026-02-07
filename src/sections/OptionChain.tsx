import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Download,
  Table2
} from 'lucide-react';
import { calculateBlackScholes, formatCurrency, formatNumber } from '@/lib/options';
import type { OptionContract } from '@/types';

interface ChainRow {
  strike: number;
  call: OptionContract;
  put: OptionContract;
}

const generateMockChain = (basePrice: number, symbol: string): ChainRow[] => {
  const rows: ChainRow[] = [];
  const strikes: number[] = [];
  
  // Generate strikes around base price
  for (let i = -10; i <= 10; i++) {
    const strike = Math.round(basePrice + i * basePrice * 0.05);
    if (!strikes.includes(strike)) {
      strikes.push(strike);
    }
  }
  
  strikes.sort((a, b) => a - b);
  
  strikes.forEach((strike) => {
    const moneyness = strike / basePrice;
    const baseIV = 0.30 + Math.pow(moneyness - 1, 2) * 0.2 + (1 - moneyness) * 0.05;
    
    // Calculate theoretical prices
    const callResult = calculateBlackScholes({
      symbol,
      type: 'CALL',
      spot: basePrice,
      strike,
      maturity: 30 / 365,
      volatility: baseIV,
      riskFreeRate: 0.105
    });
    
    const putResult = calculateBlackScholes({
      symbol,
      type: 'PUT',
      spot: basePrice,
      strike,
      maturity: 30 / 365,
      volatility: baseIV,
      riskFreeRate: 0.105
    });
    
    const atmOffset = Math.abs(moneyness - 1);
    const volume = Math.round(Math.exp(-atmOffset * 5) * 10000 + Math.random() * 1000);
    const openInterest = Math.round(volume * (2 + Math.random() * 3));
    
    rows.push({
      strike,
      call: {
        symbol: `${symbol}${strike}C`,
        strike,
        lastPrice: callResult.price,
        bid: callResult.price * 0.98,
        ask: callResult.price * 1.02,
        change: (Math.random() - 0.5) * callResult.price * 0.1,
        changePercent: (Math.random() - 0.5) * 10,
        volume,
        openInterest,
        impliedVolatility: baseIV * 100,
        delta: callResult.greeks.delta,
        gamma: callResult.greeks.gamma,
        theta: callResult.greeks.theta,
        vega: callResult.greeks.vega
      },
      put: {
        symbol: `${symbol}${strike}P`,
        strike,
        lastPrice: putResult.price,
        bid: putResult.price * 0.98,
        ask: putResult.price * 1.02,
        change: (Math.random() - 0.5) * putResult.price * 0.1,
        changePercent: (Math.random() - 0.5) * 10,
        volume: Math.round(volume * 0.7),
        openInterest: Math.round(openInterest * 0.8),
        impliedVolatility: baseIV * 100 * 1.1,
        delta: putResult.greeks.delta,
        gamma: putResult.greeks.gamma,
        theta: putResult.greeks.theta,
        vega: putResult.greeks.vega
      }
    });
  });
  
  return rows;
};

const assets = [
  { symbol: 'PETR4', name: 'Petrobras', price: 36.85 },
  { symbol: 'VALE3', name: 'Vale', price: 68.42 },
  { symbol: 'ITUB4', name: 'Itaú Unibanco', price: 32.15 },
  { symbol: 'BBDC4', name: 'Bradesco', price: 15.78 },
  { symbol: 'ABEV3', name: 'Ambev', price: 13.42 },
  { symbol: 'BOVA11', name: 'iShares Ibovespa', price: 128.65 },
];

const expirations = ['20 Fev 2026', '20 Mar 2026', '17 Abr 2026', '15 Mai 2026'];

export function OptionChain() {
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [selectedExpiration, setSelectedExpiration] = useState(expirations[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGreeks, setShowGreeks] = useState(false);

  const chainData = useMemo(() => {
    return generateMockChain(selectedAsset.price, selectedAsset.symbol);
  }, [selectedAsset]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return chainData;
    return chainData.filter(row => 
      row.strike.toString().includes(searchTerm) ||
      row.call.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.put.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chainData, searchTerm]);

  const atmIndex = useMemo(() => {
    return filteredData.findIndex(row => row.strike >= selectedAsset.price);
  }, [filteredData, selectedAsset.price]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Cadeia de Opções</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize as opções disponíveis para os principais ativos da B3. 
            Acompanhe preços, volumes, volatilidade implícita e gregas em tempo real.
          </p>
        </div>

        {/* Controls */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Asset Selection */}
              <div className="flex flex-wrap gap-2">
                {assets.map(asset => (
                  <Button
                    key={asset.symbol}
                    variant={selectedAsset.symbol === asset.symbol ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAsset(asset)}
                    className={selectedAsset.symbol === asset.symbol 
                      ? 'bg-teal-400 text-background hover:bg-teal-500' 
                      : 'border-white/20 hover:bg-white/5'
                    }
                  >
                    {asset.symbol}
                  </Button>
                ))}
              </div>

              {/* Expiration Selection */}
              <Tabs value={selectedExpiration} onValueChange={setSelectedExpiration}>
                <TabsList className="bg-secondary/50">
                  {expirations.map(exp => (
                    <TabsTrigger key={exp} value={exp} className="text-xs">
                      {exp}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar strike..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-40 bg-secondary/50 border-border/50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowGreeks(!showGreeks)}
                  className={`border-white/20 ${showGreeks ? 'bg-teal-400/20 text-teal-400' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-white/20">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Info */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedAsset.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAsset.name}</p>
                </div>
                <div className="h-10 w-px bg-border/50" />
                <div>
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(selectedAsset.price)}
                  </span>
                  <span className="text-sm text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +1.23%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <span className="text-muted-foreground block">Vencimento</span>
                  <span className="text-white font-medium">{selectedExpiration}</span>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground block">Dias Restantes</span>
                  <span className="text-white font-medium">32</span>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground block">IV ATM</span>
                  <span className="text-teal-400 font-medium">32.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options Chain Table */}
        <Card className="glass-card overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Table2 className="w-5 h-5 text-teal-400" />
              Book de Opções
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    {/* CALLS */}
                    <TableHead className="text-teal-400 text-center bg-teal-400/5">Volume</TableHead>
                    <TableHead className="text-teal-400 text-center bg-teal-400/5">OI</TableHead>
                    <TableHead className="text-teal-400 text-center bg-teal-400/5">IV</TableHead>
                    {showGreeks && (
                      <>
                        <TableHead className="text-teal-400 text-center bg-teal-400/5">Δ</TableHead>
                        <TableHead className="text-teal-400 text-center bg-teal-400/5">Γ</TableHead>
                        <TableHead className="text-teal-400 text-center bg-teal-400/5">Θ</TableHead>
                      </>
                    )}
                    <TableHead className="text-teal-400 text-right bg-teal-400/5">Último</TableHead>
                    <TableHead className="text-teal-400 text-right bg-teal-400/5">Var</TableHead>
                    <TableHead className="text-white text-center bg-white/10 font-bold">Strike</TableHead>
                    {/* PUTS */}
                    <TableHead className="text-cyan-400 text-right bg-cyan-400/5">Var</TableHead>
                    <TableHead className="text-cyan-400 text-right bg-cyan-400/5">Último</TableHead>
                    {showGreeks && (
                      <>
                        <TableHead className="text-cyan-400 text-center bg-cyan-400/5">Θ</TableHead>
                        <TableHead className="text-cyan-400 text-center bg-cyan-400/5">Γ</TableHead>
                        <TableHead className="text-cyan-400 text-center bg-cyan-400/5">Δ</TableHead>
                      </>
                    )}
                    <TableHead className="text-cyan-400 text-center bg-cyan-400/5">IV</TableHead>
                    <TableHead className="text-cyan-400 text-center bg-cyan-400/5">OI</TableHead>
                    <TableHead className="text-cyan-400 text-center bg-cyan-400/5">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, index) => {
                    const isATM = index === atmIndex;
                    return (
                      <TableRow 
                        key={row.strike} 
                        className={`border-border/30 ${isATM ? 'bg-teal-400/10' : 'hover:bg-white/5'}`}
                      >
                        {/* CALLS */}
                        <TableCell className="text-center text-muted-foreground">
                          {formatNumber(row.call.volume)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatNumber(row.call.openInterest)}
                        </TableCell>
                        <TableCell className="text-center text-teal-400">
                          {row.call.impliedVolatility.toFixed(1)}%
                        </TableCell>
                        {showGreeks && (
                          <>
                            <TableCell className="text-center text-muted-foreground">
                              {row.call.delta.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {row.call.gamma.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {row.call.theta.toFixed(3)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right font-mono text-white">
                          {formatCurrency(row.call.lastPrice)}
                        </TableCell>
                        <TableCell className={`text-right ${row.call.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {row.call.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {row.call.changePercent.toFixed(2)}%
                          </div>
                        </TableCell>
                        
                        {/* STRIKE */}
                        <TableCell className="text-center bg-white/5">
                          <Badge variant={isATM ? 'default' : 'outline'} className={isATM ? 'bg-teal-400 text-background' : ''}>
                            {formatCurrency(row.strike)}
                          </Badge>
                        </TableCell>
                        
                        {/* PUTS */}
                        <TableCell className={`text-right ${row.put.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {row.put.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {row.put.changePercent.toFixed(2)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-white">
                          {formatCurrency(row.put.lastPrice)}
                        </TableCell>
                        {showGreeks && (
                          <>
                            <TableCell className="text-center text-muted-foreground">
                              {row.put.theta.toFixed(3)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {row.put.gamma.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {row.put.delta.toFixed(3)}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-center text-cyan-400">
                          {row.put.impliedVolatility.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatNumber(row.put.openInterest)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatNumber(row.put.volume)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-teal-400/20 border border-teal-400" />
            <span>Calls</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-cyan-400/20 border border-cyan-400" />
            <span>Puts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-teal-400/30" />
            <span>ATM (At-the-Money)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span>Baixa</span>
          </div>
        </div>
      </div>
    </section>
  );
}
