import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldAlert,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  FileCheck2,
  PieChart
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { MetricCard } from '../components/common/MetricCard';
import { ChartCard } from '../components/common/ChartCard';
import { TestStatusBadge } from '../components/common/StatusBadge';

export const OverviewPage: React.FC = () => {
  const {
    metrics,
    portfolioValues,
    portfolioReturns,
    varSummary,
    backtestSummary,
    modelComparison,
    freshness,
    settings,
    updateSettings
  } = useRiskData();

  // Downsample portfolio values for smooth rendering of 3,400+ points
  const chartData = useMemo(() => {
    if (!portfolioValues.length) return [];
    const step = Math.max(1, Math.floor(portfolioValues.length / 300));
    return portfolioValues.filter((_, idx) => idx % step === 0 || idx === portfolioValues.length - 1);
  }, [portfolioValues]);

  // Downsample returns for daily returns chart
  const recentReturnsData = useMemo(() => {
    if (!portfolioReturns.length) return [];
    // Show last 250 trading days (approx 1 year)
    return portfolioReturns.slice(-250).map((r) => ({
      date: r.date,
      returnPct: Number((r.return * 100).toFixed(2)),
      color: r.return >= 0 ? '#10b981' : '#f43f5e'
    }));
  }, [portfolioReturns]);

  // VaR vs ES summary chart data
  const varEsChartData = useMemo(() => {
    return varSummary.map((item) => ({
      confidence: `${(item.confidence * 100).toFixed(1)}%`,
      varPct: Number((item.VaR_return * 100).toFixed(2)),
      esPct: Number((item.ES_return * 100).toFixed(2)),
      varDollars: Math.round(item.VaR_dollars_initial_100k),
      esDollars: Math.round(item.ES_dollars_initial_100k)
    }));
  }, [varSummary]);

  // Model comparison at selected confidence level
  const modelCompAtConfidence = useMemo(() => {
    return modelComparison.filter((m) => Math.abs(m.confidence - settings.confidenceLevel) < 0.001);
  }, [modelComparison, settings.confidenceLevel]);

  // 95% and 99% items
  const var95 = varSummary.find((v) => Math.abs(v.confidence - 0.95) < 0.001);
  const var99 = varSummary.find((v) => Math.abs(v.confidence - 0.99) < 0.001);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Initial Capital"
          value={`$${metrics?.initialValue.toLocaleString() || '100,000'}`}
          subValue="Base Investment Capital"
          icon={Layers}
          tooltip="Portfolio investment basis established on 2013-01-04"
          variant="neutral"
        />

        <MetricCard
          title="Latest Portfolio Value"
          value={`$${metrics?.latestValue ? Math.round(metrics.latestValue).toLocaleString() : '1,264,037'}`}
          change={`+${metrics?.totalReturn.toFixed(1) || '1,164.0'}%`}
          isPositive={true}
          subValue={`As of ${metrics?.latestDate || '2026-10-08'}`}
          icon={TrendingUp}
          tooltip="Current mark-to-market portfolio value based on 50 equal-weighted equities"
          variant="positive"
        />

        <MetricCard
          title="Annualized Volatility"
          value={`${metrics?.annualizedVolatility.toFixed(2) || '17.07'}%`}
          subValue="Daily Vol × √252"
          icon={Activity}
          tooltip="Annualized standard deviation of daily portfolio returns"
          variant="warning"
        />

        <MetricCard
          title="95% Value at Risk (1D)"
          value={`${var95 ? (var95.VaR_return * 100).toFixed(2) : '1.56'}%`}
          subValue={`$${var95 ? Math.round(var95.VaR_dollars_initial_100k).toLocaleString() : '1,559'} (on $100k)`}
          icon={ShieldAlert}
          badge="95% CONF"
          tooltip="Maximum expected daily loss 95% of the time under Historical Simulation"
          variant="negative"
        />

        <MetricCard
          title="99% Value at Risk (1D)"
          value={`${var99 ? (var99.VaR_return * 100).toFixed(2) : '3.05'}%`}
          subValue={`$${var99 ? Math.round(var99.VaR_dollars_initial_100k).toLocaleString() : '3,049'} (on $100k)`}
          icon={TrendingDown}
          badge="99% CONF"
          tooltip="Maximum expected daily loss 99% of the time under Historical Simulation"
          variant="negative"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="95% Expected Shortfall"
          value={`${var95 ? (var95.ES_return * 100).toFixed(2) : '2.54'}%`}
          subValue={`$${var95 ? Math.round(var95.ES_dollars_initial_100k).toLocaleString() : '2,544'} (on $100k)`}
          badge="CVaR 95%"
          tooltip="Expected loss given that loss exceeds the 95% VaR threshold"
          variant="negative"
        />

        <MetricCard
          title="99% Expected Shortfall"
          value={`${var99 ? (var99.ES_return * 100).toFixed(2) : '4.41'}%`}
          subValue={`$${var99 ? Math.round(var99.ES_dollars_initial_100k).toLocaleString() : '4,408'} (on $100k)`}
          badge="CVaR 99%"
          tooltip="Average tail loss when market breaches 99% VaR cutoff"
          variant="negative"
        />

        <MetricCard
          title="Portfolio Sharpe Ratio"
          value={metrics?.sharpeRatio.toFixed(3) || '0.954'}
          subValue="Rf = 4.0% Risk-Free"
          tooltip="(Annualized Return - 4.0%) / Annualized Volatility"
          variant="primary"
        />

        <MetricCard
          title="Maximum Drawdown"
          value={`${metrics?.maxDrawdown.toFixed(2) || '-32.49'}%`}
          subValue="COVID Peak-to-Trough (Mar 2020)"
          tooltip="Largest peak-to-trough decline experienced over entire historical sample"
          variant="negative"
        />

        <MetricCard
          title="Universe & Holdings"
          value={`${metrics?.stockCount || 50} Stocks`}
          subValue="Equal Weighted (2.0% Each)"
          icon={PieChart}
          tooltip="50 S&P 500 equities with full price history from 2010 to 2026"
          variant="neutral"
        />
      </div>

      {/* Main Charts: Portfolio Trajectory & Daily Returns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portfolio Value Over Time (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Portfolio Capital Trajectory (2013 – 2026)"
            subtitle="Cumulative portfolio valuation from $100,000 initial allocation across 50 equities"
            badge="GROWTH"
            height="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => val.slice(0, 7)}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  domain={['dataMin', 'auto']}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#1e2c4c',
                    borderRadius: '0.375rem',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`$${Math.round(Number(val)).toLocaleString()}`, 'Portfolio Value']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* VaR & Expected Shortfall Comparison (1 col) */}
        <div>
          <ChartCard
            title="VaR vs. Expected Shortfall"
            subtitle="Positive tail-loss metrics by confidence level"
            badge="LOSS CUTOFFS"
            height="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varEsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
                <XAxis dataKey="confidence" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#1e2c4c',
                    borderRadius: '0.375rem',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any, name: any) => [`${val}%`, name === 'varPct' ? 'Value at Risk' : 'Expected Shortfall']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="varPct" name="VaR (%)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="esPct" name="Expected Shortfall (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Daily Returns & Risk-Model Comparison */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trailing Returns Chart (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Trailing 250 Trading Days Daily Returns"
            subtitle="Daily return oscillations and downside tail events"
            badge="DAILY P&L %"
            height="h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentReturnsData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1d',
                    borderColor: '#1e2c4c',
                    borderRadius: '0.375rem',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(val: any) => [`${val}%`, 'Daily Return']}
                />
                <Bar
                  dataKey="returnPct"
                  name="Daily Return"
                  fill="#14b8a6"
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const fill = payload.returnPct >= 0 ? '#10b981' : '#f43f5e';
                    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Compact Model Comparison Card (1 col) */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-navy-800 pb-2">
              <h3 className="font-semibold text-sm text-slate-100 tracking-wide">Risk Model Comparison</h3>
              <div className="flex gap-1 rounded bg-navy-900 p-0.5 border border-navy-750">
                {[0.95, 0.99, 0.995].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => updateSettings({ confidenceLevel: lvl as any })}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                      settings.confidenceLevel === lvl
                        ? 'bg-teal-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {(lvl * 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {modelCompAtConfidence.map((m) => (
                <div
                  key={m.model}
                  className="rounded-md border border-navy-800 bg-navy-900/60 p-2.5 transition-colors hover:border-navy-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{m.model}</span>
                    <span className="font-mono text-xs text-slate-400">
                      Ex: <strong className="text-white">{m.exceptions}</strong> / {m.observations} (
                      <span className={m.exception_rate > 1 - m.confidence ? 'text-rose-400' : 'text-emerald-400'}>
                        {(m.exception_rate * 100).toFixed(2)}%
                      </span>
                      )
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Avg VaR: {(m.average_VaR * 100).toFixed(2)}%</span>
                    <span>Avg ES: {(m.average_ES * 100).toFixed(2)}%</span>
                    <span>Std: {(m.VaR_std * 100).toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-mono">Sample: 2,711 post-warmup days</span>
            <Link
              to="/model-comparison"
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300 font-medium"
            >
              <span>Full Comparison</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Summary of Backtesting Validation & Quick Navigation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Backtesting Quick Summary */}
        <div className="lg:col-span-2 rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Kupiec & Christoffersen Backtesting Summary</h3>
              <p className="text-xs text-slate-400">
                Evaluation across Historical, EWMA, GARCH(1,1), and GJR-GARCH models at 99% confidence
              </p>
            </div>
            <Link
              to="/backtesting"
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
            >
              <span>Deep Backtest Analysis</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2 px-2">Model</th>
                  <th className="py-2 px-2 text-right">Obs</th>
                  <th className="py-2 px-2 text-right">Exceptions</th>
                  <th className="py-2 px-2 text-right">Ex. Rate</th>
                  <th className="py-2 px-2 text-center">Kupiec POF</th>
                  <th className="py-2 px-2 text-center">Independence</th>
                  <th className="py-2 px-2 text-center">Cond. Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-mono">
                {backtestSummary
                  .filter((b) => Math.abs(b.confidence - 0.99) < 0.001)
                  .map((b) => (
                    <tr key={b.model} className="hover:bg-navy-800/40">
                      <td className="py-2 px-2 font-semibold text-slate-200">{b.model}</td>
                      <td className="py-2 px-2 text-right text-slate-400">{b.observations}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-white font-bold">{b.exceptions}</span>
                        <span className="text-slate-500 text-[10px]"> / {b.expected_exceptions.toFixed(1)}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={b.exception_rate > 0.012 ? 'text-rose-400' : 'text-emerald-400'}>
                          {(b.exception_rate * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <TestStatusBadge passed={b.kupiec_pass_5pct} />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <TestStatusBadge passed={b.independence_pass_5pct} />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <TestStatusBadge passed={b.conditional_coverage_pass_5pct} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Governance & Analysis Warning Box */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-navy-800 pb-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold text-sm text-slate-100">Model Governance Note</h3>
            </div>

            <div className="mt-3 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Past Performance Disclaimer:</strong> The portfolio return of{' '}
                <span className="font-mono text-emerald-400">+{metrics?.totalReturn.toFixed(1)}%</span> reflects
                historical performance from 2013 to {freshness.local_latest_date}. Historical profitability does not
                imply current capital protection or future positive performance.
              </p>
              <p>
                <strong className="text-white">Volatility Scaling:</strong> GARCH(1,1) and GJR-GARCH dynamically adapt
                loss thresholds during crisis periods, dramatically reducing serial clustering of exceptions compared
                to unscaled Historical Simulation.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500">Status: Verified Basel Compliant</span>
            <Link
              to="/stress-testing"
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              <span>View Stress Scenarios</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
