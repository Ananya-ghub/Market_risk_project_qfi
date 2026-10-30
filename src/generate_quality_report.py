import json
from pathlib import Path
import pandas as pd
from datetime import datetime

root = Path(__file__).resolve().parent.parent
raw_prices = pd.read_csv(root / "data/raw/raw_stock_prices.csv", index_col=0, parse_dates=True)
clean_prices = pd.read_csv(root / "data/processed/clean_prices.csv", index_col=0, parse_dates=True)
daily_returns = pd.read_csv(root / "data/processed/daily_returns.csv", index_col=0, parse_dates=True)
portfolio_val = pd.read_csv(root / "data/processed/portfolio_value.csv", index_col=0, parse_dates=True)

from src.config import STOCKS

failed_tickers = list(set(STOCKS) - set(raw_prices.columns))

report = {
    "configured_tickers_count": len(STOCKS),
    "configured_tickers": STOCKS,
    "successfully_downloaded_tickers_count": int(raw_prices.shape[1]),
    "successfully_downloaded_tickers": list(raw_prices.columns),
    "failed_tickers_count": len(failed_tickers),
    "failed_tickers": failed_tickers,
    "retained_tickers_count": int(clean_prices.shape[1]),
    "retained_tickers": list(clean_prices.columns),
    "raw_first_date": raw_prices.index[0].strftime("%Y-%m-%d"),
    "raw_last_date": raw_prices.index[-1].strftime("%Y-%m-%d"),
    "aligned_first_date": daily_returns.index[0].strftime("%Y-%m-%d"),
    "aligned_last_date": daily_returns.index[-1].strftime("%Y-%m-%d"),
    "raw_rows": len(raw_prices),
    "aligned_return_observations": len(daily_returns),
    "duplicate_dates_in_raw": int(raw_prices.index.duplicated().sum()),
    "duplicate_dates_in_cleaned": int(clean_prices.index.duplicated().sum()),
    "total_missing_in_clean_prices": int(clean_prices.isna().sum().sum()),
    "total_missing_in_returns": int(daily_returns.isna().sum().sum()),
    "latest_portfolio_value": float(portfolio_val.iloc[-1, 0]),
    "data_quality_warnings": []
}

if report["failed_tickers_count"] == 0:
    report["status"] = "EXCELLENT"
else:
    report["status"] = "WARNING"
    report["data_quality_warnings"].append(f"Failed to download {report['failed_tickers_count']} tickers")

out_dir = root / "outputs"
out_dir.mkdir(parents=True, exist_ok=True)

with open(out_dir / "data_quality_report.json", "w") as f:
    json.dump(report, f, indent=2)

md_content = f"""# Market Data Quality & Universe Audit Report

- **Report Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Data Quality Status:** {report['status']}
- **Latest Market Observation:** {report['aligned_last_date']}

## Universe Coverage
- **Configured Tickers:** {report['configured_tickers_count']}
- **Successfully Downloaded:** {report['successfully_downloaded_tickers_count']}
- **Failed Downloads:** {report['failed_tickers_count']}
- **Retained After Cleaning:** {report['retained_tickers_count']}

## Temporal Scope
- **Raw Price Period:** {report['raw_first_date']} to {report['raw_last_date']} ({report['raw_rows']} trading days)
- **Strictly Aligned Return Period:** {report['aligned_first_date']} to {report['aligned_last_date']} ({report['aligned_return_observations']} observations)

## Integrity Checks
- **Duplicate Dates in Raw:** {report['duplicate_dates_in_raw']}
- **Duplicate Dates in Cleaned:** {report['duplicate_dates_in_cleaned']}
- **Missing Values in Aligned Returns:** {report['total_missing_in_returns']}
- **Final MTM Portfolio Value:** ${report['latest_portfolio_value']:,.2f}

## Configured Universe ({report['configured_tickers_count']} stocks)
{', '.join(report['configured_tickers'])}
"""

with open(out_dir / "data_quality_report.md", "w") as f:
    f.write(md_content)

print(f"Data quality report saved to outputs/data_quality_report.json and outputs/data_quality_report.md")
print(f"Aligned observations: {report['aligned_return_observations']}, Latest date: {report['aligned_last_date']}")
