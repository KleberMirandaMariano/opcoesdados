import datetime
import b3cotahist
import pandas as pd
from typing import List, Dict, Optional
import os
import subprocess
import io

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

    def fetch_with_rb3(self, symbol: str) -> List[Dict]:
        """Calls the R script to fetch data using RB3 package."""
        r_script = os.path.join(os.path.dirname(__file__), "..", "scripts", "rb3_options_fetcher.R")
        
        # Try different Rscript executable locations
        executables = ["Rscript", 
                       r"C:\Program Files\R\R-4.3.2\bin\x64\Rscript.exe",
                       r"C:\Program Files\R\R-4.3.1\bin\x64\Rscript.exe"]
        
        stdout = None
        for exe in executables:
            try:
                result = subprocess.run([exe, r_script, symbol], capture_output=True, text=True, check=True)
                stdout = result.stdout
                break
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        if not stdout:
            print("RB3 fetch failed or R not found.")
            return []
            
        try:
            # Parse the CSV output from R
            df = pd.read_csv(io.StringIO(stdout))
            results = []
            for _, row in df.iterrows():
                results.append({
                    "symbol": row['symbol'],
                    "strike": row['strike'],
                    "price": row['price_close'],
                    "type": row['type'],
                    "maturity_date": str(row['maturity_date']),
                    "volume": row['volume']
                })
            return results
        except Exception as e:
            print(f"Error parsing RB3 output: {e}")
            return []

    def get_options_for_symbol(self, symbol: str) -> List[Dict]:
        # Prefer RB3 for more updated/complete data as requested by user
        print(f"Attempting to fetch {symbol} options via RB3...")
        rb3_data = self.fetch_with_rb3(symbol)
        if rb3_data:
            return rb3_data
            
        # Fallback to COTAHIST if RB3 fails
        print("Falling back to COTAHIST...")
        df = self.fetch_data()
        if df is None:
            return []
        
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
        pass

fetcher = B3DataFetcher()
