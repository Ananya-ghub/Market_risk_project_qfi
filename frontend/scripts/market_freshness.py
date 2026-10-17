import sys
import os
import json
import datetime
from pathlib import Path

# Add project root to sys.path in read-only mode to inspect config STOCKS list if needed
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

def get_market_freshness():
    try:
        import yfinance as yf
        import pandas as pd
    except ImportError as e:
        return {
            "success": False,
            "error": f"Missing dependency: {str(e)}",
            "status": "refresh_unavailable"
        }

    # 1. Inspect existing processed data
    portfolio_val_file = project_root / "data" / "processed" / "portfolio_value.csv"
    clean_prices_file = project_root / "data" / "processed" / "clean_prices.csv"
    raw_prices_file = project_root / "data" / "raw" / "raw_stock_prices.csv"
    latest_output_file = project_root / "outputs" / "phase10" / "stress_test_results.csv"

    local_latest_date = None
    market_data_mtime = None
    analysis_mtime = None

    if portfolio_val_file.exists():
        market_data_mtime = datetime.datetime.fromtimestamp(portfolio_val_file.stat().st_mtime).isoformat()
        try:
            df = pd.read_csv(portfolio_val_file, usecols=[0])
            local_latest_date = str(df.iloc[-1, 0])
        except Exception:
            pass

    if latest_output_file.exists():
        analysis_mtime = datetime.datetime.fromtimestamp(latest_output_file.stat().st_mtime).isoformat()

    # 2. Check Yahoo Finance for SPY (Benchmark proxy for US Equity market calendar)
    try:
        spy = yf.Ticker("SPY")
        hist = spy.history(period="5d")
        if not hist.empty:
            market_latest_date = hist.index[-1].strftime("%Y-%m-%d")
        else:
            market_latest_date = local_latest_date or datetime.date.today().strftime("%Y-%m-%d")
        
        is_up_to_date = (local_latest_date == market_latest_date)
        status = "data_up_to_date" if is_up_to_date else "updates_available"

        return {
            "success": True,
            "local_latest_date": local_latest_date,
            "market_latest_date": market_latest_date,
            "is_up_to_date": is_up_to_date,
            "status": status,
            "market_data_mtime": market_data_mtime,
            "analysis_mtime": analysis_mtime,
            "checked_at": datetime.datetime.now().isoformat(),
            "calendar_note": "US Market calendar active. Weekends and holidays naturally reflect latest trading session."
        }
    except Exception as e:
        # Offline or network issue
        return {
            "success": False,
            "error": str(e),
            "local_latest_date": local_latest_date,
            "market_latest_date": local_latest_date,
            "is_up_to_date": True,
            "status": "refresh_failed",
            "market_data_mtime": market_data_mtime,
            "analysis_mtime": analysis_mtime,
            "checked_at": datetime.datetime.now().isoformat(),
            "calendar_note": "Network check failed. Preserving last verified local data."
        }

if __name__ == "__main__":
    result = get_market_freshness()
    print(json.dumps(result, indent=2))
