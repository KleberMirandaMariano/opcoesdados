from backend.logic import calculate_black_scholes
import numpy as np

def test_black_scholes():
    # Test case: Spot 100, Strike 100, Maturity 1y, Vol 20%, Rate 5%
    # Expected Call Price: ~10.45
    # Expected Put Price: ~5.57
    
    call_res = calculate_black_scholes(100, 100, 1.0, 0.2, 0.05, 'CALL')
    put_res = calculate_black_scholes(100, 100, 1.0, 0.2, 0.05, 'PUT')
    
    print(f"Call Price: {call_res['price']:.4f}")
    print(f"Put Price: {put_res['price']:.4f}")
    print(f"Call Delta: {call_res['greeks']['delta']:.4f}")
    
    assert abs(call_res['price'] - 10.45) < 0.1
    assert abs(put_res['price'] - 5.57) < 0.1
    print("Logic test passed!")

if __name__ == "__main__":
    test_black_scholes()
