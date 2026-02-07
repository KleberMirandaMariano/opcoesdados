import { TrendingUp, Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-background" />
              </div>
              <div>
                <span className="font-bold text-lg text-gradient">OpçõesExpert</span>
                <span className="text-xs text-muted-foreground block -mt-1">B3 Analytics</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Plataforma profissional de análise de opções para o mercado brasileiro. 
              Ferramentas quantitativas avançadas para traders e investidores.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/KleberMirandaMariano/Analise-opocoes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:contato@opcoesexpert.com" 
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Ferramentas</h4>
            <ul className="space-y-2">
              <li>
                <a href="#calculator" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Calculadora Black-Scholes
                </a>
              </li>
              <li>
                <a href="#greeks" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Análise de Gregas
                </a>
              </li>
              <li>
                <a href="#payoff" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Diagrama de Payoff
                </a>
              </li>
              <li>
                <a href="#volatility" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Superfície de Volatilidade
                </a>
              </li>
              <li>
                <a href="#chain" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Cadeia de Opções
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors flex items-center gap-1">
                  Documentação
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors flex items-center gap-1">
                  API Reference
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Tutoriais
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-teal-400 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 OpçõesExpert. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Aviso de Risco:</strong> Operações com opções envolvem riscos significativos e podem resultar em perdas. 
            As informações apresentadas são apenas para fins educacionais e não constituem recomendação de investimento. 
            Sempre consulte um profissional qualificado antes de tomar decisões de investimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
