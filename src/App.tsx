import { useState } from 'react';
import { Navbar } from '@/sections/Navbar';
import { Hero } from '@/sections/Hero';
import { Dashboard } from '@/sections/Dashboard';
import { Calculator } from '@/sections/Calculator';
import { GreeksChart } from '@/sections/GreeksChart';
import { PayoffAnalysis } from '@/sections/PayoffAnalysis';
import { VolatilitySurface } from '@/sections/VolatilitySurface';
import { OptionChain } from '@/sections/OptionChain';
import { Footer } from '@/sections/Footer';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main>
        <Hero />
        
        <div id="dashboard" className="scroll-mt-20">
          <Dashboard />
        </div>
        
        <div id="calculator" className="scroll-mt-20">
          <Calculator />
        </div>
        
        <div id="greeks" className="scroll-mt-20">
          <GreeksChart />
        </div>
        
        <div id="payoff" className="scroll-mt-20">
          <PayoffAnalysis />
        </div>
        
        <div id="volatility" className="scroll-mt-20">
          <VolatilitySurface />
        </div>
        
        <div id="chain" className="scroll-mt-20">
          <OptionChain />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
