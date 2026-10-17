import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { TestStatusBadge } from '../components/common/StatusBadge';
import { BacktestSummaryItem } from '../types/risk';
import { CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Activity } from 'lucide-react';

export const BacktestingPage: React.FC = () => {
  const { backtestSummary, exceptionSeries } = useRiskData();
  const [selectedConfidence, setSelectedConfidence] = useState<number>(0.99);

  // Filter backtest summary by selected confidence
  const filteredSummary = useMemo(() => {
    return backtestSummary.filter((b) => Math.abs(b.confidence - selectedConfidence) < 0.001);
  }, [backtestSummary, selectedConfidence]);

  // Chart data comparing exception count vs expected
  const exceptionComparisonChartData = useMemo(() => {
    return filteredSummary.map((b) => ({
      model: b.model,
      actualExceptions: b.exceptions,
      expectedExceptions: Number(b.expected_exceptions.toFixed(1)),
      exceptionRate: Number((b.exception_rate * 100).toFixed(2)),
      targetRate: Number(((1 - b.confidence) * 100).toFixed(2))
    }));
  }, [filteredSummary]);

  // Table columns
  const columns: ColumnDef<BacktestSummaryItem>[] = [
    { key: 'model', header: 'Risk Model', sortable: true, render: (r) => <span className="font-bold text-white">{r.model}</span> },
    { key: 'observations', header: 'Obs (Days)', align: 'right', sortable: true, render: (r) => r.observations.toLocaleString() },
    {
      key: 'exceptions',
      header: 'Actual / Expected Exceptions',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span>
          <strong className="text-white">{r.exceptions}</strong>
          <span className="text-slate-500 text-[11px]"> / {r.expected_exceptions.toFixed(1)}</span>
        </span>
      )
    },
    {
      key: 'exception_rate',
      header: 'Exception Rate vs Target',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="font-mono">
          <span className={r.exception_rate > 1 - r.confidence ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {(r.exception_rate * 100).toFixed(2)}%
          </span>
          <span className="text-slate-500 text-[10px]"> (Target: {((1 - r.confidence) * 100).toFixed(1)}%)</span>
        </span>
      )
    },
    {
      key: 'kupiec_p_value',
      header: 'Kupiec POF (p-value)',
      align: 'center',
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-center gap-0.5">
          <TestStatusBadge passed={r.kupiec_pass_5pct} />
          <span className="text-[10px] text-slate-400 font-mono">p = {r.kupiec_p_value.toFixed(4)}</span>
        </div>
      )
    },
    {
      key: 'independence_p_value',
      header: 'Christoffersen Indep. (p-value)',
      align: 'center',
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-center gap-0.5">
          <TestStatusBadge passed={r.independence_pass_5pct} />
          <span className="text-[10px] text-slate-400 font-mono">p = {r.independence_p_value.toFixed(4)}</span>
        </div>
      )
    },
    {
      key: 'conditional_coverage_p_value',
      header: 'Conditional Coverage (p-value)',
      align: 'center',
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-center gap-0.5">
          <TestStatusBadge passed={r.conditional_coverage_pass_5pct} />
          <span className="text-[10px] text-slate-400 font-mono">p = {r.conditional_coverage_p_value.toFixed(4)}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Confidence Level Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-navy-700 bg-navy-850 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Select Regulatory Confidence Level</h3>
          <p className="text-xs text-slate-400">
            Compare model validity at Basel II/III 99% regulatory benchmark or alternative confidence cutoffs
          </p>
        </div>

        <div className="flex gap-1.5 rounded-md bg-navy-900 p-1 border border-navy-750">
          {[0.95, 0.99, 0.995].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedConfidence(lvl)}
              className={`rounded px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                selectedConfidence === lvl
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {(lvl * 100).toFixed(1)}% Confidence (α = {((1 - lvl) * 100).toFixed(1)}%)
            </button>
          ))}
        </div>
      </div>

      {/* Exception Counts Bar Chart */}
      <ChartCard
        title={`Actual vs. Expected VaR Exceptions (${(selectedConfidence * 100).toFixed(1)}% Confidence)`}
        subtitle="Evaluation of breach frequency against theoretical target over the evaluation sample"
        badge="STATISTICAL ACCURACY"
        height="h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={exceptionComparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
            <XAxis dataKey="model" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar dataKey="actualExceptions" name="Actual Exceptions (Breaches)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expectedExceptions" name="Expected Exceptions (Theory)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Formal Statistical Test Descriptions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center gap-2 text-teal-400 border-b border-navy-800 pb-2">
            <CheckCircle2 className="h-4 w-4" />
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Kupiec POF Test</h4>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Tests <strong>Unconditional Coverage</strong>: whether the empirical failure rate p̂ = x / N equals the
            theoretical rate p = (1 - α). Evaluated via Likelihood Ratio test asymptotically distributed as χ²(1).
          </p>
          <div className="mt-3 rounded bg-navy-900 p-2 font-mono text-[10px] text-slate-400 border border-navy-800">
            H₀: E[x / N] = 1 - α (Correct Exception Count)
          </div>
        </div>

        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center gap-2 text-amber-400 border-b border-navy-800 pb-2">
            <Activity className="h-4 w-4" />
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Christoffersen Independence</h4>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Tests whether exceptions are <strong>serially independent</strong> or cluster in crisis periods. A 2-state
            Markov chain evaluates transition probabilities P(breach | breach yesterday). χ²(1) distribution.
          </p>
          <div className="mt-3 rounded bg-navy-900 p-2 font-mono text-[10px] text-slate-400 border border-navy-800">
            H₀: Exceptions are i.i.d. (No Clustering)
          </div>
        </div>

        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center gap-2 text-sky-400 border-b border-navy-800 pb-2">
            <ShieldCheck className="h-4 w-4" />
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">Conditional Coverage</h4>
          </div>
          <p className="mt-2 text-xs text-slate-300 leading-relaxed">
            Joint test combining both coverage and independence: <code className="text-teal-300">LR_cc = LR_uc + LR_ind</code>.
            Asymptotically distributed as χ²(2). The gold standard for regulatory model validation.
          </p>
          <div className="mt-3 rounded bg-navy-900 p-2 font-mono text-[10px] text-slate-400 border border-navy-800">
            H₀: Model has correct count AND no clustering
          </div>
        </div>
      </div>

      {/* Backtesting Results Table */}
      <DataTable
        title={`Backtesting Statistical Results Table (${(selectedConfidence * 100).toFixed(1)}% Confidence)`}
        subtitle="Kupiec, Christoffersen, and Conditional Coverage test metrics from outputs/phase8/backtesting_summary.csv"
        data={filteredSummary}
        columns={columns}
        defaultPageSize={10}
        filename={`backtesting_summary_${(selectedConfidence * 100).toFixed(0)}.csv`}
      />
    </div>
  );
};
