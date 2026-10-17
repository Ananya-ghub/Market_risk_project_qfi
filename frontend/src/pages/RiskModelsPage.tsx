import React from 'react';
import { useRiskData } from '../context/RiskDataContext';
import { ShieldCheck, Activity, Cpu, Layers, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export const RiskModelsPage: React.FC = () => {
  const { garchParams, gjrParams } = useRiskData();

  // Helper to get param value
  const getParam = (list: any[], name: string, fallback: number) => {
    const item = list.find((p) => p.parameter === name);
    return item ? item.estimate : fallback;
  };

  const garchMu = getParam(garchParams, 'mu', 0.120863);
  const garchOmega = getParam(garchParams, 'omega', 0.031559);
  const garchAlpha = getParam(garchParams, 'alpha[1]', 0.150691);
  const garchBeta = getParam(garchParams, 'beta[1]', 0.822565);
  const garchNu = getParam(garchParams, 'nu', 6.414655);
  const garchPersistence = garchAlpha + garchBeta;

  const gjrMu = getParam(gjrParams, 'mu', 0.093622);
  const gjrOmega = getParam(gjrParams, 'omega', 0.033013);
  const gjrAlpha = getParam(gjrParams, 'alpha[1]', 2.76e-21);
  const gjrGamma = getParam(gjrParams, 'gamma[1]', 0.244012);
  const gjrBeta = getParam(gjrParams, 'beta[1]', 0.840755);
  const gjrNu = getParam(gjrParams, 'nu', 6.791424);
  const gjrPersistence = gjrAlpha + gjrBeta + gjrGamma / 2;

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-teal-500/10 p-3 text-teal-400 border border-teal-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Quantitative Risk Modeling Framework
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-4xl">
              This terminal implements four distinct parametric and non-parametric methodologies for daily equity
              market risk estimation. Historical Simulation uses empirical return quantiles without distribution
              assumptions. EWMA introduces exponential memory decaying past shocks. GARCH(1,1) estimates autoregressive
              conditional heteroskedasticity with Student's t innovations, and GJR-GARCH isolates asymmetric downside
              leverage shocks.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Core Volatility & Risk Models */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Model 1: Historical Simulation */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-sky-400" />
                <h3 className="font-semibold text-sm text-slate-100">1. Historical Simulation</h3>
              </div>
              <span className="rounded bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 text-[10px] font-mono text-sky-300">
                NON-PARAMETRIC
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded bg-navy-900 p-3 font-mono text-[11px] text-teal-300 border border-navy-800">
                VaR_α = - Quantile(R_t, 1 - α)
                <br />
                ES_α = - E[ R_t | R_t ≤ -VaR_α ]
              </div>

              <div>
                <strong className="text-white">Methodology & Purpose:</strong>
                <p className="mt-0.5 text-slate-400 leading-relaxed">
                  Evaluates historical daily portfolio returns directly by taking empirical percentiles (e.g. 5th, 1st,
                  and 0.5th percentiles) over 250, 500, and 750-day rolling sample windows. Captures fat tails and skewness
                  without fitting a theoretical distribution.
                </p>
              </div>

              <div>
                <strong className="text-white">Assumptions & Limitations:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-400">
                  <li>Assumes identically and independently distributed (i.i.d.) returns across the window.</li>
                  <li>Ignores volatility clustering: ghost effect occurs when large past shocks leave the rolling window.</li>
                  <li>Slow to react to sudden volatility surges (e.g. March 2020 crash).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Windows: 250d, 500d, 750d</span>
            <span>Confidence: 95%, 99%, 99.5%</span>
          </div>
        </div>

        {/* Model 2: EWMA Volatility */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-400" />
                <h3 className="font-semibold text-sm text-slate-100">2. EWMA Volatility Scaling</h3>
              </div>
              <span className="rounded bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 text-[10px] font-mono text-teal-300">
                RISKMETRICS (λ = 0.94)
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded bg-navy-900 p-3 font-mono text-[11px] text-teal-300 border border-navy-800">
                σ_t^2 = λ · σ_(t-1)^2 + (1 - λ) · R_(t-1)^2
                <br />
                R*_t = R_t / σ_t (Standardized Returns)
              </div>

              <div>
                <strong className="text-white">Methodology & Purpose:</strong>
                <p className="mt-0.5 text-slate-400 leading-relaxed">
                  Applies J.P. Morgan RiskMetrics exponential decay parameter λ = 0.94 with 60-day warm-up variance.
                  Historical returns are filtered into standardized innovations and scaled to today's conditional
                  volatility forecast: <code className="text-teal-300">R_scaled = R_std * σ_today</code>.
                </p>
              </div>

              <div>
                <strong className="text-white">Assumptions & Limitations:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1 text-slate-400">
                  <li>Places exponentially higher weight on recent price shocks.</li>
                  <li>Restricted to fixed decay parameter λ = 0.94 rather than estimated via MLE.</li>
                  <li>Assumes zero long-term mean reversion (unit root in variance equation).</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Decay: λ = 0.94</span>
            <span>Warm-up: 60 Days</span>
          </div>
        </div>

        {/* Model 3: GARCH(1,1) */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-sm text-slate-100">3. GARCH(1,1) with Student's t</h3>
              </div>
              <span className="rounded bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                MAXIMUM LIKELIHOOD
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded bg-navy-900 p-3 font-mono text-[11px] text-teal-300 border border-navy-800">
                σ_t^2 = ω + α · ε_(t-1)^2 + β · σ_(t-1)^2
                <br />
                Persistence = α + β = {garchPersistence.toFixed(4)}
              </div>

              <div>
                <strong className="text-white">Fitted Model Parameters (Inspected):</strong>
                <div className="mt-1 grid grid-cols-5 gap-2 rounded bg-navy-900/60 p-2 text-center font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">μ</span>
                    <p className="font-bold text-white">{garchMu.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ω</span>
                    <p className="font-bold text-white">{garchOmega.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">α[1]</span>
                    <p className="font-bold text-white">{garchAlpha.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">β[1]</span>
                    <p className="font-bold text-white">{garchBeta.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ν (DoF)</span>
                    <p className="font-bold text-amber-300">{garchNu.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-white">Statistical Interpretation:</strong>
                <p className="mt-0.5 text-slate-400 leading-relaxed">
                  The degrees of freedom parameter <code className="text-amber-300">ν = {garchNu.toFixed(2)}</code> confirms
                  strong leptokurtosis (fat tails) compared to a Gaussian distribution (ν &gt; 30). High persistence
                  indicates volatility shocks decay slowly over time.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Mean Model: Constant</span>
            <span>Innovations: Student's t</span>
          </div>
        </div>

        {/* Model 4: GJR-GARCH */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-400" />
                <h3 className="font-semibold text-sm text-slate-100">4. GJR-GARCH Asymmetric Leverage</h3>
              </div>
              <span className="rounded bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                ASYMMETRIC LEVERAGE
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="rounded bg-navy-900 p-3 font-mono text-[11px] text-teal-300 border border-navy-800">
                σ_t^2 = ω + (α + γ · I_(t-1)) · ε_(t-1)^2 + β · σ_(t-1)^2
                <br />
                I_(t-1) = 1 if ε_(t-1) &lt; 0, else 0
              </div>

              <div>
                <strong className="text-white">Fitted Model Parameters (Inspected):</strong>
                <div className="mt-1 grid grid-cols-6 gap-1 rounded bg-navy-900/60 p-2 text-center font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">μ</span>
                    <p className="font-bold text-white">{gjrMu.toFixed(3)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ω</span>
                    <p className="font-bold text-white">{gjrOmega.toFixed(3)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">α[1]</span>
                    <p className="font-bold text-white">0.000</p>
                  </div>
                  <div>
                    <span className="text-slate-500">γ[1]</span>
                    <p className="font-bold text-rose-400">{gjrGamma.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">β[1]</span>
                    <p className="font-bold text-white">{gjrBeta.toFixed(3)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">ν (DoF)</span>
                    <p className="font-bold text-amber-300">{gjrNu.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div>
                <strong className="text-white">Asymmetric Leverage Effect:</strong>
                <p className="mt-0.5 text-slate-400 leading-relaxed">
                  The leverage coefficient <code className="text-rose-400">γ = {gjrGamma.toFixed(4)}</code> is strongly
                  positive, proving that negative market shocks produce substantially higher volatility than positive
                  shocks of identical magnitude. In fact, α is near zero, meaning virtually all ARCH innovation is
                  triggered by down days!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between text-[11px] font-mono text-slate-500">
            <span>Asymmetric Order: o = 1</span>
            <span>Persistence: {gjrPersistence.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Model Architecture and Pipeline Table */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5">
        <h3 className="font-semibold text-sm text-slate-100 border-b border-navy-800 pb-3">
          Model Specifications & Comparison Matrix
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Distribution Assumption</th>
                <th className="py-2.5 px-3">Volatility Dynamism</th>
                <th className="py-2.5 px-3">Asymmetric Response</th>
                <th className="py-2.5 px-3">Strengths</th>
                <th className="py-2.5 px-3">Key Vulnerabilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/60 font-mono text-[11px]">
              <tr className="hover:bg-navy-800/40">
                <td className="py-2 px-3 font-semibold text-sky-300">Historical Simulation</td>
                <td className="py-2 px-3 text-slate-400">Empirical (Non-parametric)</td>
                <td className="py-2 px-3 text-slate-400">Lagged Rolling Window</td>
                <td className="py-2 px-3 text-slate-500">No (Symmetric window)</td>
                <td className="py-2 px-3 text-emerald-400">Easy to explain; no model error</td>
                <td className="py-2 px-3 text-rose-400">Ghost effects; slow to react to crises</td>
              </tr>
              <tr className="hover:bg-navy-800/40">
                <td className="py-2 px-3 font-semibold text-teal-300">EWMA (RiskMetrics)</td>
                <td className="py-2 px-3 text-slate-400">Filtered Empirical Scaling</td>
                <td className="py-2 px-3 text-slate-400">Exponential Decay (λ = 0.94)</td>
                <td className="py-2 px-3 text-slate-500">No (R^2 is quadratic)</td>
                <td className="py-2 px-3 text-emerald-400">Fast reaction to market turbulence</td>
                <td className="py-2 px-3 text-rose-400">Assumes equal shock for up & down moves</td>
              </tr>
              <tr className="hover:bg-navy-800/40">
                <td className="py-2 px-3 font-semibold text-amber-300">GARCH(1,1)</td>
                <td className="py-2 px-3 text-slate-400">Student's t Innovations (ν = 6.41)</td>
                <td className="py-2 px-3 text-slate-400">Autoregressive Conditional</td>
                <td className="py-2 px-3 text-slate-500">No (Symmetric ARCH term)</td>
                <td className="py-2 px-3 text-emerald-400">Mean-reverting; captures fat tails</td>
                <td className="py-2 px-3 text-rose-400">Ignores leverage effect</td>
              </tr>
              <tr className="hover:bg-navy-800/40">
                <td className="py-2 px-3 font-semibold text-rose-300">GJR-GARCH(1,1,1)</td>
                <td className="py-2 px-3 text-slate-400">Student's t Innovations (ν = 6.79)</td>
                <td className="py-2 px-3 text-slate-400">Autoregressive + Downside Indicator</td>
                <td className="py-2 px-3 text-emerald-400 font-bold">Yes (γ = 0.2440)</td>
                <td className="py-2 px-3 text-emerald-400">Highest predictive realism in crashes</td>
                <td className="py-2 px-3 text-slate-400">Computational cost in MLE estimation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
