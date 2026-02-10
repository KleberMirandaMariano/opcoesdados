import sys
import os
import datetime

# Add project root to sys.path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(project_root)

from backend.data_fetcher import fetcher

def test_fetch_data():
    print("Testing B3 data fetch...")
    # Try current or recent workday
    df = fetcher.fetch_data()
    if df is not None:
        print(f"Successfully fetched {len(df)} option records.")
        print("Sample records:")
        print(df[['CODIGO_DE_NEGOCIACAO', 'PRECO_DE_EXERCICIO', 'PRECO_ULTIMO_NEGOCIO']].head())
    else:
        print("Failed to fetch data.")

def test_get_options_for_symbol():
    symbol = "PETR4"
    print(f"\nTesting options for {symbol}...")
    options = fetcher.get_options_for_symbol(symbol)
    if options:
        print(f"Found {len(options)} options for {symbol}.")
        print(f"First option: {options[0]}")
    else:
        print(f"No options found for {symbol}.")

if __name__ == "__main__":
    test_fetch_data()
    test_get_options_for_symbol()
