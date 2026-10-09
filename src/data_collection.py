"""
Phase 1 - Data Collection
"""

import yfinance as yf
import pandas as pd
import matplotlib.pyplot as plt

from src.config import (
    STOCKS,
    START_DATE,
    END_DATE,
    BENCHMARK,
    RAW_DATA
)

from src.utils import create_directories


# ==========================================
# Download Stock Data
# ==========================================

def download_stock_data():

    print("Downloading stock data...")

    stock_data = yf.download(
        tickers=STOCKS,
        start=START_DATE,
        end=END_DATE,
        auto_adjust=True,
        progress=True
    )

    print("Download Complete!")

    return stock_data


# ==========================================
# Download Benchmark
# ==========================================

def download_benchmark():

    benchmark = yf.download(
        BENCHMARK,
        start=START_DATE,
        end=END_DATE,
        auto_adjust=True,
        progress=False
    )

    return benchmark


# ==========================================
# Save Data
# ==========================================

def save_data(stock_data, benchmark):

    close_prices = stock_data["Close"]

    close_prices.to_csv(
        f"{RAW_DATA}/raw_stock_prices.csv"
    )

    stock_data.to_csv(
        f"{RAW_DATA}/full_stock_data.csv"
    )

    benchmark.to_csv(
        f"{RAW_DATA}/benchmark.csv"
    )

    print("Data Saved Successfully!")

    return close_prices


# ==========================================
# Plot Sample Stocks
# ==========================================

def plot_prices(close_prices):

    sample = [
        "AAPL",
        "MSFT",
        "NVDA",
        "AMZN",
        "GOOGL"
    ]

    plt.figure(figsize=(15,7))

    for stock in sample:
        plt.plot(
            close_prices.index,
            close_prices[stock],
            label=stock
        )

    plt.title("Historical Stock Prices")

    plt.xlabel("Date")

    plt.ylabel("Adjusted Close")

    plt.legend()

    plt.grid(True)

    plt.show()


# ==========================================
# Main
# ==========================================

def main():

    create_directories()

    stock_data = download_stock_data()

    benchmark = download_benchmark()

    close_prices = save_data(
        stock_data,
        benchmark
    )

    plot_prices(close_prices)

    print("\nPhase 1 Completed Successfully!")


if __name__ == "__main__":
    main()