import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { VarSummaryItem } from '../types/risk';
import { TrendingDown, ShieldAlert, AlertTriangle, Layers, Info } from 'lucide-react';

export const HistoricalVarPage: React.FC = () => {
  const { varSummary, rollingVar, portfolioReturns, metrics } = useRiskData();
  const [selectedConfidence, setSelectedConfidence] = useState<number>(0.99);
  const [selectedWindow, setSelectedWindow] = useState<number>(750);

  // Return distribution bins
  const distributionData = useMemo(() => {
    if (!portfolioReturns.length) return [];
    const returns = portfolioReturns.map((r) => r.return * 100);
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const binCount = 60;
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      binStart: min + i * binWidth,
      binMid: (min + (i + 0.5) * binWidth).toFixed(2),
      count: 0,
      isTailLoss95: false,
      isTailLoss99: false
    }));

    const var95Cutoff = varSummary.find((v) => Math.abs(v.confidence - 0.95) < 0.001)?.VaR_return || 0.0156;
    const var99Cutoff = varSummary.find((v) => Math.abs(v.confidence - 0.99) < 0.001)?.VaR_return || 0.0305;

    returns.forEach((r) => {
      const idx = Math.min(Math.floor((r - min) / binWidth), binCount - 1);
      if (idx >= 0 && idx < binCount) {
        bins[idx].count++;
        if (bins[idx].binStart / 100 <= -var95Cutoff) bins[idx].isTailLoss95 = true;
        if (bins[idx].binStart / 100 <= -var99Cutoff) bins[idx].isTailLoss99 = true;
      }
    });

    return bins;
  }, [portfolioReturns, varSummary]);

  // Rolling VaR series filtered by confidence and downsampled for performance
  const rollingVarChartData = useMemo(() => {
    if (!rollingVar.length) return [];
    const subset = rollingVar.filter((r) => Math.abs(r.confidence - selectedConfidence) < 0.001);
    const byDate = new Map<string, { date: string; var250?: number; var500?: number; var750?: number }>();

    subset.forEach((row) => {
      if (!byDate.has(row.date)) {
        byDate.set(row.date, { date: row.date });
      }
      const item = byDate.get(row.date)!;
      if (row.window === 250 && !isNaN(row.VaR_return)) item.var250 = Number((row.VaR_return * 100).toFixed(2));
      if (row.window === 500 && !isNaN(row.VaR_return)) item.var500 = Number((row.VaR_return * 100).toFixed(2));
      if (row.window === 750 && !isNaN(row.VaR_return)) item.var750 = Number((row.VaR_return * 100).toFixed(2));
    });

    const arr = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    const step = Math.max(1, Math.floor(arr.length / 250));
    return arr.filter((_, idx) => idx % step === 0 || idx === arr.length - 1);
  }, [rollingVar, selectedConfidence]);

  // VaR Summary table columns
  const varColumns: ColumnDef<VarSummaryItem>[] = [
    {
      key: 'confidence',
      header: 'Confidence Level (1 - α)',
      render: (r) => (
        <span className="font-bold text-white">
          {(r.confidence * 100).toFixed(1)}% ({((1 - r.confidence) * 100).toFixed(1)}% Tail)
        </span>
      )
    },
    {
      key: 'VaR_return',
      header: '1-Day VaR (Loss %)',
      align: 'right',
      render: (r) => <span className="font-bold text-rose-400">{(r.VaR_return * 100).toFixed(2)}%</span>
    },
    {
      key: 'ES_return',
      header: 'Expected Shortfall (ES %)',
      align: 'right',
      render: (r) => <span className="font-bold text-rose-300">{(r.ES_return * 100).toFixed(2)}%</span>
    },
    {
      key: 'VaR_dollars_initial_100k',
      header: 'VaR ($ on $100k)',
      align: 'right',
      render: (r) => `$${Math.round(r.VaR_dollars_initial_100k).toLocaleString()}`
    },
    {
      key: 'ES_dollars_initial_100k',
      header: 'ES ($ on $100k)',
      align: 'right',
      render: (r) => `$${Math.round(r.ES_dollars_initial_100k).toLocaleString()}`
    },
    {
      key: 'VaR_latest_portfolio',
      header: 'VaR ($ on Latest MTM)',
      align: 'right',
      render: (r) => {
        const val = metrics?.latestValue ? Math.round(r.VaR_return * metrics.latestValue) : 0;
        return <span className="text-teal-300 font-bold">${val.toLocaleString()}</span>;
      }
    },
    {
      key: 'observations',
      header: 'Sample Size (Days)',
      align: 'center',
      render: (r) => `${r.observations.toLocaleString()} days`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sign Convention & Definition Notice */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-teal-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 space-y-1.5">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Institutional Sign Convention & Risk Measurement Units
            </h4>
            <p>
              In accordance with Basel market risk standards, <strong>Value at Risk (VaR)</strong> and{' '}
              <strong>Expected Shortfall (ES)</strong> are reported as <strong>positive loss thresholds</strong>. A 99%
              VaR of <code className="text-rose-400 font-mono">3.05%</code> indicates that 99 out of 100 trading sessions,
              the portfolio will not suffer a daily decline exceeding 3.05%.
            </p>
            <p className="text-slate-400">
              Dollar-denominated risk metrics are presented on the initial investment basis of <strong>$100,000.00</strong> as
              generated in the project outputs (<code className="text-slate-300">var_summary.csv</code>), as well as scaled
              to the latest mark-to-market portfolio value (${Math.round(metrics?.latestValue || 0).toLocaleString()}) for
              current institutional perspective.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards across Confidence Levels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {varSummary.map((v) => (
          <div
            key={v.confidence}
            className="rounded-lg border border-navy-700 bg-navy-850 p-4 hover:border-navy-600 transition-all shadow-card"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-navy-800">
              <span className="font-semibold text-white uppercase tracking-wider">
                {(v.confidence * 100).toFixed(1)}% Confidence
              </span>
              <span className="rounded bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-mono text-rose-300">
                α = {((1 - v.confidence) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wide">Value at Risk</span>
                <p className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                  {(v.VaR_return * 100).toFixed(2)}%
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  ${Math.round(v.VaR_dollars_initial_100k).toLocaleString()}{' '}
                  <span className="text-[10px] text-slate-500">($100k)</span>
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wide">Expected Shortfall</span>
                <p className="text-xl font-bold font-mono text-rose-300 mt-0.5">
                  {(v.ES_return * 100).toFixed(2)}%
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  ${Math.round(v.ES_dollars_initial_100k).toLocaleString()}{' '}
                  <span className="text-[10px] text-slate-500">($100k)</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts: Return Distribution Histogram & Rolling VaR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Empirical Return Distribution Histogram */}
        <ChartCard
          title="Empirical Return Distribution & Historical VaR Cutoffs"
          subtitle="Histogram of 3,461 daily returns with 95% and 99% tail cutoffs"
          badge="FAT TAILS"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis
                dataKey="binMid"
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                interval={6}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1d',
                  borderColor: '#1e2c4c',
                  borderRadius: '0.375rem',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any, _, props: any) => [
                  `${val} days (${props.payload.binMid}%)`,
                  props.payload.isTailLoss99
                    ? '99% Extreme Tail'
                    : props.payload.isTailLoss95
                    ? '95% Tail Breach'
                    : 'Normal Trading Density'
                ]}
              />
              <Bar
                dataKey="count"
                name="Daily Frequency"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  let fill = '#38bdf8';
                  if (payload.isTailLoss99) fill = '#ef4444';
                  else if (payload.isTailLoss95) fill = '#f59e0b';
                  return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Rolling Historical VaR Window Comparison */}
        <ChartCard
          title={`Rolling Historical VaR (${(selectedConfidence * 100).toFixed(1)}% Confidence)`}
          subtitle="Comparison of 250-day, 500-day, and 750-day rolling lookback estimation windows"
          actions={
            <div className="flex gap-1 rounded bg-navy-900 p-0.5 border border-navy-750">
              {[0.95, 0.99, 0.995].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedConfidence(lvl)}
                  className={`px-2 py-1 text-xs font-mono rounded ${
                    selectedConfidence === lvl ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {(lvl * 100).toFixed(1)}%
                </button>
              ))}
            </div>
          }
          badge="WINDOW STABILITY"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rollingVarChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(0, 7)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
                formatter={(val: any) => [`${val}%`, 'Daily VaR Cutoff']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line type="monotone" dataKey="var250" name="250-Day Window" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="var500" name="500-Day Window" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="var750" name="750-Day Window" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Full Sample VaR & Expected Shortfall Summary Table */}
      <DataTable
        title="Full-Sample Historical VaR and Expected Shortfall"
        subtitle="Empirical loss metrics calculated from 3,461 daily observations (src/historical_var.py)"
        data={varSummary}
        columns={varColumns}
        defaultPageSize={10}
        filename="var_summary.csv"
      />
    </div>
  );
};
