"""
End-to-End Quantitative Risk Management Pipeline Orchestrator
Executes Phases 1 through 10 sequentially and produces audit reports.
"""

import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from src.data_collection import main as run_phase1
from src.data_cleaning import main as run_phase2
from src.portfolio import main as run_phase3
from src.historical_var import main as run_phase4
from src.ewma import main as run_phase5
from src.garch import main as run_phase6
from src.gjr_garch import main as run_phase7
from src.backtesting import main as run_phase8
from src.model_comparison import main as run_phase9
from src.stress_testing import main as run_phase10


def run_full_pipeline(skip_download: bool = False):
    start_time = time.time()
    print("=" * 70)
    print(" ADVANCED EQUITY PORTFOLIO RISK PIPELINE — FULL RUN")
    print("=" * 70)

    if not skip_download:
        print("\n>>> Phase 1: Data Collection")
        run_phase1()
    else:
        print("\n>>> Skipping Phase 1 (Data Collection) — Using existing raw data.")

    print("\n>>> Phase 2: Data Cleaning")
    run_phase2()

    print("\n>>> Phase 3: Portfolio Construction")
    run_phase3()

    print("\n>>> Phase 4: Historical VaR & Expected Shortfall")
    run_phase4()

    print("\n>>> Phase 5: EWMA Volatility Scaling")
    run_phase5()

    print("\n>>> Phase 6: GARCH(1,1) Volatility Modeling")
    run_phase6()

    print("\n>>> Phase 7: GJR-GARCH Asymmetric Volatility Modeling")
    run_phase7()

    print("\n>>> Phase 8: VaR Backtesting & Kupiec / Christoffersen Tests")
    run_phase8()

    print("\n>>> Phase 9: Cross-Model Risk Comparison")
    run_phase9()

    print("\n>>> Phase 10: Portfolio Stress Testing")
    run_phase10()

    # Generate quality report
    try:
        from src.generate_quality_report import main as gen_report
        gen_report()
    except Exception:
        pass

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f" ALL 10 QUANTITATIVE RISK PHASES COMPLETED IN {elapsed:.1f}s")
    print("=" * 70)


if __name__ == "__main__":
    skip = "--skip-download" in sys.argv
    run_full_pipeline(skip_download=skip)
