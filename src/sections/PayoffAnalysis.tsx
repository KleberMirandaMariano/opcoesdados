import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area
} from 'recharts';
import { PieChart, TrendingUp, TrendingDown, Calculator, ArrowRightLeft, Activity } from 'lucide-react';
import { calculatePayoff, generatePriceRange, formatCurrency } from '@/lib/options';

export function PayoffAnalysis() {
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [premium, setPremium] = useState(5);
  const [type, setType] = useState<'CALL' | 'PUT'>('CALL');
  const [position, setPosition] = useState<'LONG' | 'SHORT'>('LONG');
  const [strategy, setStrategy] = useState<'single' | 'spread' | 'straddle'>('single');

  const prices = useMemo(() => generatePriceRange(strike, 0.4, 60), [strike]);

  const payoffData = useMemo(() => {
    if (strategy === 'single') {
      return calculatePayoff(prices, strike, premium, type, position).map(p => ({
        ...p,
        label: formatCurrency(p.price)
      }));
    } else if (strategy === 'spread') {
      // Bull Call Spread
      const lowerStrike = strike * 0.9;
      const upperStrike = strike * 1.1;
      const lowerPremium = premium;
      const upperPremium = premium * 0.3;
      
      return prices.map(price => {
        const longCall = Math.max(0, price - lowerStrike);
        const shortCall = -Math.max(0, price - upperStrike);
        const totalPayoff = longCall - lowerPremium + (upperPremium - shortCall);
        
        return {
          price,
          payoff: position === 'LONG' ? totalPayoff : -totalPayoff,
          intrinsic: longCall + shortCall,
          label: formatCurrency(price)
        };
      });
    } else {
      // Long Straddle
      const callPayoff = prices.map(p => Math.max(0, p - strike));
      const putPayoff = prices.map(p => Math.max(0, strike - p));
      const totalPremium = premium * 2;
      
      return prices.map((price, i) => ({
        price,
        payoff: callPayoff[i] + putPayoff[i] - totalPremium,
        intrinsic: callPayoff[i] + putPayoff[i],
        label: formatCurrency(price)
      }));
    }
  }, [prices, strike, premium, type, position, strategy]);

  const maxProfit = Math.max(...payoffData.map(d => d.payoff));
  const maxLoss = Math.min(...payoffData.map(d => d.payoff));
  const breakEvenPoints = payoffData.filter(d => Math.abs(d.payoff) < 0.5).map(d => d.price);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm text-muted-foreground mb-2">Preço: {label}</p>
          <p className="text-sm text-teal-400">
            Payoff: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Análise de Payoff</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize o resultado de suas estratégias de opções em diferentes cenários de preço. 
            Identifique break-even points e analise risco/retorno.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-400" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Strategy Type */}
              <Tabs value={strategy} onValueChange={(v) => setStrategy(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="single">Simples</TabsTrigger>
                  <TabsTrigger value="spread">Spread</TabsTrigger>
                  <TabsTrigger value="straddle">Straddle</TabsTrigger>
                </TabsList>
              </Tabs>

              {strategy === 'single' && (
                <>
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

                  {/* Position */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Posição</Label>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${position === 'SHORT' ? 'text-muted-foreground' : 'text-teal-400'}`}>
                        COMPRA
                      </span>
                      <Switch
                        checked={position === 'SHORT'}
                        onCheckedChange={(checked) => setPosition(checked ? 'SHORT' : 'LONG')}
                      />
                      <span className={`text-sm ${position === 'LONG' ? 'text-muted-foreground' : 'text-red-400'}`}>
                        VENDA
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Strike Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Strike</Label>
                  <span className="text-sm font-mono text-cyan-400">
                    {formatCurrency(strike)}
                  </span>
                </div>
                <Slider
                  value={[strike]}
                  onValueChange={(v) => setStrike(v[0])}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>

              {/* Premium */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Prêmio</Label>
                  <span className="text-sm font-mono text-teal-400">
                    {formatCurrency(premium)}
                  </span>
                </div>
                <Slider
                  value={[premium]}
                  onValueChange={(v) => setPremium(v[0])}
                  min={0.5}
                  max={20}
                  step={0.5}
                />
              </div>

              {/* Current Spot */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Preço Atual (Spot)</Label>
                  <span className="text-sm font-mono text-white">
                    {formatCurrency(spot)}
                  </span>
                </div>
                <Slider
                  value={[spot]}
                  onValueChange={(v) => setSpot(v[0])}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>

              {/* Strategy Description */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-400/10 to-cyan-400/10 border border-teal-400/20">
                <span className="text-sm text-muted-foreground block mb-2">Estratégia</span>
                <p className="text-sm text-white">
                  {strategy === 'single' && `${position === 'LONG' ? 'Compra' : 'Venda'} de ${type === 'CALL' ? 'Call' : 'Put'} a ${formatCurrency(strike)}`}
                  {strategy === 'spread' && 'Bull Call Spread - Compra Call ITM + Venda Call OTM'}
                  {strategy === 'straddle' && 'Long Straddle - Compra Call + Put mesmo strike'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chart Section */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-cyan-400" />
                Diagrama de Payoff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={payoffData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={4}
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.5)" />
                    <ReferenceLine x={formatCurrency(strike)} stroke="#2dd4bf" strokeDasharray="5 5" label="Strike" />
                    <ReferenceLine x={formatCurrency(spot)} stroke="#22d3ee" strokeDasharray="5 5" label="Spot" />
                    <Area
                      type="monotone"
                      dataKey="payoff"
                      stroke="#2dd4bf"
                      fill="#2dd4bf"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                  <span className="text-xs text-muted-foreground block">Lucro Máximo</span>
                  <span className="text-xl font-bold text-green-400">
                    {maxProfit > 0 ? formatCurrency(maxProfit) : 'Limitado'}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-red-400/10 border border-red-400/20">
                  <span className="text-xs text-muted-foreground block">Perda Máxima</span>
                  <span className="text-xl font-bold text-red-400">
                    {formatCurrency(Math.abs(maxLoss))}
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <span className="text-xs text-muted-foreground block">Break-Even</span>
                  <span className="text-xl font-bold text-white">
                    {breakEvenPoints.length > 0 
                      ? breakEvenPoints.map(p => formatCurrency(p)).join(' / ')
                      : '-'
                    }
                  </span>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <span className="text-xs text-muted-foreground block">Razão Risco/Retorno</span>
                  <span className="text-xl font-bold text-white">
                    {maxProfit > 0 && Math.abs(maxLoss) > 0 
                      ? (maxProfit / Math.abs(maxLoss)).toFixed(2)
                      : '-'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Examples */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <Card className="glass-card hover:border-teal-400/50 transition-colors cursor-pointer" onClick={() => setStrategy('single')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-400/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Opção Simples</h3>
                  <p className="text-sm text-muted-foreground">Long ou Short</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Estratégia básica de compra ou venda de Calls ou Puts. 
                Ideal para visão direcional clara do mercado.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-cyan-400/50 transition-colors cursor-pointer" onClick={() => setStrategy('spread')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bull Call Spread</h3>
                  <p className="text-sm text-muted-foreground">Débito Spread</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Compra Call ITM e venda Call OTM. Limita lucro e perda, 
                reduz custo da posição comprada.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-teal-400/50 transition-colors cursor-pointer" onClick={() => setStrategy('straddle')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-teal-400/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Long Straddle</h3>
                  <p className="text-sm text-muted-foreground">Volatilidade</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Compra de Call e Put no mesmo strike. Lucra com movimentos 
                fortes em qualquer direção.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
