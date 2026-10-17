import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { SeverityBadge } from '../components/common/StatusBadge';
import { StressTestItem } from '../types/risk';
import { Flame, ShieldAlert, AlertTriangle, Calculator, DollarSign, Layers } from 'lucide-react';

export const StressTestingPage: React.FC = () => {
  const { stressTests, baselineRisk, metrics } = useRiskData();

  // Interactive custom scenario calculator state
  const [customMarketShock, setCustomMarketShock] = useState<number>(-12);
  const [customVolMultiplier, setCustomVolMultiplier] = useState<number>(1.5);

  // Calculate hypothetical client-side shock
  const hypotheticalResult = useMemo(() => {
    const baseValue = metrics?.latestValue || 100000;
    const histVar99 = baselineRisk?.historical_var_99 || 0.0305;
    const shockDecimal = customMarketShock / 100;
    const volAdjustment = -(customVolMultiplier - 1) * histVar99;
    const totalShock = shockDecimal + volAdjustment;
    const dollarLoss = Math.abs(totalShock) * baseValue;
    const remainingValue = Math.max(0, baseValue * (1 + totalShock));

    return {
      baseValue,
      totalShockPct: (totalShock * 100).toFixed(2),
      dollarLoss: Math.round(dollarLoss),
      remainingValue: Math.round(remainingValue)
    };
  }, [customMarketShock, customVolMultiplier, baselineRisk, metrics]);

  // Chart data for stress scenarios sorted by loss severity
  const chartData = useMemo(() => {
    return [...stressTests]
      .sort((a, b) => b.loss_as_pct_initial - a.loss_as_pct_initial)
      .map((s) => ({
        scenario: s.scenario,
        lossPct: Number((s.loss_as_pct_initial * 100).toFixed(2)),
        lossDollars: Math.round(s.stressed_loss_dollars),
        remainingValue: Math.round(s.stressed_portfolio_value)
      }));
  }, [stressTests]);

  const columns: ColumnDef<StressTestItem>[] = [
    {
      key: 'scenario',
      header: 'Stress Scenario Name',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-white">{r.scenario}</span>
          <p className="text-[10px] text-slate-400 font-sans mt-0.5">{r.description}</p>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Classification',
      render: (r) => (
        <span className="rounded bg-navy-900 border border-navy-750 px-2 py-0.5 text-[10px] font-mono text-slate-300">
          {r.type}
        </span>
      )
    },
    {
      key: 'loss_as_pct_initial',
      header: 'Portfolio Loss (%)',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="font-bold text-rose-400 font-mono">
          -{(r.loss_as_pct_initial * 100).toFixed(2)}%
        </span>
      )
    },
    {
      key: 'stressed_loss_dollars',
      header: 'Loss ($ on $100k)',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="text-rose-300 font-mono font-semibold">
          -${Math.round(r.stressed_loss_dollars).toLocaleString()}
        </span>
      )
    },
    {
      key: 'stressed_portfolio_value',
      header: 'Stressed Capital Value',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="text-slate-200 font-mono">
          ${Math.round(r.stressed_portfolio_value).toLocaleString()}
        </span>
      )
    },
    {
      key: 'loss_rank',
      header: 'Severity Rank',
      align: 'center',
      render: (r) => <SeverityBadge pctLoss={r.loss_as_pct_initial} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Baseline Risk Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Baseline Capital Basis"
          value={`$${baselineRisk ? baselineRisk.initial_investment.toLocaleString() : '100,000'}`}
          subValue="Stress Testing Starting Capital"
          icon={DollarSign}
        />
        <MetricCard
          title="Baseline Daily Volatility"
          value={`${baselineRisk ? (baselineRisk.daily_volatility * 100).toFixed(2) : '1.08'}%`}
          subValue="17.07% Annualized Volatility"
          icon={Layers}
          variant="warning"
        />
        <MetricCard
          title="Baseline 99% VaR"
          value={`${baselineRisk ? (baselineRisk.historical_var_99 * 100).toFixed(2) : '3.05'}%`}
          subValue={`$${baselineRisk ? Math.round(baselineRisk.historical_var_99_dollars).toLocaleString() : '3,049'} (1-Day)`}
          icon={ShieldAlert}
          variant="negative"
        />
        <MetricCard
          title="Baseline 99% Expected Shortfall"
          value={`${baselineRisk ? (baselineRisk.historical_es_99 * 100).toFixed(2) : '4.41'}%`}
          subValue={`$${baselineRisk ? Math.round(baselineRisk.historical_es_99_dollars).toLocaleString() : '4,408'} (Tail Mean)`}
          icon={Flame}
          variant="negative"
        />
      </div>

      {/* Stress Loss Waterfall Chart */}
      <ChartCard
        title="Portfolio Capital Losses Across Stressed Market Scenarios"
        subtitle="Ranked drawdown impact from outputs/phase10/stress_test_results.csv"
        badge="TAIL RISK SHOCKS"
        height="h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
            <XAxis
              dataKey="scenario"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
              formatter={(val: any, _, props: any) => [
                `-${val}% ($${props.payload.lossDollars.toLocaleString()} loss)`,
                'Stressed Portfolio Impact'
              ]}
            />
            <Bar
              dataKey="lossPct"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.lossPct >= 20 ? '#ef4444' : payload.lossPct >= 10 ? '#f59e0b' : '#38bdf8';
                return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Interactive Hypothetical Scenario Calculator */}
      <div className="rounded-lg border border-teal-500/30 bg-navy-850 p-5 shadow-card">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-teal-400" />
            <div>
              <h3 className="font-semibold text-sm text-white">Hypothetical Client-Side Stress Calculator</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                [Client-Side Simulator: Evaluates hypothetical shocks on live capital without modifying the Python backend]
              </p>
            </div>
          </div>
          <span className="rounded bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 text-[10px] font-mono text-teal-300">
            INTERACTIVE SIMULATION
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Direct Market Decline:</span>
                <span className="font-bold text-rose-400">{customMarketShock}%</span>
              </div>
              <input
                type="range"
                min="-40"
                max="0"
                step="1"
                value={customMarketShock}
                onChange={(e) => setCustomMarketShock(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>0% (Flat)</span>
                <span>-20% (Crash)</span>
                <span>-40% (2008 Lehman)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Volatility Surge Multiplier:</span>
                <span className="font-bold text-amber-400">{customVolMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.25"
                value={customVolMultiplier}
                onChange={(e) => setCustomVolMultiplier(Number(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                <span>1.0x (Normal)</span>
                <span>2.0x (Double Vol)</span>
                <span>4.0x (VIX Spike &gt; 80)</span>
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 rounded-lg border border-navy-750 bg-navy-900/80 p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div className="rounded bg-navy-850 p-3 border border-navy-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Shock Rate</span>
              <p className="text-xl font-bold font-mono text-rose-400 mt-1">{hypotheticalResult.totalShockPct}%</p>
              <span className="text-[10px] text-slate-500 font-mono">Market + Vol Shock</span>
            </div>

            <div className="rounded bg-navy-850 p-3 border border-navy-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Estimated Dollar Loss</span>
              <p className="text-xl font-bold font-mono text-rose-300 mt-1">-${hypotheticalResult.dollarLoss.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-mono">On Latest Portfolio MTM</span>
            </div>

            <div className="rounded bg-navy-850 p-3 border border-navy-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Post-Stress Value</span>
              <p className="text-xl font-bold font-mono text-teal-300 mt-1">${hypotheticalResult.remainingValue.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-mono">Preserved Capital</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Scenarios Table */}
      <DataTable
        title="Stress Testing Scenario Impact Analysis"
        subtitle="Historical volatility-adjusted shocks and illustrative sector declines from outputs/phase10/stress_test_results.csv"
        data={stressTests}
        columns={columns}
        defaultPageSize={10}
        filename="stress_test_results.csv"
      />
    </div>
  );
};
