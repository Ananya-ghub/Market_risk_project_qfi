import React from 'react';
import {
  Layers,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  ExternalLink,
  Code2,
  Cpu,
  ShieldCheck,
  Activity,
  Database,
  BarChart3,
  FileCheck2,
  Flame,
  Terminal
} from 'lucide-react';

const pipelinePhases = [
  {
    phase: 'Phase 1',
    title: 'Market Data Collection',
    script: 'src/data_collection.py',
    desc: 'Downloads adjusted close prices for 50 large-cap US equities and SPY benchmark via Yahoo Finance from 2010 to current session.',
    tech: 'yfinance, pandas',
    icon: Database
  },
  {
    phase: 'Phase 2',
    title: 'Data Cleaning & Return Generation',
    script: 'src/data_cleaning.py',
    desc: 'Sanitizes raw prices, removes duplicated dates, forward-fills gaps up to 3 days, drops tickers with insufficient history, and aligns arithmetic and log returns.',
    tech: 'numpy, pandas',
    icon: Code2
  },
  {
    phase: 'Phase 3',
    title: 'Portfolio Construction',
    script: 'src/portfolio.py',
    desc: 'Establishes equal-weighted baseline allocation (w_i = 1/50 = 2.0%) on $100,000 initial capital, computing daily compound portfolio value and dollar P&L.',
    tech: 'pandas, dot product',
    icon: Layers
  },
  {
    phase: 'Phase 4',
    title: 'Historical VaR & Expected Shortfall',
    script: 'src/historical_var.py',
    desc: 'Computes empirical non-parametric quantiles and conditional tail expectations across 250, 500, and 750-day rolling lookback windows at 95%, 99%, and 99.5%.',
    tech: 'scipy.stats, numpy',
    icon: BarChart3
  },
  {
    phase: 'Phase 5',
    title: 'EWMA Volatility Scaling',
    script: 'src/ewma.py',
    desc: 'Estimates J.P. Morgan RiskMetrics exponential volatility decay (λ = 0.94) with 60-day warm-up, standardizing historical innovations to scale daily tail risk.',
    tech: 'RiskMetrics, numpy',
    icon: Activity
  },
  {
    phase: 'Phase 6',
    title: 'GARCH(1,1) Volatility Modeling',
    script: 'src/garch.py',
    desc: 'Fits conditional autoregressive variance with Student’s t innovations via Maximum Likelihood, capturing persistence (α + β = 0.973) and fat-tailed shocks.',
    tech: 'arch.arch_model',
    icon: Cpu
  },
  {
    phase: 'Phase 7',
    title: 'GJR-GARCH Asymmetric Leverage',
    script: 'src/gjr_garch.py',
    desc: 'Extends GARCH with an asymmetric indicator term (o=1), capturing empirical market leverage where negative shocks trigger significantly higher volatility (γ = 0.244).',
    tech: 'arch library',
    icon: ShieldCheck
  },
  {
    phase: 'Phase 8',
    title: 'VaR Backtesting & Statistical Validation',
    script: 'src/backtesting.py',
    desc: 'Applies Kupiec Proportion of Failures (POF) and Christoffersen 2-state Markov chain independence tests to validate unconditional and conditional coverage.',
    tech: 'scipy.stats.chi2',
    icon: FileCheck2
  },
  {
    phase: 'Phase 9',
    title: 'Comprehensive Model Comparison',
    script: 'src/model_comparison.py',
    desc: 'Evaluates Historical, EWMA, GARCH, and GJR-GARCH across 2,711 post-warmup synchronized sessions, comparing exception rates, average capital buffers, and forecast dynamism.',
    tech: 'pandas, matplotlib',
    icon: Terminal
  },
  {
    phase: 'Phase 10',
    title: 'Stress Testing & Scenario Analysis',
    script: 'src/stress_testing.py',
    desc: 'Simulates portfolio capital resilience under historical and hypothetical macro shocks (-5%, -10%, -20%), volatility doubling, and sector stress declines.',
    tech: 'covariance, shocks',
    icon: Flame
  }
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Title Card */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-teal-400">
              INTERNSHIP PROJECT DOSSIER
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide mt-1">
              Advanced Equity Portfolio Risk Management
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Value at Risk (VaR), Expected Shortfall (ES), GARCH/GJR-GARCH Econometric Volatility Modeling,
              Kupiec & Christoffersen Backtesting, and Multi-factor Stress Testing.
            </p>
          </div>

          <a
            href="https://github.com/Ananya-ghub/Market_risk_project_qfi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-navy-800 border border-navy-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-navy-750 transition-colors shadow-sm shrink-0"
          >
            <GitBranch className="h-4 w-4" />
            <span>GitHub Repository</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>

        {/* Technology Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Backend Core:</span>
          {['Python 3.14', 'yfinance', 'pandas', 'numpy', 'arch (GARCH)', 'scipy.stats', 'matplotlib'].map((tech) => (
            <span key={tech} className="rounded bg-navy-900 border border-navy-750 px-2 py-0.5 text-[11px] font-mono text-teal-300">
              {tech}
            </span>
          ))}
          <span className="text-slate-400 font-mono text-[11px] ml-2">Frontend Terminal:</span>
          {['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'Lucide React', 'Papa Parse'].map((tech) => (
            <span key={tech} className="rounded bg-navy-900 border border-navy-750 px-2 py-0.5 text-[11px] font-mono text-sky-300">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 10-Phase Pipeline Architecture */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Quantitative Research Pipeline (10 Phases)
          </h3>
          <p className="text-xs text-slate-400">
            End-to-end execution flow from raw market acquisition to regulatory backtesting and stress testing
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pipelinePhases.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={p.phase}
                className="rounded-lg border border-navy-700 bg-navy-850 p-4 hover:border-navy-600 transition-all shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-navy-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="rounded p-1.5 bg-navy-900 text-teal-400 border border-navy-750">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-teal-400 font-bold uppercase">{p.phase}</span>
                        <h4 className="text-xs font-bold text-white">{p.title}</h4>
                      </div>
                    </div>
                    <code className="text-[10px] text-slate-400 bg-navy-900 px-1.5 py-0.5 rounded border border-navy-800">
                      {p.script}
                    </code>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">{p.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-navy-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Stack: {p.tech}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Executed & Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Basel Regulatory Compliance & Governance */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5">
        <h3 className="font-semibold text-sm text-white border-b border-navy-800 pb-2.5">
          Regulatory Market Risk Framework Alignment
        </h3>
        <div className="mt-3 space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <p>
            This project follows the market risk regulatory standards established by the{' '}
            <strong>Basel Committee on Banking Supervision (BCBS)</strong> under Basel II and Basel III / Fundamental Review
            of the Trading Book (FRTB):
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>
              <strong>Unconditional Coverage (Basel 99% VaR standard):</strong> Kupiec proportion of failures test checks
              that the actual number of trading exceptions falls within the non-rejection confidence region.
            </li>
            <li>
              <strong>Conditional Coverage & Independence:</strong> Christoffersen test verifies that loss exceptions
              are distributed randomly over time rather than clustering together during systemic crises.
            </li>
            <li>
              <strong>Shift from VaR to Expected Shortfall:</strong> In accordance with Basel III/FRTB, Expected Shortfall
              is computed to measure tail risk beyond the quantile threshold, addressing the sub-additivity failure of VaR.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
