
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]
WINDOWS = [250, 500, 750]


def calculate_var_es(returns, confidence):
    """Return positive loss estimates for VaR and Expected Shortfall."""
    returns = pd.Series(returns).dropna()

    if returns.empty:
        return np.nan, np.nan

    cutoff = returns.quantile(1 - confidence)
    var = -cutoff
    es = -returns[returns <= cutoff].mean()

    return max(0.0, var), max(0.0, es)


def main():
    print("\nStarting Phase 4: Historical VaR and Expected Shortfall...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase4"
    output_dir.mkdir(parents=True, exist_ok=True)

    file_path = data_dir / "portfolio_returns.csv"

    if not file_path.exists():
        raise FileNotFoundError(
            f"{file_path} not found. Complete Phase 3 first."
        )

    df = pd.read_csv(file_path, index_col=0, parse_dates=True)
    returns = df.iloc[:, 0].astype(float).dropna()
    returns = returns.replace([np.inf, -np.inf], np.nan).dropna()
    returns = returns.sort_index()

    if len(returns) < max(WINDOWS):
        raise ValueError("Insufficient observations for the selected windows.")

    # Full-sample Historical VaR and ES.
    summary = []

    for confidence in CONFIDENCE_LEVELS:
        var, es = calculate_var_es(returns, confidence)

        summary.append({
            "confidence": confidence,
            "VaR_return": var,
            "ES_return": es,
            "VaR_dollars_initial_100k": var * 100_000,
            "ES_dollars_initial_100k": es * 100_000,
            "observations": len(returns),
        })

    summary_df = pd.DataFrame(summary)
    summary_df.to_csv(output_dir / "var_summary.csv", index=False)

    # Rolling VaR and ES using trailing historical windows.
    rolling_results = []

    for window in WINDOWS:
        for confidence in CONFIDENCE_LEVELS:
            rolling_var = returns.shift(1).rolling(window).apply(
                lambda x: -np.quantile(x, 1 - confidence),
                raw=True
            )

            rolling_es = returns.shift(1).rolling(window).apply(
                lambda x: -np.mean(x[x <= np.quantile(x, 1 - confidence)]),
                raw=True
            )

            for date, var, es in zip(
                returns.index, rolling_var, rolling_es
            ):
                rolling_results.append({
                    "date": date,
                    "window": window,
                    "confidence": confidence,
                    "VaR_return": var,
                    "ES_return": es,
                })

    rolling_df = pd.DataFrame(rolling_results)
    rolling_df.to_csv(output_dir / "rolling_var.csv", index=False)

    # Return distribution and VaR cutoffs.
    plt.figure(figsize=(10, 6))
    plt.hist(returns, bins=70, density=True, alpha=0.75)

    for confidence in CONFIDENCE_LEVELS:
        cutoff = returns.quantile(1 - confidence)
        plt.axvline(
            cutoff,
            linestyle="--",
            label=f"{confidence:.1%} VaR cutoff"
        )

    plt.title("Portfolio Return Distribution and Historical VaR")
    plt.xlabel("Daily portfolio return")
    plt.ylabel("Density")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "return_distribution_var.png", dpi=150)
    plt.close()

    # Portfolio return history.
    plt.figure(figsize=(12, 5))
    returns.plot()
    plt.title("Daily Portfolio Returns")
    plt.xlabel("Date")
    plt.ylabel("Daily return")
    plt.tight_layout()
    plt.savefig(output_dir / "portfolio_returns.png", dpi=150)
    plt.close()

    # Rolling VaR comparison for each window.
    for confidence in CONFIDENCE_LEVELS:
        subset = rolling_df[rolling_df["confidence"] == confidence]

        plt.figure(figsize=(12, 5))

        for window in WINDOWS:
            data = subset[subset["window"] == window]
            plt.plot(
                data["date"],
                data["VaR_return"],
                label=f"{window}-day window"
            )

        plt.title(f"Rolling Historical VaR ({confidence:.1%} confidence)")
        plt.xlabel("Date")
        plt.ylabel("VaR as a fraction of portfolio value")
        plt.legend()
        plt.tight_layout()
        plt.savefig(
            output_dir / f"rolling_var_{int(confidence * 1000)}.png",
            dpi=150
        )
        plt.close()

    print("\nHistorical VaR Summary:")
    print(summary_df.to_string(index=False))
    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 4 Completed Successfully!")


if __name__ == "__main__":
    main()
