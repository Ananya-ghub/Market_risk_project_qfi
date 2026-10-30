import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Search,
  CheckCircle,
  Calendar,
  DollarSign,
  BarChart2,
  PieChart
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { MetricCard } from '../components/common/MetricCard';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { fetchCsvText } from '../lib/csvLoader';
import { useRiskData } from '../context/RiskDataContext';

// Standard 50-stock mapping for S&P 500 constituents
const STOCK_INFO: Record<string, { name: string; sector: string }> = {
  AAPL: { name: 'Apple Inc.', sector: 'Information Technology' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Information Technology' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Information Technology' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  GOOGL: { name: 'Alphabet Inc. (Class A)', sector: 'Communication Services' },
  META: { name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  TSLA: { name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financials' },
  XOM: { name: 'Exxon Mobil Corporation', sector: 'Energy' },
  UNH: { name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  V: { name: 'Visa Inc.', sector: 'Financials' },
  MA: { name: 'Mastercard Incorporated', sector: 'Financials' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare' },
  PG: { name: 'Procter & Gamble Co.', sector: 'Consumer Staples' },
  HD: { name: 'The Home Depot Inc.', sector: 'Consumer Discretionary' },
  BAC: { name: 'Bank of America Corp.', sector: 'Financials' },
  ABBV: { name: 'AbbVie Inc.', sector: 'Healthcare' },
  KO: { name: 'The Coca-Cola Company', sector: 'Consumer Staples' },
  PEP: { name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
  MRK: { name: 'Merck & Co. Inc.', sector: 'Healthcare' },
  CVX: { name: 'Chevron Corporation', sector: 'Energy' },
  ADBE: { name: 'Adobe Inc.', sector: 'Information Technology' },
  CSCO: { name: 'Cisco Systems Inc.', sector: 'Information Technology' },
  CRM: { name: 'Salesforce Inc.', sector: 'Information Technology' },
  NFLX: { name: 'Netflix Inc.', sector: 'Communication Services' },
  AMD: { name: 'Advanced Micro Devices Inc.', sector: 'Information Technology' },
  MCD: { name: "McDonald's Corporation", sector: 'Consumer Discretionary' },
  WMT: { name: 'Walmart Inc.', sector: 'Consumer Staples' },
  INTC: { name: 'Intel Corporation', sector: 'Information Technology' },
  QCOM: { name: 'QUALCOMM Incorporated', sector: 'Information Technology' },
  ACN: { name: 'Accenture plc', sector: 'Information Technology' },
  TXN: { name: 'Texas Instruments Inc.', sector: 'Information Technology' },
  ABT: { name: 'Abbott Laboratories', sector: 'Healthcare' },
  LIN: { name: 'Linde plc', sector: 'Materials' },
  NKE: { name: 'NIKE Inc.', sector: 'Consumer Discretionary' },
  DHR: { name: 'Danaher Corporation', sector: 'Healthcare' },
  ORCL: { name: 'Oracle Corporation', sector: 'Information Technology' },
  UPS: { name: 'United Parcel Service Inc.', sector: 'Industrials' },
  PM: { name: 'Philip Morris International', sector: 'Consumer Staples' },
  IBM: { name: 'International Business Machines', sector: 'Information Technology' },
  HON: { name: 'Honeywell International Inc.', sector: 'Industrials' },
  AMGN: { name: 'Amgen Inc.', sector: 'Healthcare' },
  LOW: { name: "Lowe's Companies Inc.", sector: 'Consumer Discretionary' },
  CAT: { name: 'Caterpillar Inc.', sector: 'Industrials' },
  RTX: { name: 'RTX Corporation', sector: 'Industrials' },
  GS: { name: 'The Goldman Sachs Group Inc.', sector: 'Financials' },
  BLK: { name: 'BlackRock Inc.', sector: 'Financials' },
  MS: { name: 'Morgan Stanley', sector: 'Financials' },
  GE: { name: 'GE Aerospace', sector: 'Industrials' },
  T: { name: 'AT&T Inc.', sector: 'Communication Services' }
};

interface StockSummaryRow {
  ticker: string;
  name: string;
  sector: string;
  latestPrice: number;
  latestReturn: number;
  volatilityAnnualized: number;
  observations: number;
  status: string;
}

export const MarketDataPage: React.FC = () => {
  const { freshness } = useRiskData();
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [timeRange, setTimeRange] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pricesData, setPricesData] = useState<any[]>([]);
  const [returnsData, setReturnsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load clean prices and daily returns
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [pricesCsv, returnsCsv] = await Promise.all([
          fetchCsvText('/data/processed/clean_prices.csv'),
          fetchCsvText('/data/processed/daily_returns.csv')
        ]);

        Papa.parse(pricesCsv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (pResults) => {
            setPricesData(pResults.data as any[]);
          }
        });

        Papa.parse(returnsCsv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (rResults) => {
            setReturnsData(rResults.data as any[]);
          }
        });
      } catch (err: any) {
        console.error('Failed to load stock price data:', err);
        setError(err.message || 'Error loading stock prices');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Compute table of all 50 stocks
  const universeSummary = useMemo<StockSummaryRow[]>(() => {
    if (!pricesData.length || !returnsData.length) return [];

    const tickers = Object.keys(STOCK_INFO);
    const lastPriceRow = pricesData[pricesData.length - 1];
    const lastReturnRow = returnsData[returnsData.length - 1];

    return tickers.map((ticker) => {
      const info = STOCK_INFO[ticker] || { name: ticker, sector: 'Unknown' };
      const latestPrice = Number(lastPriceRow[ticker]) || 0;
      const latestReturn = (Number(lastReturnRow[ticker]) || 0) * 100;

      // Annualized volatility for this stock
      let vol = 0;
      const series = returnsData.map((r) => Number(r[ticker])).filter((v) => !isNaN(v) && isFinite(v));
      if (series.length > 1) {
        const mean = series.reduce((a, b) => a + b, 0) / series.length;
        const variance = series.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (series.length - 1);
        vol = Math.sqrt(variance) * Math.sqrt(252) * 100;
      }

      return {
        ticker,
        name: info.name,
        sector: info.sector,
        latestPrice,
        latestReturn,
        volatilityAnnualized: vol,
        observations: pricesData.length,
        status: 'Active'
      };
    });
  }, [pricesData, returnsData]);

  // Filtered universe table
  const filteredUniverse = useMemo(() => {
    if (!searchQuery.trim()) return universeSummary;
    const q = searchQuery.toLowerCase();
    return universeSummary.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );
  }, [universeSummary, searchQuery]);

  // Selected stock time series
  const selectedSeries = useMemo(() => {
    if (!pricesData.length || !returnsData.length || !selectedTicker) return [];

    let count = pricesData.length;
    if (timeRange === '1Y') count = 252;
    else if (timeRange === '3Y') count = 252 * 3;
    else if (timeRange === '5Y') count = 252 * 5;

    const slicePrices = pricesData.slice(-count);
    const sliceReturns = returnsData.slice(-count);

    // Downsample if over 300 points for smooth performance
    const step = Math.max(1, Math.floor(slicePrices.length / 300));

    const result = [];
    for (let i = 0; i < slicePrices.length; i += step) {
      const pRow = slicePrices[i];
      const rRow = sliceReturns[i];
      if (!pRow || !pRow.Date) continue;

      result.push({
        date: String(pRow.Date).split(' ')[0],
        price: Number(pRow[selectedTicker]) || 0,
        dailyReturn: rRow ? Number(((Number(rRow[selectedTicker]) || 0) * 100).toFixed(2)) : 0
      });
    }

    // Always include latest point
    const lastP = slicePrices[slicePrices.length - 1];
    const lastR = sliceReturns[sliceReturns.length - 1];
    if (lastP && lastP.Date && result[result.length - 1]?.date !== String(lastP.Date).split(' ')[0]) {
      result.push({
        date: String(lastP.Date).split(' ')[0],
        price: Number(lastP[selectedTicker]) || 0,
        dailyReturn: lastR ? Number(((Number(lastR[selectedTicker]) || 0) * 100).toFixed(2)) : 0
      });
    }

    return result;
  }, [pricesData, returnsData, selectedTicker, timeRange]);

  // Selected stock KPI stats
  const selectedStats = useMemo(() => {
    const item = universeSummary.find((s) => s.ticker === selectedTicker);
    if (!item || !pricesData.length) return null;

    const allPrices = pricesData.map((p) => Number(p[selectedTicker])).filter((v) => !isNaN(v) && v > 0);
    const maxP = Math.max(...allPrices);
    const minP = Math.min(...allPrices);

    return {
      ...item,
      allTimeHigh: maxP,
      allTimeLow: minP,
      latestDate: freshness.latest_market_observation_date || freshness.local_latest_date || '2026-10-29'
    };
  }, [universeSummary, selectedTicker, pricesData, freshness]);

  const columns: ColumnDef<StockSummaryRow>[] = [
    {
      key: 'ticker',
      header: 'Ticker',
      render: (item) => (
        <button
          onClick={() => setSelectedTicker(item.ticker)}
          className={`font-mono font-bold text-xs px-2 py-1 rounded transition-colors ${
            selectedTicker === item.ticker
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-white hover:text-teal-400'
          }`}
        >
          {item.ticker}
        </button>
      )
    },
    {
      key: 'name',
      header: 'Company Name',
      render: (item) => <span className="text-xs text-slate-300">{item.name}</span>
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (item) => (
        <span className="text-[11px] text-slate-400 bg-navy-800/80 px-2 py-0.5 rounded border border-navy-700/60">
          {item.sector}
        </span>
      )
    },
    {
      key: 'latestPrice',
      header: 'Latest Price',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-white">
          ${item.latestPrice.toFixed(2)}
        </span>
      )
    },
    {
      key: 'latestReturn',
      header: '1D Change',
      align: 'right',
      render: (item) => (
        <span
          className={`font-mono text-xs font-semibold ${
            item.latestReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {item.latestReturn >= 0 ? `+${item.latestReturn.toFixed(2)}%` : `${item.latestReturn.toFixed(2)}%`}
        </span>
      )
    },
    {
      key: 'volatilityAnnualized',
      header: 'Ann. Volatility',
      align: 'right',
      render: (item) => (
        <span className="font-mono text-xs text-amber-300">
          {item.volatilityAnnualized.toFixed(2)}%
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: () => (
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-navy-900 border border-navy-800 p-4 rounded-lg shadow-card">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Market Data Explorer — Stock Universe (50 Equities)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified adjusted historical closing prices and returns through {selectedStats?.latestDate || '2026-10-29'}.
          </p>
        </div>

        {/* Ticker selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium">Active Stock:</label>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="bg-navy-850 border border-navy-700 text-white font-mono font-bold text-xs rounded px-3 py-1.5 focus:border-teal-500 focus:outline-none"
          >
            {Object.keys(STOCK_INFO).map((t) => (
              <option key={t} value={t}>
                {t} — {STOCK_INFO[t].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards for Selected Stock */}
      {selectedStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <MetricCard
            title="Adjusted Price"
            value={`$${selectedStats.latestPrice.toFixed(2)}`}
            subValue={`Latest close (${selectedStats.latestDate})`}
            icon={DollarSign}
            variant="primary"
          />

          <MetricCard
            title="1-Day Return"
            value={`${selectedStats.latestReturn >= 0 ? '+' : ''}${selectedStats.latestReturn.toFixed(2)}%`}
            change={selectedStats.latestReturn >= 0 ? 'Gain' : 'Loss'}
            isPositive={selectedStats.latestReturn >= 0}
            icon={selectedStats.latestReturn >= 0 ? TrendingUp : TrendingDown}
            variant={selectedStats.latestReturn >= 0 ? 'positive' : 'negative'}
          />

          <MetricCard
            title="Annualized Volatility"
            value={`${selectedStats.volatilityAnnualized.toFixed(2)}%`}
            subValue="Daily σ × √252"
            icon={Activity}
            variant="warning"
          />

          <MetricCard
            title="Historical High"
            value={`$${selectedStats.allTimeHigh.toFixed(2)}`}
            subValue="Max Observed Close"
            icon={TrendingUp}
            variant="neutral"
          />

          <MetricCard
            title="Historical Low"
            value={`$${selectedStats.allTimeLow.toFixed(2)}`}
            subValue="Min Observed Close"
            icon={TrendingDown}
            variant="neutral"
          />

          <MetricCard
            title="Observations"
            value={selectedStats.observations.toLocaleString()}
            subValue="Aligned Trading Days"
            icon={Calendar}
            badge="100% CLEAN"
            variant="neutral"
          />
        </div>
      )}

      {/* Charts for Selected Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={`${selectedTicker} — Adjusted Historical Price ($)`}
          subtitle={`${STOCK_INFO[selectedTicker]?.name || selectedTicker} (${STOCK_INFO[selectedTicker]?.sector || ''})`}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          availableRanges={['1Y', '3Y', '5Y', 'ALL']}
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={selectedSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2B42" opacity={0.6} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1726',
                  borderColor: '#1B2B42',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: '#F8FAFC'
                }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Adjusted Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2DD4BF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`${selectedTicker} — Daily Percentage Return (%)`}
          subtitle="Observed daily simple price change distribution"
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          availableRanges={['1Y', '3Y', '5Y', 'ALL']}
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={selectedSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2B42" opacity={0.6} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1726',
                  borderColor: '#1B2B42',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: '#F8FAFC'
                }}
                formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Daily Return']}
              />
              <Bar
                dataKey="dailyReturn"
                fill="#60A5FA"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Universe Overview Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Configured 50-Equity Universe Summary
            </h3>
            <p className="text-xs text-slate-400">
              Equal-weighted reference portfolio constituents (2.00% target weight each).
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker, name, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-900 border border-navy-750 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <DataTable
          data={filteredUniverse}
          columns={columns}
          defaultPageSize={10}
          searchPlaceholder="Search ticker, name, or sector..."
        />
      </div>
    </div>
  );
};
