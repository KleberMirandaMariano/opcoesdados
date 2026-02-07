import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, Activity, Clock, Zap, TrendingDown } from 'lucide-react';
import { calculateBlackScholes, generatePriceRange, formatCurrency } from '@/lib/options';

interface GreekDataPoint {
  price: number;
  call: number;
  put: number;
  label: string;
}

export function GreeksChart() {
  const [spot] = useState(100);
  const [strike] = useState(100);
  const [maturity] = useState(30);
  const [volatility] = useState(30);
  const [riskFreeRate] = useState(10.5);

  const prices = useMemo(() => generatePriceRange(strike, 0.3, 40), [strike]);

  const deltaData: GreekDataPoint[] = useMemo(() => {
    return prices.map(price => {
      const callResult = calculateBlackScholes({
        symbol: '', type: 'CALL', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      const putResult = calculateBlackScholes({
        symbol: '', type: 'PUT', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      return {
        price,
        call: callResult.greeks.delta,
        put: putResult.greeks.delta,
        label: formatCurrency(price)
      };
    });
  }, [prices, strike, maturity, volatility, riskFreeRate]);

  const gammaData: GreekDataPoint[] = useMemo(() => {
    return prices.map(price => {
      const callResult = calculateBlackScholes({
        symbol: '', type: 'CALL', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      return {
        price,
        call: callResult.greeks.gamma,
        put: callResult.greeks.gamma,
        label: formatCurrency(price)
      };
    });
  }, [prices, strike, maturity, volatility, riskFreeRate]);

  const thetaData: GreekDataPoint[] = useMemo(() => {
    return prices.map(price => {
      const callResult = calculateBlackScholes({
        symbol: '', type: 'CALL', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      const putResult = calculateBlackScholes({
        symbol: '', type: 'PUT', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      return {
        price,
        call: callResult.greeks.theta,
        put: putResult.greeks.theta,
        label: formatCurrency(price)
      };
    });
  }, [prices, strike, maturity, volatility, riskFreeRate]);

  const vegaData: GreekDataPoint[] = useMemo(() => {
    return prices.map(price => {
      const callResult = calculateBlackScholes({
        symbol: '', type: 'CALL', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      return {
        price,
        call: callResult.greeks.vega,
        put: callResult.greeks.vega,
        label: formatCurrency(price)
      };
    });
  }, [prices, strike, maturity, volatility, riskFreeRate]);

  const rhoData: GreekDataPoint[] = useMemo(() => {
    return prices.map(price => {
      const callResult = calculateBlackScholes({
        symbol: '', type: 'CALL', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      const putResult = calculateBlackScholes({
        symbol: '', type: 'PUT', spot: price, strike,
        maturity: maturity / 365, volatility: volatility / 100, riskFreeRate: riskFreeRate / 100
      });
      return {
        price,
        call: callResult.greeks.rho,
        put: putResult.greeks.rho,
        label: formatCurrency(price)
      };
    });
  }, [prices, strike, maturity, volatility, riskFreeRate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm text-muted-foreground mb-2">Preço: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(4)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Análise de Gregas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize como as gregas variam com o preço do ativo subjacente. 
            Entenda a sensibilidade da opção a diferentes fatores de mercado.
          </p>
        </div>

        {/* Parameters Summary */}
        <Card className="glass-card mb-8">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Spot</span>
                <span className="text-lg font-semibold text-white">{formatCurrency(spot)}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Strike</span>
                <span className="text-lg font-semibold text-cyan-400">{formatCurrency(strike)}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Vencimento</span>
                <span className="text-lg font-semibold text-white">{maturity} dias</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Volatilidade</span>
                <span className="text-lg font-semibold text-white">{volatility}%</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground block">Taxa</span>
                <span className="text-lg font-semibold text-white">{riskFreeRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Greeks Charts */}
        <Tabs defaultValue="delta" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-8">
            <TabsTrigger value="delta" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Delta
            </TabsTrigger>
            <TabsTrigger value="gamma" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Gamma
            </TabsTrigger>
            <TabsTrigger value="theta" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Theta
            </TabsTrigger>
            <TabsTrigger value="vega" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Vega
            </TabsTrigger>
            <TabsTrigger value="rho" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Rho
            </TabsTrigger>
          </TabsList>

          <TabsContent value="delta">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  Delta (Δ) - Sensibilidade ao Preço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={deltaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={formatCurrency(strike)} stroke="#2dd4bf" strokeDasharray="5 5" />
                      <Area 
                        type="monotone" 
                        dataKey="call" 
                        name="Call" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="put" 
                        name="Put" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O Delta mede a variação no preço da opção para cada R$ 1 de variação no ativo subjacente. 
                  Calls têm delta positivo (0 a 1), Puts têm delta negativo (-1 a 0).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamma">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Gamma (Γ) - Taxa de Mudança do Delta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={gammaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={formatCurrency(strike)} stroke="#22d3ee" strokeDasharray="5 5" />
                      <Area 
                        type="monotone" 
                        dataKey="call" 
                        name="Gamma" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O Gamma é mais alto quando o preço está próximo do strike (ATM). 
                  Indica o quanto o delta mudará com variações no preço do ativo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theta">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  Theta (Θ) - Decaimento Temporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={thetaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={formatCurrency(strike)} stroke="#2dd4bf" strokeDasharray="5 5" />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                      <Area 
                        type="monotone" 
                        dataKey="call" 
                        name="Call" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="put" 
                        name="Put" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O Theta representa a perda de valor da opção por dia decorrido. 
                  É tipicamente negativo para posições compradas (long).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vega">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Vega (V) - Sensibilidade à Volatilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={vegaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={formatCurrency(strike)} stroke="#22d3ee" strokeDasharray="5 5" />
                      <Area 
                        type="monotone" 
                        dataKey="call" 
                        name="Vega" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O Vega mede a variação no preço da opção para cada 1% de mudança na volatilidade implícita. 
                  É mais alto para opções ATM e com mais tempo até o vencimento.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rho">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-teal-400" />
                  Rho (ρ) - Sensibilidade à Taxa de Juros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rhoData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={formatCurrency(strike)} stroke="#2dd4bf" strokeDasharray="5 5" />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                      <Area 
                        type="monotone" 
                        dataKey="call" 
                        name="Call" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="put" 
                        name="Put" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O Rho mede a variação no preço da opção para cada 1% de mudança na taxa de juros. 
                  Calls têm rho positivo, Puts têm rho negativo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
