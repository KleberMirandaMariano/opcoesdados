
import os
import json
import google.generativeai as genai
from typing import Dict, List, Optional

# In Streamlit, we can use secrets or environment variables
# For this project, we'll try to get the API key from environment
api_key = os.environ.get("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)

def get_market_insights(stock_ticker: str, stock_name: str, current_price: float, change_percent: float, options: List[Dict]) -> Dict:
    """
    Generates market insights using Gemini AI.
    """
    if not api_key:
        return {
            "summary": "Chave API não configurada. Configure a variável GEMINI_API_KEY.",
            "sentiment": "neutral",
            "recommendation": "Configure a IA para obter análises."
        }

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        options_text = "\n".join([
            f"- {o['type']} Strike R$ {o['strike']:.2f} | Preço: R$ {o['price']:.2f}" 
            for o in options[:10]
        ])
        
        prompt = f"""
        Analise os seguintes dados do mercado de opções para a ação {stock_ticker} ({stock_name}).
        Preço atual: R$ {current_price:.2f} ({change_percent:.2f}%).
        
        Opções disponíveis para análise:
        {options_text}
        
        Explique o cenário atual de volatilidade e liquidez. Forneça um resumo do sentimento e uma recomendação operacional.
        Retorne APENAS um JSON no formato:
        {{
            "summary": "texto do resumo",
            "sentiment": "bullish" | "bearish" | "neutral",
            "recommendation": "texto da recomendação"
        }}
        """
        
        response = model.generate_content(prompt)
        # Attempt to parse JSON from response
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {
            "summary": "Análise indisponível temporariamente.",
            "sentiment": "neutral",
            "recommendation": "Aguarde a atualização dos dados."
        }
