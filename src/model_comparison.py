
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]
WINDOW = 750


def main():
    print("\nStarting Phase 9: Model Comparison...")

    root = Path(__file__).resolve().parent.parent
    output_dir = root / "outputs" / "phase9"
    output_dir.mkdir(parents=True, exist_ok=True)

    data_dir = root / "data" / "processed"
    returns = pd.read_csv(
        data_dir / "portfolio_returns.csv",
        index_col=0,
        parse_dates=True
    ).iloc[:, 0].astype(float).dropna().sort_index()

    sources = {
        "Historical": (
            root / "outputs" / "phase4" / "rolling_var.csv",
            "historical",
        ),
        "EWMA": (
            root / "outputs" / "phase5" / "ewma_results.csv",
            "ewma",
        ),
        "GARCH": (
            root / "outputs" / "phase6" / "garch_results.csv",
            "garch",
        ),
        "GJR-GARCH": (
            root / "outputs" / "phase7" / "gjr_garch_results.csv",
            "gjr",
        ),
    }

    comparison_rows = []

    for confidence in CONFIDENCE_LEVELS:
        suffix = str(int(round(confidence * 1000)))

        for model_name, (path, kind) in sources.items():
            if not path.exists():
                print(f"Skipping {model_name}: output file not found.")
                continue

            if kind == "historical":
                frame = pd.read_csv(path, parse_dates=["date"])
                frame = frame[
                    (frame["window"] == WINDOW)
                    & np.isclose(frame["confidence"], confidence)
                ].set_index("date")

                var = frame["VaR_return"].rename("VaR")
                es = frame["ES_return"].rename("ES")
            else:
                frame = pd.read_csv(
                    path, index_col=0, parse_dates=True
                ).sort_index()

                var_col = f"{kind}_var_{suffix}"
                es_col = f"{kind}_es_{suffix}"

                if var_col not in frame.columns:
                    print(f"Skipping {model_name}: {var_col} missing.")
                    continue

                var = frame[var_col].rename("VaR")
                es = frame[es_col].rename("ES")

            # Use the same dates with valid forecasts and returns.
            aligned = pd.concat(
                [returns.rename("return"), var, es],
                axis=1,
                join="inner"
            ).replace([np.inf, -np.inf], np.nan).dropna()

            # Restrict all models to a common post-warm-up sample.
            aligned = aligned.sort_index()
            aligned = aligned.loc[
                aligned.index.isin(returns.index[WINDOW:])
            ]

            if aligned.empty:
                continue

            exceptions = (
                aligned["return"] < -aligned["VaR"]
            )
            losses = -aligned["return"]

            comparison_rows.append({
                "model": model_name,
                "confidence": confidence,
                "observations": len(aligned),
                "exceptions": int(exceptions.sum()),
                "expected_exceptions": (
                    len(aligned) * (1 - confidence)
                ),
                "exception_rate": exceptions.mean(),
                "average_VaR": aligned["VaR"].mean(),
                "average_ES": aligned["ES"].mean(),
                "VaR_std": aligned["VaR"].std(),
                "worst_daily_loss": losses.max(),
            })

    if not comparison_rows:
        raise ValueError(
            "No comparison results generated. Check Phases 4-7 outputs."
        )

    comparison = pd.DataFrame(comparison_rows)
    comparison.to_csv(
        output_dir / "model_comparison.csv", index=False
    )

    print("\nModel Comparison:")
    print(comparison.round(6).to_string(index=False))

    # Exception count comparison.
    for confidence in CONFIDENCE_LEVELS:
        subset = comparison[
            np.isclose(comparison["confidence"], confidence)
        ]

        if subset.empty:
            continue

        plt.figure(figsize=(9, 5))
        plt.bar(subset["model"], subset["exceptions"])
        plt.axhline(
            subset["expected_exceptions"].iloc[0],
            linestyle="--",
            label="Expected exceptions"
        )
        plt.title(f"VaR Exceptions ({confidence:.1%} confidence)")
        plt.xlabel("Model")
        plt.ylabel("Number of exceptions")
        plt.legend()
        plt.tight_layout()
        plt.savefig(
            output_dir /
            f"exceptions_{int(round(confidence * 1000))}.png",
            dpi=150
        )
        plt.close()

    # Average VaR comparison.
    for confidence in CONFIDENCE_LEVELS:
        subset = comparison[
            np.isclose(comparison["confidence"], confidence)
        ]

        if subset.empty:
            continue

        plt.figure(figsize=(9, 5))
        plt.bar(subset["model"], subset["average_VaR"])
        plt.title(f"Average VaR ({confidence:.1%} confidence)")
        plt.xlabel("Model")
        plt.ylabel("Average daily VaR")
        plt.tight_layout()
        plt.savefig(
            output_dir /
            f"average_var_{int(round(confidence * 1000))}.png",
            dpi=150
        )
        plt.close()

    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 9 Completed Successfully!")


if __name__ == "__main__":
    main()
