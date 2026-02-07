import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import requests
from datetime import datetime
from charts import (
    create_payoff_chart, create_volatility_smile_chart, 
    create_greeks_chart, create_volatility_surface_3d
)

# Configuration
st.set_page_config(
    page_title="OpçõesExpert - B3 Analytics",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# API Base URL
API_URL = "http://localhost:8000"

# Inject Custom CSS (Replicating index.css)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :root {
        --background: #030712;
        --card: #030816;
        --primary: #2dd4bf;
        --secondary: #0f172a;
        --muted-foreground: #94a3b8;
        --border: #1e293b;
    }

    body {
        font-family: 'Inter', sans-serif;
        background-color: var(--background);
        color: white;
    }

    /* Hide Streamlit default elements */
    #MainMenu {visibility: hidden;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .stApp {
        background-color: var(--background);
    }

    /* Glassmorphism */
    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
    }

    .text-gradient {
        background: linear-gradient(to right, #2dd4bf, #22d3ee);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: bold;
    }

    .btn-primary {
        background: linear-gradient(to right, #2dd4bf, #06b6d4);
        color: #030712;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        display: inline-block;
        border: none;
        text-align: center;
    }

    .btn-outline {
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        display: inline-block;
        text-align: center;
    }

    .nav-link {
        color: #94a3b8;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        padding: 5px 10px;
        transition: color 0.3s;
    }

    .nav-link:hover {
        color: #2dd4bf;
    }

    /* Hero Section Styles */
    .hero-badge {
        background: rgba(45, 212, 191, 0.1);
        border: 1px solid rgba(45, 212, 191, 0.2);
        color: #2dd4bf;
        padding: 5px 15px;
        border-radius: 9999px;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
    }

    .hero-title {
        font-size: 4rem;
        font-weight: 700;
        line-height: 1.1;
        margin-bottom: 20px;
    }

    .hero-description {
        color: #94a3b8;
        font-size: 1.25rem;
        max-width: 800px;
        margin: 0 auto 40px;
    }

    /* Animations */
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.75; }
        50% { transform: scale(1.5); opacity: 0; }
    }
    .pulse-dot {
        width: 8px;
        height: 8px;
        background-color: #2dd4bf;
        border-radius: 50%;
        position: relative;
    }
    .pulse-dot::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: #2dd4bf;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    /* Metric Card Customization */
    [data-testid="stMetricValue"] {
        font-size: 2rem;
        font-weight: 700;
        color: white;
    }
    [data-testid="stMetricLabel"] {
        color: #94a3b8 !important;
    }
</style>
""", unsafe_allow_html=True)

# Helper functions
def fetch_assets():
    try:
        response = requests.get(f"{API_URL}/market/assets")
        return response.json()
    except:
        return []

def fetch_indicators():
    try:
        response = requests.get(f"{API_URL}/market/indicators")
        return response.json()
    except:
        return []

# --- 1. NAVBAR ---
def render_navbar():
    st.markdown(f"""
    <div style="position: fixed; top: 0; left: 0; right: 0; height: 64px; background: rgba(3, 7, 18, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 1000; padding: 0 40px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #2dd4bf, #06b6d4); display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px; font-weight: bold; color: #030712;">📈</span>
            </div>
            <div>
                <span style="font-weight: bold; font-size: 18px;" class="text-gradient">OpçõesExpert</span>
                <span style="display: block; font-size: 10px; color: #94a3b8; margin-top: -4px;">B3 Analytics</span>
            </div>
        </div>
        <div style="display: flex; gap: 20px;">
            <a href="#dashboard" class="nav-link">Dashboard</a>
            <a href="#calculator" class="nav-link">Calculadora</a>
            <a href="#payoff" class="nav-link">Payoff</a>
            <a href="#volatility" class="nav-link">Volatilidade</a>
            <a href="#chain" class="nav-link">Chain</a>
        </div>
    </div>
    <div style="height: 64px;"></div>
    """, unsafe_allow_html=True)

# --- 2. HERO ---
def render_hero():
    st.markdown("""
    <div style="text-align: center; padding: 100px 20px; position: relative;">
        <div class="hero-badge">
            <span class="pulse-dot"></span>
            Plataforma Profissional de Análise
        </div>
        <h1 class="hero-title">
            <span style="color: white;">Domine o Mercado</span><br>
            <span class="text-gradient">de Opções B3</span>
        </h1>
        <p class="hero-description">
            Ferramenta quantitativa completa para análise de opções. 
            Calcule gregas, visualize payoffs e tome decisões informadas 
            com precisão profissional.
        </p>
        <div style="display: flex; justify-content: center; gap: 20px;">
            <a href="#calculator" class="btn-primary">Começar Agora →</a>
            <a href="#dashboard" class="btn-outline">Explorar Dashboard</a>
        </div>
    </div>
    """, unsafe_allow_html=True)

# --- 3. DASHBOARD ---
def render_dashboard():
    st.markdown('<div id="dashboard" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    
    col_h1, col_h2 = st.columns([2, 1])
    with col_h1:
        st.markdown('<h2 style="font-weight: 700; margin-bottom: 5px;">Dashboard de Mercado</h2>', unsafe_allow_html=True)
        st.markdown('<p style="color: #94a3b8; margin-bottom: 30px;">Acompanhe os principais ativos do mercado brasileiro em tempo real</p>', unsafe_allow_html=True)
    with col_h2:
        st.markdown(f'<div style="text-align: right; color: #94a3b8; font-size: 14px; margin-top: 10px;">🕒 {datetime.now().strftime("%H:%M:%S - %d/%m/%Y")}</div>', unsafe_allow_html=True)

    # Search Bar (Simplified simulation)
    st.markdown("""
    <div class="glass-card" style="padding: 15px; margin-bottom: 30px;">
        <input type="text" placeholder="Digite o código da ação (ex: PETR4, VALE3, ITUB4...)" 
               style="width: 100%; height: 48px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding-left: 40px; color: white;">
    </div>
    """, unsafe_allow_html=True)
    
    # Indicators
    indicators = fetch_indicators()
    cols = st.columns(len(indicators) if indicators else 3)
    for i, ind in enumerate(indicators):
        with cols[i]:
            val = ind['value']
            label = ind['label']
            if label == 'IBOV':
                fmt_val = f"{val:,.0f}"
            elif label == 'DÓLAR':
                fmt_val = f"{val:,.4f}"
            else:
                fmt_val = f"{val:,.2f}"
                
            st.markdown(f"""
            <div class="glass-card" style="box-shadow: 0 0 40px rgba(45, 212, 191, 0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #94a3b8; font-size: 14px;">{label}</span>
                    <span style="color: #2dd4bf;">📈</span>
                </div>
                <div style="font-size: 28px; font-weight: bold; margin: 10px 0;">
                    {fmt_val}
                    <span style="font-size: 16px; font-weight: 500; color: {'#4ade80' if ind['change'] >= 0 else '#f87171'}; margin-left: 10px;">
                        {'▲' if ind['change'] >= 0 else '▼'} {ind['change_percent']:.2f}%
                    </span>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Assets Table & Selected Detail
    col_t1, col_t2 = st.columns([2, 1])
    
    with col_t1:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown('<div style="font-weight: 600; font-size: 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;"><span style="color: #2dd4bf;">📊</span> Ativos Mais Negociados</div>', unsafe_allow_html=True)
        assets = fetch_assets()
        if assets:
            df_assets = pd.DataFrame(assets)
            st.dataframe(
                df_assets[['symbol', 'name', 'price', 'change_percent', 'volume']],
                use_container_width=True,
                column_config={
                    "symbol": "Ativo",
                    "name": "Nome",
                    "price": st.column_config.NumberColumn("Preço", format="R$ %.2f"),
                    "change_percent": st.column_config.NumberColumn("Variação", format="%.2f%%"),
                    "volume": st.column_config.NumberColumn("Volume", format="%d")
                },
                hide_index=True
            )
        st.markdown('</div>', unsafe_allow_html=True)

    with col_t2:
        if assets:
            sel = assets[0] # Default to first for mock
            st.markdown(f"""
            <div class="glass-card" style="box-shadow: 0 0 40px rgba(34, 211, 238, 0.15); border-color: rgba(34, 211, 238, 0.3);">
                <div style="font-weight: 600; font-size: 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;"><span style="color: #22d3ee;">💰</span> {sel['symbol']} - Detalhes</div>
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="color: #94a3b8; font-size: 14px;">{sel['name']}</div>
                    <div style="font-size: 42px; font-weight: 700; color: white;">R$ {sel['price']:.2f}</div>
                    <div style="color: #4ade80; font-size: 18px; font-weight: 600;">+{sel['change']:.2f} ({sel['change_percent']:.2f}%)</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                        <span style="color: #94a3b8; font-size: 12px; display: block;">Abertura</span>
                        <span style="font-weight: 600;">R$ {sel['open']:.2f}</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                        <span style="color: #94a3b8; font-size: 12px; display: block;">Fechamento</span>
                        <span style="font-weight: 600;">R$ {sel['close']:.2f}</span>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(34, 211, 238, 0.1)); border-radius: 8px; border: 1px solid rgba(45, 212, 191, 0.2);">
                    <p style="font-size: 13px; margin: 0;">{sel['symbol']} é um dos ativos mais líquidos da B3, com forte presença no mercado de opções. Analise as gregas e estratégias disponíveis para este ativo.</p>
                </div>
                <div style="margin-top: 25px; display: flex; gap: 10px;">
                    <a href="#calculator" style="flex: 1;" class="btn-primary">Calcular</a>
                    <a href="#chain" style="flex: 1;" class="btn-outline">Ver Chain</a>
                </div>
            </div>
            """, unsafe_allow_html=True)

# --- 4. CALCULATOR ---
def render_calculator():
    st.markdown('<div id="calculator" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.header("Calculadora Black-Scholes")
    
    with st.container():
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        c1, c2 = st.columns([1, 2])
        
        with c1:
            st.subheader("Configuração")
            opt_type = st.selectbox("Tipo de Opção", ["CALL", "PUT"])
            spot = st.number_input("Preço Spot (R$)", value=36.85)
            strike = st.number_input("Preço Strike (R$)", value=37.00)
            days = st.number_input("Dias para Vencimento", value=30)
            vol = st.slider("Volatilidade (%)", 10, 100, 32)
            rate = st.slider("Taxa de Juros (%)", 0.0, 15.0, 10.5)
            
            input_data = {
                "type": opt_type,
                "spot": spot,
                "strike": strike,
                "maturity": days / 365,
                "volatility": vol,
                "risk_free_rate": rate,
                "symbol": "CALC"
            }
            
            # API Call for calculation
            try:
                res = requests.post(f"{API_URL}/calculate/option", json=input_data).json()
            except:
                res = None

        with c2:
            if res:
                st.subheader("Resultados Teóricos")
                res_cols = st.columns(3)
                res_cols[0].metric("Preço Teórico", f"R$ {res['price']:.2f}")
                res_cols[1].metric("Valor Intrínseco", f"R$ {res['intrinsic_value']:.2f}")
                res_cols[2].metric("Valor no Tempo", f"R$ {res['time_value']:.2f}")
                
                st.markdown("---")
                st.subheader("Análise de Gregas")
                fig_greeks = create_greeks_chart(res['greeks'])
                st.plotly_chart(fig_greeks, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

# --- 5. PAYOFF ---
def render_payoff():
    st.markdown('<div id="payoff" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.header("Análise de Payoff")
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    
    # Sample Payoff Data
    prices = np.linspace(25, 50, 50)
    payoff_data = [{"price": p, "payoff": max(0, p - 37) - 1.5, "intrinsic": max(0, p - 37)} for p in prices]
    
    fig_payoff = create_payoff_chart(payoff_data, 37, 36.85)
    st.plotly_chart(fig_payoff, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# --- 6. VOLATILITY ---
def render_volatility():
    st.markdown('<div id="volatility" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.header("Análise de Volatilidade")
    st.markdown('<p style="color: #94a3b8; margin-bottom: 30px;">Visualize o smile e a term structure da volatilidade implícita</p>', unsafe_allow_html=True)
    
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    tab1, tab2, tab3 = st.tabs(["Volatility Smile", "Estrutura a Termo", "Superfície 3D"])
    
    with tab1:
        strikes = np.linspace(30, 45, 15)
        smile_data = [{"strike": s, "implied_vol": 32 + (s/37 - 1)**2 * 100} for s in strikes]
        fig_smile = create_volatility_smile_chart(smile_data, 36.85)
        st.plotly_chart(fig_smile, use_container_width=True)
    
    with tab2:
        st.markdown('<div style="height: 300px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">Estrutura a Termo (Visualização Plotly)</div>', unsafe_allow_html=True)

    with tab3:
        surface_list = []
        for mat in [7, 30, 60, 90, 180]:
            for s in np.linspace(30, 45, 10):
                iv = 32 + (s/37 - 1)**2 * 50 + (30/mat) * 5
                surface_list.append({"strike": s, "maturity": mat, "volatility": iv})
        fig_surface = create_volatility_surface_3d(surface_list)
        st.plotly_chart(fig_surface, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# --- 7. OPTION CHAIN ---
def render_option_chain():
    st.markdown('<div id="chain" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.header("Cadeia de Opções")
    st.markdown('<p style="color: #94a3b8; margin-bottom: 30px;">Visualize as opções disponíveis para os principais ativos da B3</p>', unsafe_allow_html=True)

    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    
    # Header buttons simulation
    st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; gap: 10px;">
            <span class="btn-primary" style="padding: 5px 15px; font-size: 12px; cursor: pointer;">PETR4</span>
            <span class="btn-outline" style="padding: 5px 15px; font-size: 12px; cursor: pointer;">VALE3</span>
            <span class="btn-outline" style="padding: 5px 15px; font-size: 12px; cursor: pointer;">ITUB4</span>
        </div>
        <div style="color: #94a3b8; font-size: 14px;">Vencimento: <span style="color: white; font-weight: 600;">20 Fev 2026</span> (32 dias)</div>
    </div>
    """, unsafe_allow_html=True)

    # Simplified mock table matching the original React columns
    data = []
    for strike in range(30, 45):
        data.append({
            "Strike": strike,
            "C_Last": 1.25 + (37 - strike) * 0.8 if strike < 37 else 0.5/(strike-36),
            "C_Vol": 1200 - (strike - 37)**2 * 50,
            "IV": 32 + (strike/37 - 1)**2 * 50,
            "P_Last": 1.25 + (strike - 37) * 0.8 if strike > 37 else 0.5/(38-strike),
            "P_Vol": 800 - (strike - 37)**2 * 30,
        })
    df = pd.DataFrame(data)
    
    st.dataframe(
        df,
        use_container_width=True,
        column_config={
            "C_Vol": st.column_config.NumberColumn("Vol CALL", format="%d"),
            "C_Last": st.column_config.NumberColumn("Last CALL", format="R$ %.2f"),
            "Strike": st.column_config.NumberColumn("Strike", format="R$ %.2f"),
            "IV": st.column_config.NumberColumn("IV %", format="%.1f%%"),
            "P_Last": st.column_config.NumberColumn("Last PUT", format="R$ %.2f"),
            "P_Vol": st.column_config.NumberColumn("Vol PUT", format="%d"),
        },
        hide_index=True
    )
    st.markdown('</div>', unsafe_allow_html=True)

# --- MAIN EXECUTION ---
def main():
    render_navbar()
    render_hero()
    
    # Main content container
    with st.container():
        st.markdown('<div style="max-width: 1200px; margin: 0 auto; padding: 0 40px;">', unsafe_allow_html=True)
        render_dashboard()
        render_calculator()
        render_payoff()
        render_volatility()
        render_option_chain()
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
    <div style="padding: 60px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #94a3b8; font-size: 14px; margin-top: 100px;">
        <div style="font-weight: bold; margin-bottom: 15px;" class="text-gradient">OpçõesExpert Analytics</div>
        © 2026 Plataforma de Análise de Derivativos. Todos os direitos reservados.
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
