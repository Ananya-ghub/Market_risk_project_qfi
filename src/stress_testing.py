
from pathlib import Path

import numpy as np
import pandas as pd


INITIAL_INVESTMENT = 100_000.0
CONFIDENCE_LEVEL = 0.99


def main():
    print("\nStarting Phase 10: Stress Testing...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase10"
    output_dir.mkdir(parents=True, exist_ok=True)

    returns = pd.read_csv(
        data_dir / "daily_returns.csv",
        index_col=0,
        parse_dates=True
    )

    returns = returns.replace(
        [np.inf, -np.inf], np.nan
    ).dropna(how="any")

    weights_file = data_dir / "portfolio_weights.csv"
    weights_df = pd.read_csv(weights_file, index_col=0)

    weights = weights_df.iloc[:, 0]
    common_stocks = returns.columns.intersection(weights.index)
    returns = returns[common_stocks]
    weights = weights.loc[common_stocks]

    # Normalize weights to ensure they sum to one.
    weights = weights / weights.sum()

    portfolio_returns = returns.dot(weights)

    # Estimate historical volatility and covariance.
    daily_vol = portfolio_returns.std()
    covariance = returns.cov()
    portfolio_variance = float(
        weights.to_numpy()
        @ covariance.to_numpy()
        @ weights.to_numpy()
    )
    portfolio_vol = np.sqrt(max(portfolio_variance, 0.0))

    if portfolio_vol <= 0:
        raise ValueError("Portfolio volatility must be positive.")

    # Historical 99% VaR and ES in return units.
    cutoff = portfolio_returns.quantile(1 - CONFIDENCE_LEVEL)
    historical_var = max(0.0, -cutoff)
    tail = portfolio_returns[portfolio_returns <= cutoff]
    historical_es = max(0.0, -tail.mean())

    # Historical volatility-adjusted shock scenarios.
    scenarios = [
        {
            "scenario": "Market down 5%",
            "portfolio_return_shock": -0.05,
            "description": "Broad market decline",
        },
        {
            "scenario": "Market down 10%",
            "portfolio_return_shock": -0.10,
            "description": "Severe market decline",
        },
        {
            "scenario": "Market down 20%",
            "portfolio_return_shock": -0.20,
            "description": "Extreme market crash",
        },
        {
            "scenario": "Volatility doubles",
            "portfolio_return_shock": -2 * historical_var,
            "description": "Illustrative loss at twice historical 99% VaR",
        },
        {
            "scenario": "Crash + volatility shock",
            "portfolio_return_shock": -0.20 - historical_var,
            "description": "20% market shock plus historical 99% VaR",
        },
    ]

    # Sector shocks: illustrative shocks applied to stocks in each
    # sector, assuming equal allocation across all stocks in a sector.
    # Replace the sector mapping with verified ticker classifications
    # before interpreting this as a realistic sector-level stress test.
    sector_groups = {
        "Technology": [
            "AAPL", "MSFT", "NVDA", "AVGO", "ORCL",
            "CRM", "CSCO", "ADBE", "AMD", "QCOM",
            "TXN", "INTC", "IBM", "ACN", "NOW",
            "META", "GOOGL", "AMZN"
        ],
        "Financials": [
            "JPM", "BAC", "WFC", "GS", "MS",
            "C", "BLK", "AXP"
        ],
        "Healthcare": [
            "JNJ", "PFE", "MRK", "ABBV",
            "UNH", "LLY", "ABT", "TMO"
        ],
    }

    sector_shocks = {
        "Technology sector down 15%": ("Technology", -0.15),
        "Financials sector down 15%": ("Financials", -0.15),
        "Healthcare sector down 15%": ("Healthcare", -0.15),
    }

    results = []

    for scenario in scenarios:
        shock = scenario["portfolio_return_shock"]
        loss = max(0.0, -shock * INITIAL_INVESTMENT)

        results.append({
            "scenario": scenario["scenario"],
            "type": "Hypothetical",
            "portfolio_return_shock": shock,
            "stressed_loss_dollars": loss,
            "stressed_portfolio_value": INITIAL_INVESTMENT - loss,
            "description": scenario["description"],
        })

    # Apply sector shocks only to verified tickers that exist
    # in the current portfolio.
    for name, (sector, shock) in sector_shocks.items():
        tickers = [
            ticker for ticker in sector_groups[sector]
            if ticker in weights.index
        ]

        sector_weight = float(weights.loc[tickers].sum()) if tickers else 0.0
        portfolio_shock = sector_weight * shock
        loss = max(0.0, -portfolio_shock * INITIAL_INVESTMENT)

        results.append({
            "scenario": name,
            "type": "Sector shock",
            "portfolio_return_shock": portfolio_shock,
            "stressed_loss_dollars": loss,
            "stressed_portfolio_value": INITIAL_INVESTMENT - loss,
            "description": (
                f"{sector} shock of {shock:.0%}; "
                f"affected portfolio weight = {sector_weight:.2%}"
            ),
        })

    stress_df = pd.DataFrame(results)
    stress_df["loss_as_pct_initial"] = (
        stress_df["stressed_loss_dollars"] / INITIAL_INVESTMENT
    )
    stress_df = stress_df.sort_values(
        "stressed_loss_dollars", ascending=False
    )
    stress_df["loss_rank"] = np.arange(1, len(stress_df) + 1)

    stress_df.to_csv(
        output_dir / "stress_test_results.csv",
        index=False
    )

    # Save baseline risk measures separately.
    baseline = pd.DataFrame([{
        "initial_investment": INITIAL_INVESTMENT,
        "daily_volatility": daily_vol,
        "covariance_portfolio_volatility": portfolio_vol,
        "historical_var_99": historical_var,
        "historical_es_99": historical_es,
        "historical_var_99_dollars": historical_var * INITIAL_INVESTMENT,
        "historical_es_99_dollars": historical_es * INITIAL_INVESTMENT,
    }])

    baseline.to_csv(output_dir / "baseline_risk.csv", index=False)

    # Plot stressed losses.
    import matplotlib.pyplot as plt

    plt.figure(figsize=(12, 6))
    plt.bar(
        stress_df["scenario"],
        stress_df["stressed_loss_dollars"]
    )
    plt.title("Portfolio Stress Test: Estimated Losses")
    plt.xlabel("Scenario")
    plt.ylabel("Estimated loss ($)")
    plt.xticks(rotation=35, ha="right")
    plt.tight_layout()
    plt.savefig(
        output_dir / "stress_test_losses.png",
        dpi=150
    )
    plt.close()

    print("\nBaseline risk:")
    print(baseline.to_string(index=False))

    print("\nStress test results:")
    print(stress_df.to_string(index=False))

    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 10 Completed Successfully!")


if __name__ == "__main__":
    main()
