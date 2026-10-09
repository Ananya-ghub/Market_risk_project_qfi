
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2


CONFIDENCE_LEVELS = [0.95, 0.99, 0.995]
WINDOW = 750


def kupiec_test(exceptions, n, confidence):
    """Kupiec proportion-of-failures likelihood-ratio test."""
    x = int(exceptions)
    if n <= 0:
        return np.nan, np.nan

    p = 1 - confidence
    phat = x / n

    def term(count, probability):
        if count == 0:
            return 0.0
        if probability <= 0:
            return -np.inf
        return count * np.log(probability)

    log_null = term(x, p) + term(n - x, 1 - p)
    log_alt = term(x, phat) + term(n - x, 1 - phat)

    if not np.isfinite(log_null):
        return np.nan, np.nan

    lr = max(0.0, -2 * (log_null - log_alt))
    return lr, float(chi2.sf(lr, df=1))


def christoffersen_independence(exceptions):
    """Test whether VaR exceptions are independent over time."""
    e = np.asarray(exceptions, dtype=int)

    if len(e) < 2:
        return np.nan, np.nan

    n00 = np.sum((e[:-1] == 0) & (e[1:] == 0))
    n01 = np.sum((e[:-1] == 0) & (e[1:] == 1))
    n10 = np.sum((e[:-1] == 1) & (e[1:] == 0))
    n11 = np.sum((e[:-1] == 1) & (e[1:] == 1))

    def log_likelihood(successes, failures):
        total = successes + failures
        if total == 0:
            return 0.0
        p = successes / total
        result = 0.0
        if successes:
            if p == 0:
                return -np.inf
            result += successes * np.log(p)
        if failures:
            if p == 1:
                return -np.inf
            result += failures * np.log(1 - p)
        return result

    log_null = log_likelihood(n01 + n11, n00 + n10)
    log_alt = (
        log_likelihood(n01, n00)
        + log_likelihood(n11, n10)
    )

    if not np.isfinite(log_null) or not np.isfinite(log_alt):
        return np.nan, np.nan

    lr = max(0.0, -2 * (log_null - log_alt))
    return lr, float(chi2.sf(lr, df=1))


def main():
    print("\nStarting Phase 8: VaR Backtesting...")

    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data" / "processed"
    output_dir = root / "outputs" / "phase8"
    output_dir.mkdir(parents=True, exist_ok=True)

    returns = pd.read_csv(
        data_dir / "portfolio_returns.csv",
        index_col=0,
        parse_dates=True
    ).iloc[:, 0].astype(float)

    returns = returns.replace(
        [np.inf, -np.inf], np.nan
    ).dropna().sort_index()

    models = {
        "Historical": (
            root / "outputs" / "phase4" / "rolling_var.csv",
            "VaR_return",
            None,
        ),
        "EWMA": (
            root / "outputs" / "phase5" / "ewma_results.csv",
            None,
            "ewma_var_",
        ),
        "GARCH": (
            root / "outputs" / "phase6" / "garch_results.csv",
            None,
            "garch_var_",
        ),
        "GJR-GARCH": (
            root / "outputs" / "phase7" / "gjr_garch_results.csv",
            None,
            "gjr_var_",
        ),
    }

    results = []
    exception_series = {}

    for model_name, (path, hist_col, model_prefix) in models.items():
        if not path.exists():
            print(f"Skipping {model_name}: missing {path}")
            continue

        if model_name == "Historical":
            frame = pd.read_csv(path, parse_dates=["date"])
            frame = frame[frame["window"] == WINDOW]

            for confidence in CONFIDENCE_LEVELS:
                var_frame = frame[
                    np.isclose(frame["confidence"], confidence)
                ].set_index("date")

                aligned = pd.concat(
                    [
                        returns.rename("return"),
                        var_frame[hist_col].rename("var"),
                    ],
                    axis=1,
                    join="inner",
                ).dropna()

                # Ensure estimates correspond to the same days.
                aligned = aligned.sort_index()
                aligned = aligned.iloc[WINDOW:]

                # Historical rolling VaR is already shifted one day.
                exceptions = (
                    aligned["return"] < -aligned["var"]
                ).astype(int)

                key = (model_name, confidence)
                exception_series[key] = exceptions

                n = len(exceptions)
                x = int(exceptions.sum())
                lr_uc, p_uc = kupiec_test(x, n, confidence)
                lr_ind, p_ind = christoffersen_independence(
                    exceptions
                )

                lr_cc = (
                    lr_uc + lr_ind
                    if np.isfinite(lr_uc) and np.isfinite(lr_ind)
                    else np.nan
                )
                p_cc = (
                    float(chi2.sf(lr_cc, df=2))
                    if np.isfinite(lr_cc)
                    else np.nan
                )

                results.append({
                    "model": model_name,
                    "confidence": confidence,
                    "observations": n,
                    "exceptions": x,
                    "expected_exceptions": n * (1 - confidence),
                    "exception_rate": x / n if n else np.nan,
                    "kupiec_LR": lr_uc,
                    "kupiec_p_value": p_uc,
                    "independence_LR": lr_ind,
                    "independence_p_value": p_ind,
                    "conditional_coverage_LR": lr_cc,
                    "conditional_coverage_p_value": p_cc,
                })

        else:
            frame = pd.read_csv(path, index_col=0, parse_dates=True)
            frame = frame.sort_index()

            for confidence in CONFIDENCE_LEVELS:
                suffix = str(int(round(confidence * 1000)))
                col = f"{model_prefix}{suffix}"

                if col not in frame.columns:
                    print(f"Skipping {model_name} {confidence}: missing {col}")
                    continue

                aligned = pd.concat(
                    [
                        returns.rename("return"),
                        frame[col].rename("var"),
                    ],
                    axis=1,
                    join="inner",
                ).dropna().sort_index()

                # Evaluate only forecasts after the 750-day history.
                aligned = aligned.iloc[WINDOW:]

                exceptions = (
                    aligned["return"] < -aligned["var"]
                ).astype(int)

                key = (model_name, confidence)
                exception_series[key] = exceptions

                n = len(exceptions)
                x = int(exceptions.sum())
                lr_uc, p_uc = kupiec_test(x, n, confidence)
                lr_ind, p_ind = christoffersen_independence(
                    exceptions
                )

                lr_cc = (
                    lr_uc + lr_ind
                    if np.isfinite(lr_uc) and np.isfinite(lr_ind)
                    else np.nan
                )
                p_cc = (
                    float(chi2.sf(lr_cc, df=2))
                    if np.isfinite(lr_cc)
                    else np.nan
                )

                results.append({
                    "model": model_name,
                    "confidence": confidence,
                    "observations": n,
                    "exceptions": x,
                    "expected_exceptions": n * (1 - confidence),
                    "exception_rate": x / n if n else np.nan,
                    "kupiec_LR": lr_uc,
                    "kupiec_p_value": p_uc,
                    "independence_LR": lr_ind,
                    "independence_p_value": p_ind,
                    "conditional_coverage_LR": lr_cc,
                    "conditional_coverage_p_value": p_cc,
                })

    if not results:
        raise ValueError(
            "No models were backtested. Check that Phases 4-7 outputs exist."
        )

    summary = pd.DataFrame(results)
    summary["kupiec_pass_5pct"] = summary["kupiec_p_value"] >= 0.05
    summary["independence_pass_5pct"] = (
        summary["independence_p_value"] >= 0.05
    )
    summary["conditional_coverage_pass_5pct"] = (
        summary["conditional_coverage_p_value"] >= 0.05
    )

    summary.to_csv(output_dir / "backtesting_summary.csv", index=False)

    exception_rows = []

    for (model, confidence), series in exception_series.items():
        for date, exception in series.items():
            exception_rows.append({
                "date": date,
                "model": model,
                "confidence": confidence,
                "exception": int(exception),
            })

    pd.DataFrame(exception_rows).to_csv(
        output_dir / "exception_series.csv", index=False
    )

    print("\nBacktesting Summary:")
    print(summary.to_string(index=False))
    print(f"\nOutputs saved to: {output_dir}")
    print("Phase 8 Completed Successfully!")


if __name__ == "__main__":
    main()
