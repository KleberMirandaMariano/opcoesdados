import datetime
import b3cotahist
import pandas as pd
from typing import List, Dict, Optional
import os

CACHE_DIR = "cache_b3"
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def get_latest_workday():
    """Returns the date of the latest potential workday."""
    dt = datetime.datetime.now()
    # If today is weekend, go back to Friday
    if dt.weekday() == 5: # Saturday
        dt -= datetime.timedelta(days=1)
    elif dt.weekday() == 6: # Sunday
        dt -= datetime.timedelta(days=2)
    
    # Also, B3 data usually becomes available after market close
    # For simplicity, we try yesterday if today's market hasn't closed yet or if it's too early
    if dt.hour < 19:
        dt -= datetime.timedelta(days=1)
        # Check again for weekend
        if dt.weekday() == 5: # Saturday
            dt -= datetime.timedelta(days=1)
        elif dt.weekday() == 6: # Sunday
            dt -= datetime.timedelta(days=2)
            
    return dt.date()

class B3DataFetcher:
    def __init__(self):
        self.cached_date = None
        self.df_options = None

    def fetch_data(self, date: Optional[datetime.date] = None):
        if date is None:
            date = get_latest_workday()
        
        if self.cached_date == date and self.df_options is not None:
            return self.df_options

        print(f"Fetching B3 data for {date}...")
        try:
            # b3cotahist.get returns a pandas DataFrame
            # It might fail if the date is a holiday or not yet available
            df = b3cotahist.get(date)
            
            # Filter for options (OPCOES_DE_COMPRA = 070, OPCOES_DE_VENDA = 080 in mapping)
            # Based on b3cotahist.py:
            # '070': 'OPCOES_DE_COMPRA',
            # '080': 'OPCOES_DE_VENDA',
            
            # Note: b3cotahist already maps 'TIPO_DE_MERCADO' to strings
            self.df_options = df[df['TIPO_DE_MERCADO'].isin(['OPCOES_DE_COMPRA', 'OPCOES_DE_VENDA'])]
            self.cached_date = date
            return self.df_options
        except Exception as e:
            print(f"Error fetching data for {date}: {e}")
            # Try previous day if failed
            if date > datetime.date(2025, 1, 1):
                prev_date = date - datetime.timedelta(days=1)
                return self.fetch_data(prev_date)
            return None

    def get_options_for_symbol(self, symbol: str) -> List[Dict]:
        df = self.fetch_data()
        if df is None:
            return []
        
        # In COTAHIST, the 'NOME_DA_EMPRESA' or 'CODIGO_DE_NEGOCIACAO' can be used
        # Ticker of option usually starts with underlying asset symbol
        # We look for options where the underlying asset symbol is related
        # This is a bit simplified, but works for common stocks like PETR4, VALE3
        
        # Filter options where the ticker starts with the symbol prefix (e.g. PETR for PETR4)
        prefix = symbol[:4] 
        df_filtered = df[df['CODIGO_DE_NEGOCIACAO'].str.startswith(prefix)]
        
        results = []
        for _, row in df_filtered.iterrows():
            results.append({
                "symbol": row['CODIGO_DE_NEGOCIACAO'],
                "strike": row['PRECO_DE_EXERCICIO'],
                "price": row['PRECO_ULTIMO_NEGOCIO'],
                "type": "CALL" if row['TIPO_DE_MERCADO'] == 'OPCOES_DE_COMPRA' else "PUT",
                "maturity_date": row['DATA_DE_VENCIMENTO'].strftime("%Y-%m-%d") if isinstance(row['DATA_DE_VENCIMENTO'], datetime.date) else str(row['DATA_DE_VENCIMENTO']),
                "volume": row['VOLUME_TOTAL_NEGOCIADO']
            })
        return results

    def get_asset_price(self, symbol: str) -> Optional[float]:
        # For stocks (TIPO_DE_MERCADO = 'VISTA')
        if self.cached_date is None:
            self.fetch_data()
        
        # We need to fetch all data or keep the unfiltered df
        # Let's re-fetch just for the asset if needed, or modify fetch_data
        # For now, let's assume we want to keep it simple and just return a mock or use yfinance for underlying
        # The user asked specifically for b3cotahist for real-time options values.
        pass

fetcher = B3DataFetcher()
