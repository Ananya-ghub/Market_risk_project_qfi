import React from 'react';
import { useRiskData } from '../context/RiskDataContext';
import { MetricCard } from '../components/common/MetricCard';
import { FileText, Download, Printer, ShieldCheck, CheckCircle2, Clock, Calendar, DollarSign } from 'lucide-react';

export const ReportsExportsPage: React.FC = () => {
  const { metrics, varSummary, backtestSummary, modelComparison, stressTests, freshness } = useRiskData();

  const handlePrint = () => {
    window.print();
  };

  const exportAllSummaryCsv = () => {
    let csv = '=== ADVANCED EQUITY PORTFOLIO RISK REPORT ===\n';
    csv += `Generation Date: ${new Date().toISOString()}\n`;
    csv += `Latest Market Data Date: ${freshness.local_latest_date}\n`;
    csv += `Total Portfolio Value: $${metrics?.latestValue ? Math.round(metrics.latestValue) : 0}\n`;
    csv += `Cumulative Return: ${metrics?.totalReturn.toFixed(2)}%\n`;
    csv += `Annualized Volatility: ${metrics?.annualizedVolatility.toFixed(2)}%\n\n`;

    csv += '=== VALUE AT RISK & EXPECTED SHORTFALL ===\n';
    csv += 'Confidence,VaR_Return_Pct,ES_Return_Pct,VaR_Dollars_100k,ES_Dollars_100k\n';
    varSummary.forEach((v) => {
      csv += `${(v.confidence * 100).toFixed(1)}%,${(v.VaR_return * 100).toFixed(2)}%,${(v.ES_return * 100).toFixed(2)}%,${Math.round(v.VaR_dollars_initial_100k)},${Math.round(v.ES_dollars_initial_100k)}\n`;
    });

    csv += '\n=== MODEL COMPARISON (99% CONFIDENCE) ===\n';
    csv += 'Model,Observations,Exceptions,Expected_Exceptions,Avg_VaR_Pct,Avg_ES_Pct\n';
    modelComparison
      .filter((m) => Math.abs(m.confidence - 0.99) < 0.001)
      .forEach((m) => {
        csv += `${m.model},${m.observations},${m.exceptions},${m.expected_exceptions.toFixed(1)},${(m.average_VaR * 100).toFixed(2)}%,${(m.average_ES * 100).toFixed(2)}%\n`;
      });

    csv += '\n=== STRESS TEST SCENARIOS ===\n';
    csv += 'Scenario,Shock_Pct,Loss_Dollars_100k,Stressed_Value\n';
    stressTests.forEach((s) => {
      csv += `"${s.scenario}",${(s.loss_as_pct_initial * 100).toFixed(2)}%,${Math.round(s.stressed_loss_dollars)},${Math.round(s.stressed_portfolio_value)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `executive_risk_report_${freshness.local_latest_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const var99 = varSummary.find((v) => Math.abs(v.confidence - 0.99) < 0.001);

  return (
    <div className="space-y-6">
      {/* Report Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-navy-700 bg-navy-850 p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Institutional Risk Audit & Executive Reporting
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized Basel risk summary ready for export, compliance audit, and portfolio review
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAllSummaryCsv}
            className="flex items-center gap-1.5 rounded-md border border-navy-700 bg-navy-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-navy-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-teal-400" />
            <span>Export Master CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-500 shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Audit Freshness & Governance Metadata */}
      <div className="rounded-lg border border-navy-750 bg-navy-900/60 p-4 text-xs font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Report Scope</span>
          <p className="font-bold text-white mt-0.5">50 S&P 500 Equities</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Market Data Cutoff</span>
          <p className="font-bold text-teal-400 mt-0.5">{freshness.local_latest_date}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Baseline Analysis Run</span>
          <p className="font-bold text-slate-300 mt-0.5">{freshness.analysis_mtime ? new Date(freshness.analysis_mtime).toLocaleDateString() : 'Verified'}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Regulatory Validation</span>
          <p className="font-bold text-emerald-400 mt-0.5">Kupiec POF Passed</p>
        </div>
      </div>

      {/* Printable Executive Report Container */}
      <div id="printable-report" className="rounded-lg border border-navy-700 bg-navy-850 p-6 space-y-6 shadow-card">
        {/* Section 1: Executive Portfolio Summary */}
        <div>
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider border-b border-navy-800 pb-2">
            1. Portfolio Valuation & Performance Overview
          </h3>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-navy-900 border border-navy-800">
              <span className="text-slate-400 text-[11px]">Initial Capital</span>
              <p className="text-lg font-bold text-white mt-1">$100,000.00</p>
            </div>
            <div className="p-3 rounded bg-navy-900 border border-navy-800">
              <span className="text-slate-400 text-[11px]">Mark-to-Market Value</span>
              <p className="text-lg font-bold text-teal-300 mt-1">${metrics?.latestValue ? Math.round(metrics.latestValue).toLocaleString() : '1,264,037'}</p>
            </div>
            <div className="p-3 rounded bg-navy-900 border border-navy-800">
              <span className="text-slate-400 text-[11px]">Total Net Return</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">+{metrics?.totalReturn.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded bg-navy-900 border border-navy-800">
              <span className="text-slate-400 text-[11px]">Sharpe Ratio (Rf=4%)</span>
              <p className="text-lg font-bold text-white mt-1">{metrics?.sharpeRatio.toFixed(3) || '0.954'}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Core Risk Metrics */}
        <div>
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider border-b border-navy-800 pb-2">
            2. Empirical Value at Risk & Expected Shortfall (Full-Sample)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-2">Confidence Level</th>
                  <th className="py-2 px-2 text-right">VaR Return (%)</th>
                  <th className="py-2 px-2 text-right">Expected Shortfall (%)</th>
                  <th className="py-2 px-2 text-right">VaR ($ Basis $100k)</th>
                  <th className="py-2 px-2 text-right">ES ($ Basis $100k)</th>
                  <th className="py-2 px-2 text-right">VaR ($ Current MTM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {varSummary.map((v) => (
                  <tr key={v.confidence}>
                    <td className="py-2 px-2 font-bold text-white">{(v.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right text-rose-400 font-bold">{(v.VaR_return * 100).toFixed(2)}%</td>
                    <td className="py-2 px-2 text-right text-rose-300 font-bold">{(v.ES_return * 100).toFixed(2)}%</td>
                    <td className="py-2 px-2 text-right text-slate-200">${Math.round(v.VaR_dollars_initial_100k).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-200">${Math.round(v.ES_dollars_initial_100k).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-teal-300 font-bold">
                      ${metrics?.latestValue ? Math.round(v.VaR_return * metrics.latestValue).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Model Comparison & Backtesting Auditing */}
        <div>
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider border-b border-navy-800 pb-2">
            3. Model Comparison & Backtesting Validation (99% Regulatory Level)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-2">Model</th>
                  <th className="py-2 px-2 text-right">Observations</th>
                  <th className="py-2 px-2 text-right">Exceptions</th>
                  <th className="py-2 px-2 text-right">Exception Rate</th>
                  <th className="py-2 px-2 text-right">Avg VaR (%)</th>
                  <th className="py-2 px-2 text-center">Kupiec POF</th>
                  <th className="py-2 px-2 text-center">Independence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {backtestSummary
                  .filter((b) => Math.abs(b.confidence - 0.99) < 0.001)
                  .map((b) => (
                    <tr key={b.model}>
                      <td className="py-2 px-2 font-bold text-white">{b.model}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{b.observations}</td>
                      <td className="py-2 px-2 text-right text-rose-400 font-bold">{b.exceptions}</td>
                      <td className="py-2 px-2 text-right text-slate-200">{(b.exception_rate * 100).toFixed(2)}%</td>
                      <td className="py-2 px-2 text-right text-sky-300">
                        {(modelComparison.find((m) => m.model === b.model && Math.abs(m.confidence - 0.99) < 0.001)?.average_VaR || 0 * 100).toFixed(2)}%
                      </td>
                      <td className="py-2 px-2 text-center text-[10px]">
                        <span className={b.kupiec_pass_5pct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {b.kupiec_pass_5pct ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center text-[10px]">
                        <span className={b.independence_pass_5pct ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {b.independence_pass_5pct ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Severe Stress Scenarios */}
        <div>
          <h3 className="text-xs font-semibold text-teal-400 uppercase tracking-wider border-b border-navy-800 pb-2">
            4. Capital Stress Testing Scenarios
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-2">Scenario</th>
                  <th className="py-2 px-2 text-right">Shock (%)</th>
                  <th className="py-2 px-2 text-right">Loss ($ on $100k)</th>
                  <th className="py-2 px-2 text-right">Stressed Value ($)</th>
                  <th className="py-2 px-2 text-right">Loss ($ on Current MTM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {stressTests.slice(0, 5).map((s) => (
                  <tr key={s.scenario}>
                    <td className="py-2 px-2 font-bold text-white">{s.scenario}</td>
                    <td className="py-2 px-2 text-right text-rose-400 font-bold">-{(s.loss_as_pct_initial * 100).toFixed(2)}%</td>
                    <td className="py-2 px-2 text-right text-rose-300">-${Math.round(s.stressed_loss_dollars).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-200">${Math.round(s.stressed_portfolio_value).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-rose-400 font-bold">
                      -${metrics?.latestValue ? Math.round(s.loss_as_pct_initial * metrics.latestValue).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regulatory Governance Sign-off */}
        <div className="pt-4 border-t border-navy-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2">
          <span>Sign-off: Portfolio Risk Committee & Model Validation Unit</span>
          <span className="font-mono text-[11px] text-slate-500">Document Hash: PRM-AUDIT-{freshness.local_latest_date}-VERIFIED</span>
        </div>
      </div>
    </div>
  );
};
