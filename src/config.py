"""
Project Configuration
"""

from datetime import datetime

# -----------------------------
# Date Range
# -----------------------------
START_DATE = "2010-01-01"
END_DATE = datetime.today().strftime("%Y-%m-%d")

# -----------------------------
# Market Data
# -----------------------------
BENCHMARK = "SPY"
RISK_FREE = "^IRX"

# -----------------------------
# Portfolio
# -----------------------------
INITIAL_INVESTMENT = 100000
RISK_FREE_RATE = 0.04

# -----------------------------
# File Paths
# -----------------------------
RAW_DATA = "data/raw"
PROCESSED_DATA = "data/processed"
OUTPUTS = "outputs"

# -----------------------------
# Stock Universe
# -----------------------------
STOCKS = [
    "AAPL","MSFT","NVDA","AMZN","GOOGL",
    "META","TSLA","JPM","XOM","UNH",
    "V","MA","JNJ","PG","HD",
    "BAC","ABBV","KO","PEP","MRK",
    "CVX","ADBE","CSCO","CRM","NFLX",
    "AMD","MCD","WMT","INTC","QCOM",
    "ACN","TXN","ABT","LIN","NKE",
    "DHR","ORCL","UPS","PM","IBM",
    "HON","AMGN","LOW","CAT","RTX",
    "GS","BLK","MS","GE","T"
]