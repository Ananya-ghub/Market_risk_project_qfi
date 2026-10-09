
from pathlib import Path

import numpy as np
import pandas as pd



def main():
    print("\nStarting Phase 2: Data Cleaning...")

    root = Path(__file__).resolve().parent.parent
    raw_dir = root / "data" / "raw"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    # Find the stock-price file created by Phase 1.
    candidates = [
        raw_dir / "raw_stock_prices.csv",
        raw_dir / "stock_prices.csv",
        raw_dir / "full_stock_data.csv",
    ]

    price_file = next((p for p in candidates if p.exists()), None)

    if price_file is None:
        raise FileNotFoundError(
            f"No stock-price CSV found in {raw_dir}. "
            "Check the filename saved by Phase 1."
        )

    prices = pd.read_csv(price_file, index_col=0, parse_dates=True)
    prices = prices.sort_index()
    prices = prices[~prices.index.duplicated(keep="last")]

    # Keep numeric price columns and convert invalid values to NaN.
    prices = prices.apply(pd.to_numeric, errors="coerce")
    prices = prices.replace([np.inf, -np.inf], np.nan)

    # Drop dates where no stock has a valid price.
    prices = prices.dropna(how="all")

    # Remove stocks with insufficient price history.
    minimum_observations = max(60, int(len(prices) * 0.50))
    valid_columns = prices.count() >= minimum_observations
    prices = prices.loc[:, valid_columns]

    if prices.empty or prices.shape[1] == 0:
        raise ValueError("No usable stock-price data remains after cleaning.")

    # Forward-fill only short gaps, never fill prices before a stock's
    # first available observation, and never fill with zero.
    prices = prices.ffill(limit=3)

    # Calculate returns. Drop rows where any retained stock has no return.
    daily_returns = prices.pct_change(fill_method=None)
    daily_returns = daily_returns.replace([np.inf, -np.inf], np.nan)

    # Use the same stock universe and dates for a consistent portfolio.
    daily_returns = daily_returns.dropna(how="any")

    # Align prices to the return dates.
    prices = prices.loc[daily_returns.index]

    log_returns = np.log(prices / prices.shift(1))
    log_returns = log_returns.replace([np.inf, -np.inf], np.nan)
    log_returns = log_returns.reindex(daily_returns.index).dropna(how="any")

    # Ensure daily and log returns use identical dates.
    common_dates = daily_returns.index.intersection(log_returns.index)
    daily_returns = daily_returns.loc[common_dates]
    log_returns = log_returns.loc[common_dates]
    prices = prices.loc[common_dates]

    if len(daily_returns) < 60:
        raise ValueError(
            "Fewer than 60 aligned return observations remain. "
            "Check the input data and missing-value pattern."
        )

    prices.to_csv(processed_dir / "clean_prices.csv")
    daily_returns.to_csv(processed_dir / "daily_returns.csv")
    log_returns.to_csv(processed_dir / "log_returns.csv")

    print(f"Input file: {price_file.name}")
    print(f"Stocks retained: {prices.shape[1]}")
    print(f"Aligned return observations: {len(daily_returns)}")
    print("Saved clean_prices.csv")
    print("Saved daily_returns.csv")
    print("Saved log_returns.csv")
    print("Phase 2 Completed Successfully!")


if __name__ == "__main__":
    main()
