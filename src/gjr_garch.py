
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from arch import arch_model


WINDOW = 750
CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]


def main():
    print("\nStarting Phase 7: GJR-GARCH Volatility Scaling...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase7"
    output_dir.mkdir(parents=True, exist_ok=True)

    returns = pd.read_csv(
        data_dir / "portfolio_returns.csv",
        index_col=0,
        parse_dates=True
    ).iloc[:, 0].astype(float)

    returns = returns.replace(
        [np.inf, -np.inf], np.nan
    ).dropna().sort_index()

    if len(returns) <= WINDOW + 100:
        raise ValueError("Insufficient data for GJR-GARCH scaling.")

    # Percentage returns improve numerical stability.
    scaled_returns = returns * 100

    model = arch_model(
        scaled_returns,
        mean="Constant",
        vol="GARCH",
        p=1,
        o=1,  # Asymmetric GJR term
        q=1,
        dist="t",
        rescale=False
    )

    fitted = model.fit(disp="off")

    conditional_vol = fitted.conditional_volatility / 100

    standardized_returns = (
        (scaled_returns - fitted.params["mu"])
        / fitted.conditional_volatility
    )

    standardized_returns = pd.Series(
        standardized_returns,
        index=returns.index,
        name="standardized_return"
    )

    forecasts = fitted.forecast(
        horizon=1,
        start=0,
        reindex=True
    )

    forecast_vol = (
        np.sqrt(forecasts.variance.iloc[:, 0]) / 100
    ).shift(1)

    result = pd.DataFrame({
        "portfolio_return": returns,
        "conditional_volatility": conditional_vol,
        "forecast_volatility": forecast_vol,
        "standardized_return": standardized_returns
    })

    for confidence in CONFIDENCE_LEVELS:
        var_values = np.full(len(result), np.nan)
        es_values = np.full(len(result), np.nan)

        for t in range(WINDOW, len(result)):
            sigma = result["forecast_volatility"].iloc[t]
            history = standardized_returns.iloc[t-WINDOW:t]
            history = history.replace(
                [np.inf, -np.inf], np.nan
            ).dropna()

            if not np.isfinite(sigma) or sigma <= 0:
                continue

            if len(history) < WINDOW:
                continue

            scaled_history = history.to_numpy() * sigma
            cutoff = np.quantile(
                scaled_history, 1 - confidence
            )

            var_values[t] = max(0.0, -cutoff)
            es_values[t] = max(
                0.0,
                -scaled_history[scaled_history <= cutoff].mean()
            )

        suffix = str(int(round(confidence * 1000)))
        result[f"gjr_var_{suffix}"] = var_values
        result[f"gjr_es_{suffix}"] = es_values

    result.to_csv(output_dir / "gjr_garch_results.csv")

    result[[
        "conditional_volatility",
        "forecast_volatility"
    ]].to_csv(output_dir / "gjr_garch_volatility.csv")

    pd.DataFrame({
        "parameter": fitted.params.index,
        "estimate": fitted.params.values
    }).to_csv(output_dir / "gjr_garch_parameters.csv", index=False)

    # Conditional and forecast volatility.
    plt.figure(figsize=(12, 5))
    plt.plot(
        result.index,
        result["conditional_volatility"],
        label="Conditional volatility"
    )
    plt.plot(
        result.index,
        result["forecast_volatility"],
        label="Forecast volatility",
        alpha=0.8
    )
    plt.title("GJR-GARCH Volatility")
    plt.xlabel("Date")
    plt.ylabel("Daily volatility")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "gjr_garch_volatility.png", dpi=150)
    plt.close()

    # Compare conditional volatility with standard GARCH.
    garch_file = root / "outputs" / "phase6" / "garch_results.csv"

    if garch_file.exists():
        garch = pd.read_csv(garch_file, index_col=0, parse_dates=True)

        plt.figure(figsize=(12, 5))
        plt.plot(
            garch.index,
            garch["conditional_volatility"],
            label="GARCH"
        )
        plt.plot(
            result.index,
            result["conditional_volatility"],
            label="GJR-GARCH",
            alpha=0.8
        )
        plt.title("GARCH vs GJR-GARCH Conditional Volatility")
        plt.xlabel("Date")
        plt.ylabel("Daily volatility")
        plt.legend()
        plt.tight_layout()
        plt.savefig(output_dir / "garch_vs_gjr.png", dpi=150)
        plt.close()

    # Report leverage-effect estimate.
    gamma = fitted.params.get("gamma[1]", np.nan)
    print("\nGJR-GARCH parameters:")
    print(fitted.params)
    print(f"\nLeverage parameter gamma: {gamma:.6f}")

    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))
        var_col = f"gjr_var_{suffix}"
        valid_rows = result.dropna(subset=[var_col])

        exceptions = (
            valid_rows["portfolio_return"] < -valid_rows[var_col]
        ).sum()

        total = len(valid_rows)
        expected = total * (1 - confidence)

        print(
            f"{confidence:.1%}: {exceptions} exceptions / "
            f"{total} days (expected approximately {expected:.1f})"
        )

    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 7 Completed Successfully!")


if __name__ == "__main__":
    main()
