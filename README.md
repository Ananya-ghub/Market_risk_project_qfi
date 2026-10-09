# Advanced Equity Portfolio Risk Management

## Overview

This project implements a multi-phase equity portfolio risk management pipeline using historical market data, volatility forecasting, Value at Risk (VaR), Expected Shortfall (ES), backtesting, model comparison, and stress testing.

The project analyzes a portfolio of 50 equities using historical price data obtained through Yahoo Finance.

## Project Objectives

- Collect and clean historical equity price data.
- Construct an equal-weighted equity portfolio.
- Estimate Historical VaR and Expected Shortfall.
- Implement EWMA, GARCH(1,1), and GJR-GARCH volatility models.
- Backtest VaR forecasts using statistical tests.
- Compare risk models using exception rates and risk estimates.
- Evaluate portfolio losses under hypothetical stress scenarios.

## Project Phases

1. Data Collection
2. Data Cleaning
3. Portfolio Construction
4. Historical VaR and Expected Shortfall
5. EWMA Volatility Scaling
6. GARCH Volatility Scaling
7. GJR-GARCH Volatility Scaling
8. VaR Backtesting
9. Model Comparison
10. Stress Testing

## Technologies Used

- Python
- Pandas and NumPy
- Matplotlib
- SciPy
- `yfinance`
- `arch`
- Git and GitHub

## Project Structure

```text
Advanced-Equity-Portfolio-Risk-Management/
├── src/
│   ├── main.py
│   ├── config.py
│   ├── utils.py
│   ├── data_collection.py
│   ├── data_cleaning.py
│   ├── portfolio.py
│   ├── historical_var.py
│   ├── ewma.py
│   ├── garch.py
│   ├── gjr_garch.py
│   ├── backtesting.py
│   ├── model_comparison.py
│   └── stress_testing.py
├── data/
│   ├── raw/
│   └── processed/
├── outputs/
│   ├── phase4/
│   ├── phase5/
│   ├── phase6/
│   ├── phase7/
│   ├── phase8/
│   ├── phase9/
│   └── phase10/
├── requirements.txt
└── README.md
```

## Setup

Install the required dependencies:

```bash
python -m pip install pandas numpy matplotlib seaborn scipy yfinance arch
```

Run the individual phases from the project root:

```bash
python -m src.data_collection
python -m src.data_cleaning
python -m src.portfolio
python -m src.historical_var
python -m src.ewma
python -m src.garch
python -m src.gjr_garch
python -m src.backtesting
python -m src.model_comparison
python -m src.stress_testing
```

## Outputs

The pipeline generates processed datasets, portfolio risk estimates, volatility forecasts, VaR backtesting summaries, model comparison tables, and stress-testing results.

Outputs are stored in the `data/processed/` and `outputs/` directories.

## Methodology Notes

- The portfolio construction implementation uses equal stock weights and a starting reference investment of $100,000.
- Historical VaR and Expected Shortfall are estimated at multiple confidence levels.
- EWMA, GARCH, and GJR-GARCH are used to model changing volatility.
- Backtesting results should be interpreted after verifying forecast alignment and consistent out-of-sample evaluation periods.
- Stress-test scenarios are hypothetical and do not represent guaranteed future losses.

## Disclaimer

This project is for educational and research purposes only. Its outputs are not financial advice or investment recommendations.