import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Calculator as CalculatorIcon, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { calculateBlackScholes, formatCurrency, calculateBreakEven, calculateMaxProfitLoss } from '@/lib/options';
import type { OptionResult } from '@/types';

export function Calculator() {
  const [spot, setSpot] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [maturity, setMaturity] = useState<number>(30);
  const [volatility, setVolatility] = useState<number>(30);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(10.5);
  const [type, setType] = useState<'CALL' | 'PUT'>('CALL');
  const [result, setResult] = useState<OptionResult | null>(null);

  useEffect(() => {
    calculate();
  }, [spot, strike, maturity, volatility, riskFreeRate, type]);

  const calculate = () => {
    const data = {
      symbol: '',
      type,
      spot,
      strike,
      maturity: maturity / 365,
      volatility: volatility / 100,
      riskFreeRate: riskFreeRate / 100,
    };
    setResult(calculateBlackScholes(data));
  };

  const breakEven = result ? calculateBreakEven(strike, result.price, type) : 0;
  const { maxProfit, maxLoss } = result ? calculateMaxProfitLoss(strike, result.price, type, 'LONG') : { maxProfit: '-', maxLoss: '-' };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Calculadora Black-Scholes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calcule o preço teórico de opções europeias usando o modelo Black-Scholes. 
            Obtenha as gregas e análise de cenários em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalculatorIcon className="w-5 h-5 text-teal-400" />
                Parâmetros da Opção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Option Type */}
              <Tabs value={type} onValueChange={(v) => setType(v as 'CALL' | 'PUT')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="CALL" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    CALL
                  </TabsTrigger>
                  <TabsTrigger value="PUT" className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    PUT
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Spot Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="spot" className="text-sm font-medium">
                    Preço do Ativo (Spot)
                  </Label>
                  <span className="text-sm font-mono text-teal-400">
                    {formatCurrency(spot)}
                  </span>
                </div>
                <Input
                  id="spot"
                  type="number"
                  value={spot}
                  onChange={(e) => setSpot(Number(e.target.value))}
                  className="bg-secondary/50 border-border/50"
                />
                <Slider
                  value={[spot]}
                  onValueChange={(v) => setSpot(v[0])}
                  min={50}
                  max={200}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Strike Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="strike" className="text-sm font-medium">
                    Preço de Exercício (Strike)
                  </Label>
                  <span className="text-sm font-mono text-cyan-400">
                    {formatCurrency(strike)}
                  </span>
                </div>
                <Input
                  id="strike"
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(Number(e.target.value))}
                  className="bg-secondary/50 border-border/50"
                />
                <Slider
                  value={[strike]}
                  onValueChange={(v) => setStrike(v[0])}
                  min={50}
                  max={200}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Maturity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maturity" className="text-sm font-medium">
                    Dias até o Vencimento
                  </Label>
                  <span className="text-sm font-mono text-white">
                    {maturity} dias
                  </span>
                </div>
                <Input
                  id="maturity"
                  type="number"
                  value={maturity}
                  onChange={(e) => setMaturity(Number(e.target.value))}
                  className="bg-secondary/50 border-border/50"
                />
                <Slider
                  value={[maturity]}
                  onValueChange={(v) => setMaturity(v[0])}
                  min={1}
                  max={365}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Volatility */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volatility" className="text-sm font-medium">
                    Volatilidade Implícita (%)
                  </Label>
                  <span className="text-sm font-mono text-white">
                    {volatility}%
                  </span>
                </div>
                <Input
                  id="volatility"
                  type="number"
                  value={volatility}
                  onChange={(e) => setVolatility(Number(e.target.value))}
                  className="bg-secondary/50 border-border/50"
                />
                <Slider
                  value={[volatility]}
                  onValueChange={(v) => setVolatility(v[0])}
                  min={5}
                  max={100}
                  step={1}
                  className="py-2"
                />
              </div>

              {/* Risk Free Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate" className="text-sm font-medium">
                    Taxa Livre de Risco (% a.a.)
                  </Label>
                  <span className="text-sm font-mono text-white">
                    {riskFreeRate}%
                  </span>
                </div>
                <Input
                  id="rate"
                  type="number"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                  className="bg-secondary/50 border-border/50"
                />
                <Slider
                  value={[riskFreeRate]}
                  onValueChange={(v) => setRiskFreeRate(v[0])}
                  min={0}
                  max={20}
                  step={0.25}
                  className="py-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Main Result */}
            <Card className="glass-card glow-teal">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <span className="text-sm text-muted-foreground block mb-2">
                    Preço Teórico da Opção
                  </span>
                  <span className="text-5xl font-bold text-gradient">
                    {result ? formatCurrency(result.price) : '-'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Valor Intrínseco</span>
                    <span className="text-xl font-semibold text-white">
                      {result ? formatCurrency(result.intrinsicValue) : '-'}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Valor Temporal</span>
                    <span className="text-xl font-semibold text-teal-400">
                      {result ? formatCurrency(result.timeValue) : '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Greeks */}
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Gregas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-teal-400/10 to-transparent border border-teal-400/20">
                    <span className="text-xs text-muted-foreground block mb-1">Delta (Δ)</span>
                    <span className="text-2xl font-bold text-white">
                      {result ? result.greeks.delta.toFixed(4) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Sensibilidade ao preço
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-400/10 to-transparent border border-cyan-400/20">
                    <span className="text-xs text-muted-foreground block mb-1">Gamma (Γ)</span>
                    <span className="text-2xl font-bold text-white">
                      {result ? result.greeks.gamma.toFixed(4) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Curvatura do delta
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-teal-400/10 to-transparent border border-teal-400/20">
                    <span className="text-xs text-muted-foreground block mb-1">Theta (Θ)</span>
                    <span className="text-2xl font-bold text-white">
                      {result ? result.greeks.theta.toFixed(4) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Decaimento diário
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-400/10 to-transparent border border-cyan-400/20">
                    <span className="text-xs text-muted-foreground block mb-1">Vega (V)</span>
                    <span className="text-2xl font-bold text-white">
                      {result ? result.greeks.vega.toFixed(4) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Sensibilidade à vol
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-teal-400/10 to-transparent border border-teal-400/20">
                    <span className="text-xs text-muted-foreground block mb-1">Rho (ρ)</span>
                    <span className="text-2xl font-bold text-white">
                      {result ? result.greeks.rho.toFixed(4) : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Sensibilidade à taxa
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Analysis */}
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                  Análise de Cenários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Break-Even</span>
                    <span className="text-xl font-semibold text-white">
                      {formatCurrency(breakEven)}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Lucro Máximo</span>
                    <span className="text-xl font-semibold text-green-400">
                      {maxProfit}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Perda Máxima</span>
                    <span className="text-xl font-semibold text-red-400">
                      {maxLoss}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <span className="text-sm text-muted-foreground block">Moneyness</span>
                    <span className="text-xl font-semibold text-white">
                      {spot > strike ? 'ITM' : spot < strike ? 'OTM' : 'ATM'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
