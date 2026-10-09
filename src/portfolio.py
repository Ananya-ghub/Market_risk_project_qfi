
from pathlib import Path

import numpy as np
import pandas as pd


def main():
    print("\nStarting Phase 3: Portfolio Construction...")

    root = Path(__file__).resolve().parent.parent
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)

    returns_file = processed_dir / "daily_returns.csv"

    if not returns_file.exists():
        raise FileNotFoundError(
            f"Missing {returns_file}. Complete Phase 2 first."
        )

    returns = pd.read_csv(returns_file, index_col=0, parse_dates=True)
    returns = returns.sort_index()
    returns = returns.replace([np.inf, -np.inf], np.nan).dropna(how="any")

    if returns.empty or returns.shape[1] == 0:
        raise ValueError("No valid returns available for portfolio construction.")

    # Equal weight for every stock.
    n_stocks = returns.shape[1]
    weights = pd.Series(
        1.0 / n_stocks,
        index=returns.columns,
        name="weight"
    )

    # Daily portfolio returns.
    portfolio_returns = returns.dot(weights)
    portfolio_returns.name = "portfolio_return"

    # Initial portfolio investment.
    initial_investment = 100_000.0
    portfolio_value = initial_investment * (1 + portfolio_returns).cumprod()
    portfolio_value.name = "portfolio_value"

    # Daily profit and loss in dollars.
    portfolio_pnl = portfolio_value.diff()
    portfolio_pnl.iloc[0] = (
        initial_investment * portfolio_returns.iloc[0]
    )
    portfolio_pnl.name = "daily_pnl"

    portfolio_returns.to_frame().to_csv(
        processed_dir / "portfolio_returns.csv"
    )
    portfolio_value.to_frame().to_csv(
        processed_dir / "portfolio_value.csv"
    )
    portfolio_pnl.to_frame().to_csv(
        processed_dir / "portfolio_pnl.csv"
    )
    weights.to_frame().to_csv(
        processed_dir / "portfolio_weights.csv"
    )

    print(f"Stocks in portfolio: {n_stocks}")
    print(f"Weight per stock: {weights.iloc[0]:.4%}")
    print(f"Initial investment: ${initial_investment:,.2f}")
    print(f"Final portfolio value: ${portfolio_value.iloc[-1]:,.2f}")
    print("Saved portfolio_returns.csv")
    print("Saved portfolio_value.csv")
    print("Saved portfolio_pnl.csv")
    print("Saved portfolio_weights.csv")
    print("Phase 3 Completed Successfully!")


if __name__ == "__main__":
    main()
