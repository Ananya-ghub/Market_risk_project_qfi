
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from arch import arch_model


WINDOW = 750
CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]


def main():
    print("\nStarting Phase 6: GARCH(1,1) Volatility Scaling...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase6"
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
        raise ValueError("Insufficient observations for GARCH scaling.")

    # Scale returns to percentage units for numerical stability.
    scaled_returns = returns * 100

    model = arch_model(
        scaled_returns,
        mean="Constant",
        vol="GARCH",
        p=1,
        q=1,
        dist="t",
        rescale=False
    )

    fitted = model.fit(disp="off")

    # Conditional volatility is in percentage units.
    conditional_vol = fitted.conditional_volatility / 100

    # Standardized returns for historical volatility scaling.
    standardized_returns = (
        scaled_returns - fitted.params["mu"]
    ) / fitted.conditional_volatility

    standardized_returns = pd.Series(
        standardized_returns,
        index=returns.index,
        name="standardized_return"
    )

    # Produce the one-step-ahead forecast after each observed day.
    forecasts = fitted.forecast(
        horizon=1,
        start=0,
        reindex=True
    )

    forecast_vol = (
        np.sqrt(forecasts.variance.iloc[:, 0]) / 100
    )

    # Align forecast at date t with the next day's risk estimate.
    forecast_vol = forecast_vol.shift(1)
    forecast_vol.name = "garch_forecast_volatility"

    result = pd.DataFrame({
        "portfolio_return": returns,
        "conditional_volatility": conditional_vol,
        "forecast_volatility": forecast_vol,
        "standardized_return": standardized_returns
    })

    # Scale the previous 750 standardized returns to current
    # forecast volatility to estimate VaR and ES.
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
        result[f"garch_var_{suffix}"] = var_values
        result[f"garch_es_{suffix}"] = es_values

    result.to_csv(output_dir / "garch_results.csv")

    result[[
        "conditional_volatility",
        "forecast_volatility"
    ]].to_csv(output_dir / "garch_volatility.csv")

    # Save fitted model parameters.
    pd.DataFrame({
        "parameter": fitted.params.index,
        "estimate": fitted.params.values
    }).to_csv(output_dir / "garch_parameters.csv", index=False)

    # Volatility plot.
    plt.figure(figsize=(12, 5))
    plt.plot(
        result.index,
        result["conditional_volatility"],
        label="Conditional volatility"
    )
    plt.plot(
        result.index,
        result["forecast_volatility"],
        label="One-step-ahead forecast",
        alpha=0.8
    )
    plt.title("GARCH(1,1) Volatility")
    plt.xlabel("Date")
    plt.ylabel("Daily volatility")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "garch_volatility.png", dpi=150)
    plt.close()

    # Standardized residuals.
    plt.figure(figsize=(12, 5))
    plt.plot(
        result.index,
        result["standardized_return"],
        linewidth=0.7
    )
    plt.axhline(0, linestyle="--")
    plt.title("GARCH Standardized Returns")
    plt.xlabel("Date")
    plt.ylabel("Standardized return")
    plt.tight_layout()
    plt.savefig(output_dir / "garch_standardized_returns.png", dpi=150)
    plt.close()

    # VaR estimates and preliminary exceptions.
    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))
        var_col = f"garch_var_{suffix}"

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

    print("\nFitted GARCH parameters:")
    print(fitted.params)
    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 6 Completed Successfully!")


if __name__ == "__main__":
    main()
