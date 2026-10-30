"""
Phase 1 - Data Collection
"""

import sys
from datetime import datetime
from pathlib import Path
import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from src.config import (
    STOCKS,
    START_DATE,
    BENCHMARK,
    RAW_DATA
)

from src.utils import create_directories


def download_stock_data():
    print(f"Downloading historical stock data for {len(STOCKS)} tickers from {START_DATE} to latest...")
    raw_dir = root / RAW_DATA
    raw_dir.mkdir(parents=True, exist_ok=True)

    stock_data = yf.download(
        tickers=STOCKS,
        start=START_DATE,
        auto_adjust=True,
        progress=True
    )

    print("Download Complete!")
    return stock_data


def download_benchmark():
    print(f"Downloading benchmark ({BENCHMARK}) from {START_DATE} to latest...")
    benchmark = yf.download(
        BENCHMARK,
        start=START_DATE,
        auto_adjust=True,
        progress=False
    )
    return benchmark


def save_data(stock_data, benchmark):
    raw_dir = root / RAW_DATA
    raw_dir.mkdir(parents=True, exist_ok=True)

    if isinstance(stock_data.columns, pd.MultiIndex):
        if "Close" in stock_data.columns.levels[0]:
            close_prices = stock_data["Close"]
        else:
            close_prices = stock_data.xs("Close", level=0, axis=1)
    else:
        close_prices = stock_data

    # Save to disk
    close_prices.to_csv(raw_dir / "raw_stock_prices.csv")
    stock_data.to_csv(raw_dir / "full_stock_data.csv")
    benchmark.to_csv(raw_dir / "benchmark.csv")

    print(f"Data Saved Successfully in {raw_dir}!")
    print(f"Raw prices shape: {close_prices.shape}")
    print(f"Date range: {close_prices.index[0].strftime('%Y-%m-%d')} to {close_prices.index[-1].strftime('%Y-%m-%d')}")

    return close_prices


def plot_prices(close_prices):
    sample = [s for s in ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"] if s in close_prices.columns]
    if not sample:
        sample = list(close_prices.columns[:5])

    plt.figure(figsize=(15, 7))
    for stock in sample:
        plt.plot(close_prices.index, close_prices[stock], label=stock)

    plt.title("Historical Stock Prices (Adjusted Close)")
    plt.xlabel("Date")
    plt.ylabel("Adjusted Close ($)")
    plt.legend()
    plt.grid(True, alpha=0.3)

    plots_dir = root / "outputs" / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)
    plot_path = plots_dir / "sample_stock_prices.png"
    plt.savefig(plot_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved sample stock plot to {plot_path}")


def main():
    create_directories()
    stock_data = download_stock_data()
    benchmark = download_benchmark()
    close_prices = save_data(stock_data, benchmark)
    plot_prices(close_prices)
    print("\nPhase 1 Completed Successfully!")
    return close_prices


if __name__ == "__main__":
    main()
