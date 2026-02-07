import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { Activity, TrendingUp, BarChart3, Info } from 'lucide-react';
import { generateVolatilitySmile, formatCurrency } from '@/lib/options';

export function VolatilitySurface() {
  const [spot, setSpot] = useState(100);
  const [baseVol, setBaseVol] = useState(30);
  const [skew, setSkew] = useState(0.1);

  const strikes = useMemo(() => {
    const strikes: number[] = [];
    for (let i = 70; i <= 130; i += 2) {
      strikes.push(i);
    }
    return strikes;
  }, []);

  const maturities = useMemo(() => [7, 14, 30, 60, 90, 180], []);

  const smileData = useMemo(() => {
    return generateVolatilitySmile(spot, strikes, 30 / 365, 0.105, baseVol / 100);
  }, [spot, strikes, baseVol]);

  const surfaceData = useMemo(() => {
    const data: any[] = [];
    maturities.forEach((mat) => {
      strikes.forEach((strike) => {
        const moneyness = strike / spot;
        const timeEffect = Math.sqrt(30 / mat);
        const skewEffect = Math.pow(moneyness - 1, 2) * skew + (1 - moneyness) * 0.05;
        const vol = (baseVol / 100 + skewEffect) * timeEffect;
        
        data.push({
          strike,
          maturity: mat,
          moneyness,
          volatility: vol * 100
        });
      });
    });
    return data;
  }, [spot, strikes, maturities, baseVol, skew]);

  const termStructureData = useMemo(() => {
    return maturities.map(mat => {
      const atmVol = baseVol + (30 / mat - 1) * 2;
      return {
        maturity: `${mat}d`,
        days: mat,
        atm: atmVol,
        iv90: atmVol * 0.95,
        iv110: atmVol * 1.05
      };
    });
  }, [maturities, baseVol]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-sm text-muted-foreground mb-2">
            {payload[0]?.payload?.strike ? `Strike: ${formatCurrency(payload[0].payload.strike)}` : label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed ? entry.value.toFixed(2) : entry.value}%
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
          <h2 className="text-3xl font-bold text-white mb-4">Análise de Volatilidade</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize o smile e a term structure da volatilidade implícita. 
            Entenda como o mercado precifica o risco em diferentes strikes e vencimentos.
          </p>
        </div>

        {/* Parameters */}
        <Card className="glass-card mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Preço Spot</Label>
                  <span className="text-sm font-mono text-teal-400">
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volatilidade ATM (%)</Label>
                  <span className="text-sm font-mono text-cyan-400">
                    {baseVol}%
                  </span>
                </div>
                <Slider
                  value={[baseVol]}
                  onValueChange={(v) => setBaseVol(v[0])}
                  min={10}
                  max={80}
                  step={1}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Skew (Inclinação)</Label>
                  <span className="text-sm font-mono text-white">
                    {skew.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[skew]}
                  onValueChange={(v) => setSkew(v[0])}
                  min={0}
                  max={0.5}
                  step={0.01}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="smile" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8">
            <TabsTrigger value="smile" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Volatility Smile
            </TabsTrigger>
            <TabsTrigger value="term" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Term Structure
            </TabsTrigger>
            <TabsTrigger value="surface" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Superficie 3D
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Volatility Smile (Skew)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={smileData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="strike" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(v) => formatCurrency(v)}
                        label={{ value: 'Strike', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(v) => `${v.toFixed(1)}%`}
                        label={{ value: 'Volatilidade Implicita (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={spot} stroke="#2dd4bf" strokeDasharray="5 5" label="ATM" />
                      <Area 
                        type="monotone" 
                        dataKey="impliedVol" 
                        name="IV" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-white/5">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      O <strong>Volatility Smile</strong> mostra como a volatilidade implicita varia com o strike. 
                      Normalmente, strikes mais baixos (OTM Puts) tem IV mais alta devido ao skew ou medo de quedas. 
                      O ponto ATM (at-the-money) geralmente tem a menor volatilidade.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="term">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Term Structure (Estrutura a Termo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={termStructureData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="maturity" 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        label={{ value: 'Vencimento', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(v) => `${v.toFixed(1)}%`}
                        label={{ value: 'Volatilidade Implicita (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="iv90" 
                        name="Strike 90%" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="atm" 
                        name="ATM" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.2}
                        strokeWidth={3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="iv110" 
                        name="Strike 110%" 
                        stroke="#22d3ee" 
                        fill="#22d3ee" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-white/5">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      A <strong>Term Structure</strong> mostra como a volatilidade implicita varia com o tempo ate o vencimento. 
                      Uma curva ascendente (contango) indica maior incerteza no longo prazo. 
                      Uma curva descendente (backwardation) pode indicar eventos de curto prazo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surface">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                  Superficie de Volatilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        type="number" 
                        dataKey="strike" 
                        name="Strike" 
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => formatCurrency(v)}
                        domain={['dataMin', 'dataMax']}
                        label={{ value: 'Strike', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="maturity" 
                        name="Vencimento" 
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(v) => `${v}d`}
                        domain={['dataMin', 'dataMax']}
                        label={{ value: 'Dias ate Vencimento', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <ZAxis type="number" dataKey="volatility" range={[50, 400]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                                <p className="text-sm text-muted-foreground">Strike: {formatCurrency(data.strike)}</p>
                                <p className="text-sm text-muted-foreground">Vencimento: {data.maturity} dias</p>
                                <p className="text-sm text-teal-400 font-semibold">
                                  IV: {data.volatility.toFixed(2)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Volatilidade" data={surfaceData} fill="#2dd4bf">
                        {surfaceData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${174 + entry.volatility}, ${72}%, ${30 + entry.volatility / 4}%)`}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-white/5">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      A <strong>Superficie de Volatilidade</strong> combina o smile e a term structure em uma visualizacao 3D. 
                      O tamanho e cor dos pontos indicam o nivel de volatilidade implicita para cada combinacao de strike e vencimento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <span className="text-xs text-muted-foreground block mb-1">IV ATM</span>
              <span className="text-2xl font-bold text-teal-400">{baseVol.toFixed(1)}%</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <span className="text-xs text-muted-foreground block mb-1">IV 90% (OTM Put)</span>
              <span className="text-2xl font-bold text-cyan-400">
                {(baseVol * (1 + skew * 2)).toFixed(1)}%
              </span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <span className="text-xs text-muted-foreground block mb-1">IV 110% (OTM Call)</span>
              <span className="text-2xl font-bold text-white">
                {(baseVol * (1 + skew)).toFixed(1)}%
              </span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <span className="text-xs text-muted-foreground block mb-1">Skew (90-110)</span>
              <span className="text-2xl font-bold text-teal-400">
                {(skew * 100).toFixed(1)}%
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
