import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ModelComparisonItem } from '../types/risk';
import { GitCompare, AlertTriangle, Layers, Activity, Cpu, ShieldCheck } from 'lucide-react';

export const ModelComparisonPage: React.FC = () => {
  const { modelComparison } = useRiskData();
  const [selectedConfidence, setSelectedConfidence] = useState<number>(0.99);

  const filteredComparison = useMemo(() => {
    return modelComparison.filter((m) => Math.abs(m.confidence - selectedConfidence) < 0.001);
  }, [modelComparison, selectedConfidence]);

  // Bar chart comparing Average VaR vs Average ES across models
  const avgRiskChartData = useMemo(() => {
    return filteredComparison.map((m) => ({
      model: m.model,
      avgVarPct: Number((m.average_VaR * 100).toFixed(2)),
      avgEsPct: Number((m.average_ES * 100).toFixed(2)),
      varStdPct: Number((m.VaR_std * 100).toFixed(2))
    }));
  }, [filteredComparison]);

  const columns: ColumnDef<ModelComparisonItem>[] = [
    { key: 'model', header: 'Risk Model', sortable: true, render: (r) => <span className="font-bold text-white">{r.model}</span> },
    { key: 'observations', header: 'Sample Days', align: 'right', sortable: true, render: (r) => r.observations.toLocaleString() },
    {
      key: 'exceptions',
      header: 'Exceptions (Breaches)',
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
      header: 'Failure Rate',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className={r.exception_rate > 1 - r.confidence ? 'text-rose-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold'}>
          {(r.exception_rate * 100).toFixed(2)}%
        </span>
      )
    },
    {
      key: 'average_VaR',
      header: 'Average VaR (%)',
      align: 'right',
      sortable: true,
      render: (r) => <span className="text-sky-300 font-mono font-semibold">{(r.average_VaR * 100).toFixed(2)}%</span>
    },
    {
      key: 'average_ES',
      header: 'Average ES (%)',
      align: 'right',
      sortable: true,
      render: (r) => <span className="text-rose-400 font-mono font-semibold">{(r.average_ES * 100).toFixed(2)}%</span>
    },
    {
      key: 'VaR_std',
      header: 'VaR Dynamism (Std %)',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="text-slate-300 font-mono">
          {(r.VaR_std * 100).toFixed(2)}%
        </span>
      )
    },
    {
      key: 'worst_daily_loss',
      header: 'Worst Realized Loss',
      align: 'right',
      render: (r) => <span className="text-rose-400 font-mono">-{(r.worst_daily_loss * 100).toFixed(2)}%</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Confidence Level Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-navy-700 bg-navy-850 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400 border border-teal-500/20">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Select Risk Threshold for Model Evaluation</h3>
            <p className="text-xs text-slate-400">
              Evaluated across 2,711 post-warmup synchronized trading sessions (2016 – 2026)
            </p>
          </div>
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
              {(lvl * 100).toFixed(1)}% Confidence
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Average VaR vs Average ES */}
        <ChartCard
          title={`Average VaR and Expected Shortfall (${(selectedConfidence * 100).toFixed(1)}% Confidence)`}
          subtitle="Mean capital buffer required under each quantitative methodology"
          badge="CAPITAL EFFICIENCY"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgRiskChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis dataKey="model" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="avgVarPct" name="Average VaR (%)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgEsPct" name="Average Expected Shortfall (%)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* VaR Forecast Responsiveness (Standard Deviation of Forecasts) */}
        <ChartCard
          title="VaR Responsiveness to Volatility Regimes"
          subtitle="Standard deviation of daily VaR forecasts (dynamism vs sluggishness)"
          badge="FORECAST DYNAMISM"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgRiskChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis dataKey="model" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
              />
              <Bar dataKey="varStdPct" name="VaR Standard Deviation (%)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Model Selection Governance Warning */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 space-y-1.5">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Institutional Model Selection & Trade-Off Analysis
            </h4>
            <p>
              No single risk model universally dominates all market regimes. While <strong>GJR-GARCH</strong> delivers the
              highest responsiveness in market panics by incorporating the asymmetric leverage effect, <strong>Historical Simulation</strong>{' '}
              requires zero parametric assumptions and is immune to distribution mis-specification.
            </p>
            <p className="text-slate-400">
              In institutional practice, risk managers do not discard models based on a single statistical metric; rather,
              they employ an ensemble framework where GARCH provides daily dynamic margin alerts while Historical Simulation
              serves as an unmodeled empirical benchmark.
            </p>
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <DataTable
        title={`Comprehensive Risk Model Comparison (${(selectedConfidence * 100).toFixed(1)}% Confidence)`}
        subtitle="Empirical performance metrics from outputs/phase9/model_comparison.csv"
        data={filteredComparison}
        columns={columns}
        defaultPageSize={10}
        filename={`model_comparison_${(selectedConfidence * 100).toFixed(0)}.csv`}
      />
    </div>
  );
};
