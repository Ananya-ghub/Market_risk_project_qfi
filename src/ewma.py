
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


LAMBDA = 0.94
WINDOW = 750
CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]


def main():
    print("\nStarting Phase 5: EWMA Volatility Scaling...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase5"
    output_dir.mkdir(parents=True, exist_ok=True)

    returns = pd.read_csv(
        data_dir / "portfolio_returns.csv",
        index_col=0,
        parse_dates=True
    ).iloc[:, 0]

    returns = returns.astype(float).replace(
        [np.inf, -np.inf], np.nan
    ).dropna().sort_index()

    if len(returns) <= WINDOW + 60:
        raise ValueError("Insufficient data for EWMA estimation.")

    r = returns.to_numpy()
    n = len(r)

    # EWMA volatility forecast for each trading day.
    # sigma[t] is calculated using only returns before day t.
    variance = np.full(n, np.nan)
    warmup = 60

    variance[warmup] = np.var(r[:warmup], ddof=1)

    for t in range(warmup + 1, n):
        variance[t] = (
            LAMBDA * variance[t - 1]
            + (1 - LAMBDA) * r[t - 1] ** 2
        )

    volatility = np.sqrt(variance)

    # Standardize each return using its pre-return forecast.
    standardized = np.full(n, np.nan)
    valid = np.isfinite(volatility) & (volatility > 0)
    standardized[valid] = r[valid] / volatility[valid]

    result = pd.DataFrame({
        "portfolio_return": r,
        "ewma_volatility": volatility,
        "standardized_return": standardized
    }, index=returns.index)

    # Rolling volatility-scaled Historical VaR and ES.
    for confidence in CONFIDENCE_LEVELS:
        var_values = np.full(n, np.nan)
        es_values = np.full(n, np.nan)

        for t in range(warmup + WINDOW, n):
            history = standardized[t - WINDOW:t]
            history = history[np.isfinite(history)]

            if len(history) < WINDOW:
                continue

            # Scale historical standardized returns
            # to today's forecast volatility.
            scaled_history = history * volatility[t]

            cutoff = np.quantile(
                scaled_history, 1 - confidence
            )

            var_values[t] = max(0.0, -cutoff)
            es_values[t] = max(
                0.0,
                -np.mean(scaled_history[scaled_history <= cutoff])
            )

        suffix = str(int(round(confidence * 1000)))
        result[f"ewma_var_{suffix}"] = var_values
        result[f"ewma_es_{suffix}"] = es_values

    # Save daily estimates.
    result.to_csv(output_dir / "ewma_results.csv")

    result[["ewma_volatility"]].to_csv(
        output_dir / "ewma_volatility.csv"
    )

    # Comparison with rolling Historical VaR (same 750-day window).
    historical = pd.read_csv(
        root / "outputs" / "phase4" / "rolling_var.csv",
        parse_dates=["date"]
    )

    comparison = result.copy()
    comparison.index.name = "date"

    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))

        hist = historical[
            (historical["window"] == WINDOW)
            & (
                np.isclose(
                    historical["confidence"],
                    confidence
                )
            )
        ][["date", "VaR_return"]]

        hist = hist.set_index("date")["VaR_return"]
        comparison[f"historical_var_{suffix}"] = hist

    comparison.to_csv(
        output_dir / "ewma_vs_historical.csv"
    )

    # Plot EWMA volatility.
    plt.figure(figsize=(12, 5))
    plt.plot(
        result.index,
        result["ewma_volatility"]
    )
    plt.title("EWMA Conditional Volatility")
    plt.xlabel("Date")
    plt.ylabel("Daily volatility")
    plt.tight_layout()
    plt.savefig(
        output_dir / "ewma_volatility.png",
        dpi=150
    )
    plt.close()

    # Plot raw and volatility-standardized returns.
    fig, axes = plt.subplots(2, 1, figsize=(12, 8))

    axes[0].plot(result.index, result["portfolio_return"])
    axes[0].set_title("Raw Portfolio Returns")

    axes[1].plot(
        result.index,
        result["standardized_return"]
    )
    axes[1].set_title("EWMA Standardized Returns")

    plt.tight_layout()
    plt.savefig(
        output_dir / "raw_vs_standardized_returns.png",
        dpi=150
    )
    plt.close()

    # Compare rolling Historical and EWMA VaR.
    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))

        plt.figure(figsize=(12, 5))

        plt.plot(
            comparison.index,
            comparison[f"historical_var_{suffix}"],
            label="Historical VaR"
        )

        plt.plot(
            comparison.index,
            comparison[f"ewma_var_{suffix}"],
            label="EWMA-scaled VaR"
        )

        plt.title(
            f"Historical vs EWMA VaR ({confidence:.1%})"
        )
        plt.xlabel("Date")
        plt.ylabel("Daily VaR")
        plt.legend()
        plt.tight_layout()
        plt.savefig(
            output_dir / f"var_comparison_{suffix}.png",
            dpi=150
        )
        plt.close()

    # Basic exception comparison.
    print("\nEWMA VaR Exception Summary:")

    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))
        var_col = f"ewma_var_{suffix}"

        valid_rows = result.dropna(
            subset=[var_col, "portfolio_return"]
        )

        exceptions = (
            valid_rows["portfolio_return"]
            < -valid_rows[var_col]
        ).sum()

        total = len(valid_rows)
        expected = total * (1 - confidence)

        print(
            f"{confidence:.1%}: "
            f"{exceptions} exceptions / {total} days "
            f"(expected approximately {expected:.1f})"
        )

    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 5 Completed Successfully!")


if __name__ == "__main__":
    main()
