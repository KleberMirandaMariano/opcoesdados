import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
from typing import List, Dict

def create_payoff_chart(payoff_data: List[Dict], strike: float, spot: float):
    df = pd.DataFrame(payoff_data)
    
    fig = go.Figure()
    
    # Payoff area
    fig.add_trace(go.Scatter(
        x=df['price'], 
        y=df['payoff'],
        mode='lines',
        name='Payoff',
        line=dict(color='#2dd4bf', width=3),
        fill='tozeroy',
        fillcolor='rgba(45, 212, 191, 0.2)'
    ))
    
    # Strike line
    fig.add_vline(x=strike, line_dash="dash", line_color="#2dd4bf", annotation_text="Strike")
    
    # Spot line
    fig.add_vline(x=spot, line_dash="dash", line_color="#22d3ee", annotation_text="Spot")
    
    fig.update_layout(
        xaxis_title='Preço do Ativo',
        yaxis_title='Lucro / Prejuízo',
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        hovermode='x unified',
        font=dict(family="Inter, sans-serif", color="#94a3b8"),
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    return fig

def create_volatility_smile_chart(smile_data: List[Dict], spot: float):
    df = pd.DataFrame(smile_data)
    
    fig = px.line(
        df, x='strike', y='implied_vol',
        labels={'strike': 'Strike', 'implied_vol': 'IV (%)'},
        template='plotly_dark'
    )
    
    fig.add_vline(x=spot, line_dash="dash", line_color="#2dd4bf")
    
    fig.update_traces(line_color='#2dd4bf', line_width=3)
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family="Inter, sans-serif", color="#94a3b8"),
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    return fig

def create_greeks_chart(greeks: Dict):
    labels = list(greeks.keys())
    values = list(greeks.values())
    
    # Capitalize first letter
    labels = [l.capitalize() for l in labels]
    
    fig = px.bar(
        x=labels, y=values,
        labels={'x': 'Grega', 'y': 'Valor'},
        template='plotly_dark',
        color=labels,
        color_discrete_sequence=['#2dd4bf', '#22d3ee', '#14b8a6', '#0891b2', '#06b6d4']
    )
    
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=False,
        font=dict(family="Inter, sans-serif", color="#94a3b8"),
        margin=dict(l=20, r=20, t=20, b=20)
    )
    
    return fig

def create_volatility_surface_3d(surface_data: List[Dict]):
    df = pd.DataFrame(surface_data)
    
    # Pivot for 3D surface
    z_data = df.pivot(index='maturity', columns='strike', values='volatility').values
    x_data = df['strike'].unique()
    y_data = df['maturity'].unique()
    
    fig = go.Figure(data=[go.Surface(z=z_data, x=x_data, y=y_data, colorscale='Viridis')])
    
    fig.update_layout(
        title='Superfície de Volatilidade',
        scene=dict(
            xaxis_title='Strike',
            yaxis_title='Dias para Vencimento',
            zaxis_title='IV (%)'
        ),
        template='plotly_dark',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)'
    )
    
    return fig
