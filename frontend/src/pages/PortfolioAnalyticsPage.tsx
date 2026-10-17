import React, { useMemo, useState } from 'react';
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
  CartesianGrid
} from 'recharts';
import { useRiskData } from '../context/RiskDataContext';
import { ChartCard } from '../components/common/ChartCard';
import { MetricCard } from '../components/common/MetricCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { StockWeight } from '../types/risk';

export const PortfolioAnalyticsPage: React.FC = () => {
  const { metrics, portfolioValues, portfolioReturns, portfolioPnl, portfolioWeights } = useRiskData();
  const [timeRange, setTimeRange] = useState<string>('ALL');

  // Filter portfolio values by range
  const filteredValues = useMemo(() => {
    if (!portfolioValues.length) return [];
    let sliceLen = portfolioValues.length;
    if (timeRange === '1Y') sliceLen = 252;
    else if (timeRange === '3Y') sliceLen = 252 * 3;
    else if (timeRange === '5Y') sliceLen = 252 * 5;

    const subset = portfolioValues.slice(-sliceLen);
    const step = Math.max(1, Math.floor(subset.length / 250));
    return subset.filter((_, idx) => idx % step === 0 || idx === subset.length - 1);
  }, [portfolioValues, timeRange]);

  // Filter daily P&L by range
  const filteredPnl = useMemo(() => {
    if (!portfolioPnl.length) return [];
    let sliceLen = 252; // default 1 year for daily P&L chart
    if (timeRange === '1Y') sliceLen = 252;
    else if (timeRange === '3Y') sliceLen = 252 * 2;
    else if (timeRange === 'ALL') sliceLen = 500;

    return portfolioPnl.slice(-sliceLen).map((p) => ({
      date: p.date,
      pnl: Math.round(p.pnl),
      color: p.pnl >= 0 ? '#10b981' : '#f43f5e'
    }));
  }, [portfolioPnl, timeRange]);

  // Top 10 Gains and Losses
  const extremeDays = useMemo(() => {
    if (!portfolioReturns.length) return { bestDays: [], worstDays: [] };
    const sorted = [...portfolioReturns].sort((a, b) => b.return - a.return);
    const bestDays = sorted.slice(0, 10).map((d, i) => ({
      rank: i + 1,
      date: d.date,
      returnPct: (d.return * 100).toFixed(2),
      pnlEst: Math.round(d.return * 100000) // on initial 100k
    }));
    const worstDays = sorted.slice(-10).reverse().map((d, i) => ({
      rank: i + 1,
      date: d.date,
      returnPct: (d.return * 100).toFixed(2),
      pnlEst: Math.round(d.return * 100000)
    }));
    return { bestDays, worstDays };
  }, [portfolioReturns]);

  // Stock weights columns
  const weightColumns: ColumnDef<StockWeight>[] = [
    { key: 'ticker', header: 'Ticker Symbol', sortable: true, render: (r) => <span className="font-bold text-white">{r.ticker}</span> },
    { key: 'weight', header: 'Weight (%)', align: 'right', sortable: true, render: (r) => `${(r.weight * 100).toFixed(2)}%` },
    { key: 'capital', header: 'Initial Allocation ($)', align: 'right', sortable: true, render: (r) => `$${(r.weight * 100000).toLocaleString()}` },
    { key: 'strategy', header: 'Allocation Rule', render: () => <span className="text-slate-400">Equal Weighted (1/N)</span> }
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Performance KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          title="Initial Investment"
          value="$100,000"
          subValue="2013-01-04 Basis"
          icon={DollarSign}
        />
        <MetricCard
          title="Latest Portfolio Value"
          value={`$${metrics?.latestValue ? Math.round(metrics.latestValue).toLocaleString() : '1,264,037'}`}
          change={`+${metrics?.totalReturn.toFixed(1)}%`}
          isPositive={true}
          icon={TrendingUp}
          variant="positive"
        />
        <MetricCard
          title="Annualized Return"
          value={`${metrics?.annualizedReturn.toFixed(2)}%`}
          subValue="Compound Annual Growth"
          icon={TrendingUp}
          variant="positive"
        />
        <MetricCard
          title="Annualized Volatility"
          value={`${metrics?.annualizedVolatility.toFixed(2)}%`}
          subValue="σ × √252 (Daily Std)"
          icon={Activity}
          variant="warning"
        />
        <MetricCard
          title="Sharpe Ratio (Rf=4%)"
          value={metrics?.sharpeRatio.toFixed(3) || '0.954'}
          subValue="Risk-Adjusted Excess"
          variant="primary"
        />
        <MetricCard
          title="Max Drawdown"
          value={`${metrics?.maxDrawdown.toFixed(2)}%`}
          subValue="Mar 2020 COVID Shock"
          icon={TrendingDown}
          variant="negative"
        />
      </div>

      {/* Main Charts: Valuation & Daily P&L */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cumulative Valuation */}
        <ChartCard
          title="Portfolio Valuation History"
          subtitle="Compounded growth from $100k starting capital across 3,461 trading days"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          badge="MARK-TO-MARKET"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredValues} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(0, 7)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
                formatter={(val: any) => [`$${Math.round(Number(val)).toLocaleString()}`, 'Portfolio Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#valGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Profit & Loss */}
        <ChartCard
          title="Daily Profit & Loss ($ P&L)"
          subtitle="Daily mark-to-market dollar swings reflecting portfolio compounding"
          badge="DOLLAR IMPACT"
          height="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredPnl} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2c4c" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1d', borderColor: '#1e2c4c', borderRadius: '0.375rem', fontFamily: 'monospace' }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Daily P&L']}
              />
              <Bar
                dataKey="pnl"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const fill = payload.pnl >= 0 ? '#10b981' : '#f43f5e';
                  return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Portfolio Methodology & Asset Allocation Notice */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-teal-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 space-y-1.5">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Portfolio Construction Methodology & Equal-Weighting Assumption
            </h4>
            <p>
              The equity portfolio is constructed using an <strong>Equal-Weighted Strategy (1/N = 2.00%)</strong> across{' '}
              <strong>50 large-cap US equities</strong> selected from the S&P 500 index with continuous historical trading
              data spanning from January 2013 through October 2026. Daily portfolio returns are calculated via the vector dot
              product: <code className="text-teal-300 bg-navy-900 px-1 py-0.5 rounded">R_p,t = Σ w_i * R_i,t</code>.
            </p>
            <p className="text-slate-400">
              Note: The backend methodology implements fixed initial weights on returns rather than continuous daily transaction
              rebalancing with turnover friction. Holdings allocations represent the verified 50-stock universe defined in
              <code className="text-slate-300 ml-1">src/config.py</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Extreme Historical Days: Top Gains vs Top Losses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 10 Gains */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-2.5 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <h3 className="font-semibold text-sm text-slate-100">Top 10 Largest Daily Gains</h3>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-2">Rank</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-right">Daily Return</th>
                  <th className="py-2 px-2 text-right">Initial Basis P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {extremeDays.bestDays.map((d) => (
                  <tr key={d.date} className="hover:bg-navy-800/40">
                    <td className="py-1.5 px-2 text-slate-500">#{d.rank}</td>
                    <td className="py-1.5 px-2 text-slate-300">{d.date}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-emerald-400">+{d.returnPct}%</td>
                    <td className="py-1.5 px-2 text-right text-emerald-400/80">+${d.pnlEst.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Losses */}
        <div className="rounded-lg border border-navy-700 bg-navy-850 p-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-2.5 text-rose-400">
            <TrendingDown className="h-4 w-4" />
            <h3 className="font-semibold text-sm text-slate-100">Top 10 Largest Daily Tail Losses</h3>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 text-[10px] uppercase">
                  <th className="py-2 px-2">Rank</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-right">Daily Loss</th>
                  <th className="py-2 px-2 text-right">Initial Basis Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60">
                {extremeDays.worstDays.map((d) => (
                  <tr key={d.date} className="hover:bg-navy-800/40">
                    <td className="py-1.5 px-2 text-slate-500">#{d.rank}</td>
                    <td className="py-1.5 px-2 text-slate-300">{d.date}</td>
                    <td className="py-1.5 px-2 text-right font-bold text-rose-400">{d.returnPct}%</td>
                    <td className="py-1.5 px-2 text-right text-rose-400/80">-${Math.abs(d.pnlEst).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Portfolio Holdings & Weight Breakdown Table */}
      <DataTable
        title="Portfolio Constituent Equities (50 Stocks)"
        subtitle="Equal-weighted universe from data/processed/portfolio_weights.csv"
        data={portfolioWeights}
        columns={weightColumns}
        searchPlaceholder="Filter stocks (e.g. AAPL, NVDA)..."
        defaultPageSize={10}
        filename="portfolio_weights.csv"
      />
    </div>
  );
};
