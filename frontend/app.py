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
from ai_service import get_market_insights

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
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 24px;
        transition: transform 0.3s ease, border-color 0.3s ease;
    }
    
    .glass-card:hover {
        border-color: rgba(45, 212, 191, 0.3);
    }

    .text-gradient {
        background: linear-gradient(to right, #2dd4bf, #22d3ee);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: bold;
    }

    .btn-primary {
        background: linear-gradient(to right, #2dd4bf, #06b6d4);
        color: #030712 !important;
        padding: 12px 24px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
        display: inline-block;
        border: none;
        text-align: center;
        transition: all 0.2s ease;
    }
    
    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(45, 212, 191, 0.2);
    }

    .btn-outline {
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white !important;
        padding: 12px 24px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        display: inline-block;
        text-align: center;
        transition: all 0.2s ease;
    }
    
    .btn-outline:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: white;
    }

    /* AI Insight Card */
    .ai-insight-card {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
        border: 1px solid rgba(168, 85, 247, 0.2);
        border-radius: 24px;
        padding: 30px;
        margin-top: 20px;
        position: relative;
        overflow: hidden;
    }
    
    .ai-insight-card::before {
        content: '✨';
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        opacity: 0.5;
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

@st.cache_data(ttl=3600)
def fetch_options(symbol):
    try:
        response = requests.get(f"{API_URL}/market/options/{symbol}")
        if response.status_code == 200:
            return response.json()
        return []
    except:
        return []

def simulate_greeks(opt_type, strike, spot):
    """Simulates Greeks for display purposes, similar to the React app."""
    iv = 0.32 + (strike/spot - 1)**2 
    delta = 0.5 if abs(strike - spot) < 0.5 else (0.7 if (opt_type == "CALL" and strike < spot) or (opt_type == "PUT" and strike > spot) else 0.3)
    if opt_type == "PUT": delta = -delta
    
    return {
        "delta": delta,
        "gamma": 0.05 + np.random.uniform(0, 0.05),
        "theta": -0.02 - np.random.uniform(0, 0.05),
        "vega": 0.1 + np.random.uniform(0, 0.05),
        "iv": iv
    }

# --- 1. NAVBAR ---
def render_navbar():
    st.markdown(f"""
    <div style="position: fixed; top: 0; left: 0; right: 0; height: 64px; background: rgba(3, 7, 18, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 1000; padding: 0 40px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #2dd4bf, #06b6d4); display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 20px; font-weight: bold; color: #030712;">📈</span>
            </div>
            <div>
                <span style="font-weight: 800; font-size: 20px; letter-spacing: -0.5px;" class="text-gradient">OpçõesExpert</span>
                <span style="display: block; font-size: 10px; color: #94a3b8; margin-top: -4px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Premium Analytics</span>
            </div>
        </div>
        <div style="display: flex; gap: 24px;">
            <a href="#dashboard" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600;">Dashboard</a>
            <a href="#calculator" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600;">Calculadora</a>
            <a href="#ai-insights" style="color: #2dd4bf; text-decoration: none; font-size: 14px; font-weight: 600;">Gemini AI</a>
            <a href="#chain" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600;">Opções B3</a>
        </div>
    </div>
    <div style="height: 64px;"></div>
    """, unsafe_allow_html=True)

# --- 2. HERO ---
def render_hero():
    st.markdown("""
    <div style="text-align: center; padding: 100px 20px; position: relative; background: radial-gradient(circle at center, rgba(45, 212, 191, 0.05) 0%, transparent 70%);">
        <div style="background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.2); color: #2dd4bf; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px;">
            <span class="pulse-dot"></span>
            Plataforma Profissional Integrada com Gemini AI
        </div>
        <h1 style="font-size: 4.5rem; font-weight: 800; line-height: 1.0; margin-bottom: 24px; letter-spacing: -2px;">
            <span style="color: white;">Analise o Mercado com</span><br>
            <span class="text-gradient">Inteligência Artificial</span>
        </h1>
        <p style="color: #94a3b8; font-size: 1.25rem; max-width: 750px; margin: 0 auto 48px; line-height: 1.6;">
            A cotação em tempo real da B3 agora conta com o poder do Gemini 1.5 Flash. 
            Análises quantitativas e insights qualitativos em uma única interface premium.
        </p>
        <div style="display: flex; justify-content: center; gap: 20px;">
            <a href="#chain" class="btn-primary">Explorar Opções B3</a>
            <a href="#ai-insights" class="btn-outline">Ver Insights de IA</a>
        </div>
    </div>
    """, unsafe_allow_html=True)

# --- 3. DASHBOARD ---
def render_dashboard():
    st.markdown('<div id="dashboard" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    
    col_h1, col_h2 = st.columns([2, 1])
    with col_h1:
        st.markdown('<h2 style="font-weight: 800; margin-bottom: 5px; font-size: 2rem;">Dashboard de Mercado</h2>', unsafe_allow_html=True)
        st.markdown('<p style="color: #94a3b8; margin-bottom: 30px;">Acompanhe os ativos e indicadores em tempo real</p>', unsafe_allow_html=True)
    with col_h2:
        st.markdown(f'<div style="text-align: right; color: #94a3b8; font-size: 14px; margin-top: 10px;">🕒 {datetime.now().strftime("%H:%M:%S - %d/%m/%Y")}</div>', unsafe_allow_html=True)

    indicators = fetch_indicators()
    cols = st.columns(len(indicators) if indicators else 3)
    for i, ind in enumerate(indicators):
        with cols[i]:
            val = ind['value']
            label = ind['label']
            fmt_val = f"{val:,.0f}" if label == 'IBOV' else (f"{val:,.4f}" if label == 'DÓLAR' else f"{val:,.2f}")
            st.markdown(f"""
            <div class="glass-card" style="box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">{label}</span>
                    <span style="color: #2dd4bf;">●</span>
                </div>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                    {fmt_val}
                </div>
                <div style="font-size: 14px; font-weight: 600; color: {'#4ade80' if ind['change'] >= 0 else '#f87171'}; margin-top: 4px;">
                    {'▲' if ind['change'] >= 0 else '▼'} {ind['change_percent']:.2f}%
                </div>
            </div>
            """, unsafe_allow_html=True)

    search_query = st.text_input("Buscar Ticker B3", value="PETR4", placeholder="Ex: PETR4, VALE3, ITUB4").upper()
    
    assets = fetch_assets()
    sel_list = [a for a in assets if a['symbol'] == search_query]
    selected_asset = sel_list[0] if sel_list else (assets[0] if assets else None)

    if selected_asset:
        col_st1, col_st2 = st.columns([1, 1])
        with col_st1:
            st.markdown(f"""
            <div class="glass-card">
                <div style="color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Ativo Selecionado</div>
                <h3 style="font-size: 3rem; font-weight: 800; margin: 0; line-height: 1;">{selected_asset['symbol']}</h3>
                <p style="color: #94a3b8; font-weight: 600;">{selected_asset['name']}</p>
                <div style="margin-top: 24px;">
                    <span style="font-size: 2.5rem; font-weight: 800;">R$ {selected_asset['price']:.2f}</span>
                    <span style="color: #4ade80; font-size: 1.25rem; font-weight: 700; margin-left: 12px;">+{selected_asset['change_percent']:.2f}%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col_st2:
            st.markdown('<div id="ai-insights" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
            # Fetch options for AI context
            asset_options = fetch_options(selected_asset['symbol'])
            
            with st.spinner("Gemini AI analisando mercado..."):
                ai_data = get_market_insights(
                    selected_asset['symbol'], 
                    selected_asset['name'], 
                    selected_asset['price'], 
                    selected_asset['change_percent'],
                    asset_options
                )
            
            sentiment_colors = {"bullish": "#10b981", "bearish": "#f43f5e", "neutral": "#f59e0b"}
            sent_color = sentiment_colors.get(ai_data['sentiment'], "#94a3b8")
            
            st.markdown(f"""
            <div class="ai-insight-card">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                    <div style="background: {sent_color}; width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px {sent_color};"></div>
                    <span style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Gemini Insight • {ai_data['sentiment']} Outlook</span>
                </div>
                <p style="font-size: 1.1rem; line-height: 1.5; font-weight: 500; color: #f1f5f9; font-style: italic;">
                    "{ai_data['summary']}"
                </p>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span style="font-size: 10px; font-weight: 800; color: #a855f7; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">Recomendação</span>
                    <p style="font-weight: 700; color: white; margin: 0;">{ai_data['recommendation']}</p>
                </div>
            </div>
            """, unsafe_allow_html=True)

# --- 4. CALCULATOR ---
def render_calculator():
    st.markdown('<div id="calculator" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.markdown('<h2 style="font-weight: 800; font-size: 2rem; margin-top: 40px;">Calculadora Black-Scholes</h2>', unsafe_allow_html=True)
    
    with st.container():
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        c1, c2 = st.columns([1, 2])
        
        with c1:
            st.subheader("Configuração")
            opt_type = st.selectbox("Tipo de Opção", ["CALL", "PUT"])
            spot = st.number_input("Preço Spot (R$)", value=38.50)
            strike = st.number_input("Preço Strike (R$)", value=39.00)
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
            
            try:
                res = requests.post(f"{API_URL}/calculate/option", json=input_data).json()
            except:
                res = None

        with c2:
            if res:
                col_m1, col_m2, col_m3 = st.columns(3)
                col_m1.metric("Preço Teórico", f"R$ {res['price']:.2f}")
                col_m2.metric("V. Intrínseco", f"R$ {res['intrinsic_value']:.2f}")
                col_m3.metric("V. no Tempo", f"R$ {res['time_value']:.2f}")
                
                st.markdown("<br>", unsafe_allow_html=True)
                fig_greeks = create_greeks_chart(res['greeks'])
                st.plotly_chart(fig_greeks, use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

# --- 5. OPTION CHAIN ---
def render_option_chain(selected_symbol):
    st.markdown('<div id="chain" style="scroll-margin-top: 80px;"></div>', unsafe_allow_html=True)
    st.markdown('<h2 style="font-weight: 800; font-size: 2rem; margin-top: 40px;">Opções B3 - ' + selected_symbol + '</h2>', unsafe_allow_html=True)
    
    options_data = fetch_options(selected_symbol)
    if options_data:
        df = pd.DataFrame(options_data)
        
        # Split into Calls and Puts
        calls = df[df['type'] == 'CALL'].copy()
        puts = df[df['type'] == 'PUT'].copy()
        
        # Merge on strike
        chain = pd.merge(
            calls[['symbol', 'strike', 'price', 'volume']], 
            puts[['symbol', 'strike', 'price', 'volume']], 
            on='strike', 
            how='outer', 
            suffixes=('_C', '_P')
        ).sort_values('strike')
        
        # Add simulated greeks for display
        st.markdown('<div class="glass-card" style="padding: 0; overflow: hidden;">', unsafe_allow_html=True)
        
        # Use st.expander for details or just a clean table
        # Streamlit doesn't support nested expanders well in dataframes, so we use columns
        
        st.dataframe(
            chain,
            column_config={
                "symbol_C": "Ticker CALL",
                "price_C": st.column_config.NumberColumn("Preço CALL", format="R$ %.2f"),
                "volume_C": st.column_config.NumberColumn("Vol CALL"),
                "strike": st.column_config.NumberColumn("Exercício", format="R$ %.2f"),
                "symbol_P": "Ticker PUT",
                "price_P": st.column_config.NumberColumn("Preço PUT", format="R$ %.2f"),
                "volume_P": st.column_config.NumberColumn("Vol PUT"),
            },
            hide_index=True,
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Greeks detail visualization
        st.markdown("### Detalhamento de Gregas (Simulação)")
        col_g1, col_g2 = st.columns(2)
        
        # Show Greeks for 3 specific strikes around spot
        spot_price = chain['strike'].median() # Simple approximation for display
        strikes_to_show = chain.sort_values(by='strike').iloc[len(chain)//2-2 : len(chain)//2+2]
        
        for idx, row in strikes_to_show.iterrows():
            with st.expander(f"Strike R$ {row['strike']:.2f} - Gregas"):
                sg = simulate_greeks("CALL", row['strike'], spot_price)
                cg1, cg2, cg3, cg4, cg5 = st.columns(5)
                cg1.metric("Delta", f"{sg['delta']:.2f}")
                cg2.metric("Gamma", f"{sg['gamma']:.3f}")
                cg3.metric("Theta", f"{sg['theta']:.3f}")
                cg4.metric("Vega", f"{sg['vega']:.3f}")
                cg5.metric("IV (%)", f"{sg['iv']*100:.1f}%")
                
    else:
        st.info(f"Nenhuma opção encontrada para {selected_symbol}")

# --- MAIN EXECUTION ---
def main():
    render_navbar()
    render_hero()
    
    # Dashboard and Search
    with st.container():
        st.markdown('<div style="max-width: 1200px; margin: 0 auto; padding: 0 40px;">', unsafe_allow_html=True)
        
        # Get query symbol from search input rendered inside render_dashboard
        render_dashboard()
        
        # Calculator
        render_calculator()
        
        # Chain
        # We'll use a session state or just the default for now
        assets = fetch_assets()
        selected_symbol = "PETR4" # Default if not found
        # In a real app we'd get this from the state
        
        render_option_chain(selected_symbol)
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Footer
    st.markdown("""
    <div style="padding: 60px 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #94a3b8; font-size: 14px; margin-top: 100px;">
        <div style="font-weight: 800; margin-bottom: 15px;" class="text-gradient">OpçõesExpert Analytics Pro</div>
        © 2026 Plataforma de Análise de Derivativos • Desenvolvido com Gemini AI
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
