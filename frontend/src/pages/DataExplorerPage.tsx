import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Database, Download, Search, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { MetricCard } from '../components/common/MetricCard';

interface DatasetMeta {
  id: string;
  name: string;
  path: string;
  category: string;
  description: string;
}

const availableDatasets: DatasetMeta[] = [
  { id: 'port_val', name: 'portfolio_value.csv', path: '/data/processed/portfolio_value.csv', category: 'Portfolio', description: 'Daily compounded portfolio capital valuation ($100k start)' },
  { id: 'port_ret', name: 'portfolio_returns.csv', path: '/data/processed/portfolio_returns.csv', category: 'Portfolio', description: 'Daily equal-weighted portfolio return series' },
  { id: 'port_pnl', name: 'portfolio_pnl.csv', path: '/data/processed/portfolio_pnl.csv', category: 'Portfolio', description: 'Daily dollar profit and loss from valuation changes' },
  { id: 'port_wgt', name: 'portfolio_weights.csv', path: '/data/processed/portfolio_weights.csv', category: 'Portfolio', description: '50-stock portfolio weighting vector (1/N = 2.0% each)' },
  { id: 'clean_prc', name: 'clean_prices.csv', path: '/data/processed/clean_prices.csv', category: 'Cleaned Prices', description: 'Cleaned adjusted close prices for 50 equities (2013-2026)' },
  { id: 'daily_ret', name: 'daily_returns.csv', path: '/data/processed/daily_returns.csv', category: 'Returns', description: 'Percentage return matrix across all 50 constituent equities' },
  { id: 'log_ret', name: 'log_returns.csv', path: '/data/processed/log_returns.csv', category: 'Returns', description: 'Continuous log return matrix for statistical stability' },
  { id: 'var_sum', name: 'var_summary.csv', path: '/outputs/phase4/var_summary.csv', category: 'Phase 4 - Historical VaR', description: 'Full-sample Historical VaR and Expected Shortfall at 95%, 99%, 99.5%' },
  { id: 'roll_var', name: 'rolling_var.csv', path: '/outputs/phase4/rolling_var.csv', category: 'Phase 4 - Historical VaR', description: 'Rolling VaR and ES across 250, 500, and 750-day windows' },
  { id: 'ewma_res', name: 'ewma_results.csv', path: '/outputs/phase5/ewma_results.csv', category: 'Phase 5 - EWMA', description: 'Daily EWMA volatility, standardized returns, and scaled VaR/ES' },
  { id: 'ewma_hist', name: 'ewma_vs_historical.csv', path: '/outputs/phase5/ewma_vs_historical.csv', category: 'Phase 5 - EWMA', description: 'EWMA volatility-scaled VaR aligned with rolling Historical VaR' },
  { id: 'garch_par', name: 'garch_parameters.csv', path: '/outputs/phase6/garch_parameters.csv', category: 'Phase 6 - GARCH', description: 'Fitted MLE parameters: mu, omega, alpha, beta, and nu (Student-t DoF)' },
  { id: 'garch_res', name: 'garch_results.csv', path: '/outputs/phase6/garch_results.csv', category: 'Phase 6 - GARCH', description: 'Conditional volatility, one-step forecasts, and GARCH VaR/ES cutoffs' },
  { id: 'gjr_par', name: 'gjr_garch_parameters.csv', path: '/outputs/phase7/gjr_garch_parameters.csv', category: 'Phase 7 - GJR-GARCH', description: 'Fitted GJR parameters including asymmetric leverage coefficient gamma' },
  { id: 'gjr_res', name: 'gjr_garch_results.csv', path: '/outputs/phase7/gjr_garch_results.csv', category: 'Phase 7 - GJR-GARCH', description: 'Asymmetric conditional volatility and scaled VaR/ES time series' },
  { id: 'back_sum', name: 'backtesting_summary.csv', path: '/outputs/phase8/backtesting', description: 'Kupiec POF and Christoffersen independence backtest statistics', category: 'Phase 8 - Backtesting' },
  { id: 'exc_ser', name: 'exception_series.csv', path: '/outputs/phase8/exception_series.csv', category: 'Phase 8 - Backtesting', description: 'Daily binary exception indicators (1 = breach, 0 = non-breach)' },
  { id: 'mod_comp', name: 'model_comparison.csv', path: '/outputs/phase9/model_comparison.csv', category: 'Phase 9 - Comparison', description: 'Unified comparison matrix across Historical, EWMA, GARCH, and GJR-GARCH' },
  { id: 'base_risk', name: 'baseline_risk.csv', path: '/outputs/phase10/baseline_risk.csv', category: 'Phase 10 - Stress Testing', description: 'Baseline portfolio covariance volatility, 99% VaR, and 99% ES' },
  { id: 'stress_res', name: 'stress_test_results.csv', path: '/outputs/phase10/stress_test_results.csv', category: 'Phase 10 - Stress Testing', description: 'Macro crash shocks, volatility spikes, and sector stress test impacts' },
];

export const DataExplorerPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('port_val');
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedMeta = availableDatasets.find((d) => d.id === selectedId) || availableDatasets[0];

  useEffect(() => {
    async function loadDataset() {
      setLoading(true);
      setError(null);
      try {
        let fetchUrl = selectedMeta.path;
        if (!fetchUrl.endsWith('.csv')) fetchUrl += '.csv';

        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Dataset not found at ${fetchUrl}`);
        const text = await res.text();

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data.length > 0) {
              setColumns(results.meta.fields || Object.keys(results.data[0] as object));
              setRawData(results.data as any[]);
            } else {
              setRawData([]);
              setColumns([]);
            }
            setLoading(false);
          },
          error: (err: any) => {
            setError(err.message);
            setLoading(false);
          }
        });
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadDataset();
  }, [selectedId, selectedMeta]);

  // Table columns definition
  const tableColumns: ColumnDef<any>[] = useMemo(() => {
    return columns.map((col) => ({
      key: col,
      header: col,
      sortable: true,
      render: (row) => {
        const val = row[col];
        if (val === null || val === undefined) return <span className="text-slate-600">-</span>;
        if (typeof val === 'number') {
          return <span className="font-mono text-slate-200">{Number(val.toFixed(6))}</span>;
        }
        return <span className="text-slate-200">{String(val)}</span>;
      }
    }));
  }, [columns]);

  // Compute dataset diagnostics
  const diagnostics = useMemo(() => {
    if (!rawData.length) return null;
    const rowCount = rawData.length;
    const colCount = columns.length;
    let dateRange = 'N/A';

    const dateCol = columns.find((c) => c.toLowerCase() === 'date');
    if (dateCol) {
      dateRange = `${rawData[0][dateCol]} to ${rawData[rowCount - 1][dateCol]}`;
    }

    return {
      rowCount,
      colCount,
      dateRange
    };
  }, [rawData, columns]);

  return (
    <div className="space-y-6">
      {/* Header Selector & Metadata */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/30">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Dataset Explorer & Schema Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Browse, search, and export 20 real CSV datasets across the data/ and outputs/ directories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Dataset:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-md border border-navy-700 bg-navy-900 px-3 py-1.5 text-xs font-mono font-medium text-teal-300 focus:border-teal-500 focus:outline-none"
            >
              {availableDatasets.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.category}] {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Dataset Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs font-mono">
          <div className="rounded bg-navy-900 p-2.5 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase">Dataset Name</span>
            <p className="font-bold text-white truncate mt-0.5">{selectedMeta.name}</p>
          </div>
          <div className="rounded bg-navy-900 p-2.5 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase">Total Records</span>
            <p className="font-bold text-teal-400 mt-0.5">{diagnostics ? `${diagnostics.rowCount.toLocaleString()} Rows` : '...'}</p>
          </div>
          <div className="rounded bg-navy-900 p-2.5 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase">Column Fields</span>
            <p className="font-bold text-sky-400 mt-0.5">{diagnostics ? `${diagnostics.colCount} Columns` : '...'}</p>
          </div>
          <div className="rounded bg-navy-900 p-2.5 border border-navy-800">
            <span className="text-[10px] text-slate-500 uppercase">Observation Span</span>
            <p className="font-bold text-amber-300 truncate mt-0.5">{diagnostics?.dateRange || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Dataset Grid View */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-navy-800 bg-navy-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
          <span className="text-xs text-slate-400 font-mono">Streaming & parsing {selectedMeta.name}...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-6 text-center text-xs text-rose-300">
          <AlertCircle className="mx-auto h-6 w-6 text-rose-400 mb-2" />
          Failed to load dataset: {error}
        </div>
      ) : (
        <DataTable
          title={`${selectedMeta.name} — Interactive Preview`}
          subtitle={selectedMeta.description}
          data={rawData}
          columns={tableColumns}
          searchPlaceholder={`Search within ${selectedMeta.name}...`}
          defaultPageSize={15}
          filename={selectedMeta.name}
        />
      )}
    </div>
  );
};
