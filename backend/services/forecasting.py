import random
import math
from typing import List, Dict

def forecast_return_volume(historical_days: int = 30) -> Dict:
    """
    Lightweight return-volume forecasting using a simple Moving Average 
    and simulated seasonal trend.
    """
    # Generate mock historical data (base 30 returns + noise)
    history = []
    base_volume = 30.0
    for i in range(historical_days):
        # Add weekly seasonality (peak on Mondays)
        seasonality = 10 if i % 7 == 0 else 0
        noise = random.uniform(-5, 5)
        history.append(max(0, int(base_volume + seasonality + noise)))
        
    # Moving Average (last 7 days)
    ma_7 = sum(history[-7:]) / 7.0
    
    # Exponential Smoothing
    alpha = 0.3
    es = history[0]
    for val in history[1:]:
        es = alpha * val + (1 - alpha) * es
        
    forecast_next_day = math.ceil((ma_7 + es) / 2.0)
    
    return {
        "historical_data": history,
        "ma_7": round(ma_7, 1),
        "exponential_smoothing": round(es, 1),
        "forecast_next_day": forecast_next_day,
        "confidence_interval": [max(0, forecast_next_day - 5), forecast_next_day + 5]
    }
