import React, { useState } from 'react';
import { useRiskData } from '../context/RiskDataContext';
import { Settings, RefreshCw, Database, CheckCircle2, Sliders, Monitor, Shield, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, freshness, refreshing, triggerRefresh, metrics } = useRiskData();
  const [saveToast, setSaveToast] = useState(false);

  const handleConfidenceChange = (val: 0.95 | 0.99 | 0.995) => {
    updateSettings({ confidenceLevel: val });
    showToast();
  };

  const handleRangeChange = (val: '1Y' | '3Y' | '5Y' | 'ALL') => {
    updateSettings({ chartTimeRange: val });
    showToast();
  };

  const handleDensityChange = (val: 'compact' | 'comfortable') => {
    updateSettings({ tableDensity: val });
    showToast();
  };

  const handleThemeChange = (val: 'dark-navy' | 'dark-slate' | 'terminal') => {
    updateSettings({ theme: val });
    showToast();
  };

  const showToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl transition-all animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>Preference successfully saved to browser local storage</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-400 border border-teal-500/30">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Terminal Preferences & System Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Configure quantitative thresholds, display formatting, and inspect local dataset integrity
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Quantitative Preferences */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 space-y-5 shadow-card">
        <div className="flex items-center gap-2 border-b border-navy-800 pb-3 text-slate-200">
          <Sliders className="h-4 w-4 text-teal-400" />
          <h3 className="text-sm font-semibold">Quantitative & Risk Parameters</h3>
        </div>

        {/* Default Confidence Level */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-white">Default Regulatory Confidence Level</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Governs default threshold for VaR calculation, backtesting POF, and model comparisons
            </p>
          </div>
          <div className="flex gap-1.5 rounded-md bg-navy-900 p-1 border border-navy-750 font-mono">
            {[0.95, 0.99, 0.995].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleConfidenceChange(lvl as any)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.confidenceLevel === lvl
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {(lvl * 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* Default Chart Time Range */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-navy-800/80 pt-4">
          <div>
            <span className="font-semibold text-white">Default Chart Lookback Window</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Initial time horizon displayed across portfolio valuation and P&L charts
            </p>
          </div>
          <div className="flex gap-1.5 rounded-md bg-navy-900 p-1 border border-navy-750 font-mono">
            {['1Y', '3Y', '5Y', 'ALL'].map((rng) => (
              <button
                key={rng}
                onClick={() => handleRangeChange(rng as any)}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all ${
                  settings.chartTimeRange === rng
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Table Density */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-navy-800/80 pt-4">
          <div>
            <span className="font-semibold text-white">Data Table Display Density</span>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Vertical row spacing in Data Explorer and Backtesting tables
            </p>
          </div>
          <div className="flex gap-1.5 rounded-md bg-navy-900 p-1 border border-navy-750 font-mono">
            {(['compact', 'comfortable'] as const).map((density) => (
              <button
                key={density}
                onClick={() => handleDensityChange(density)}
                className={`rounded px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  settings.tableDensity === density
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {density}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Data Freshness Diagnostics */}
      <div className="rounded-lg border border-navy-700 bg-navy-850 p-5 space-y-4 shadow-card">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Database className="h-4 w-4 text-teal-400" />
            <h3 className="text-sm font-semibold">Data Freshness & Exchange Synchronization</h3>
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-md border border-navy-700 bg-navy-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-navy-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-teal-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Querying Exchange...' : 'Run Connectivity Check'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded bg-navy-900 p-3.5 border border-navy-800 space-y-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold">Local Repository Data State</span>
            <div className="flex justify-between">
              <span className="text-slate-400">Latest Processed Date:</span>
              <span className="text-white font-bold">{freshness.local_latest_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Analysis Mtime:</span>
              <span className="text-slate-300">
                {freshness.analysis_mtime ? new Date(freshness.analysis_mtime).toLocaleTimeString() : 'Verified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-bold">Loaded & Cached</span>
            </div>
          </div>

          <div className="rounded bg-navy-900 p-3.5 border border-navy-800 space-y-2">
            <span className="text-[10px] uppercase text-slate-500 font-bold">Exchange Calendar State</span>
            <div className="flex justify-between">
              <span className="text-slate-400">Latest Trading Session:</span>
              <span className="text-teal-300 font-bold">{freshness.market_latest_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sync Status:</span>
              <span className={freshness.is_up_to_date ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {freshness.is_up_to_date ? 'Synchronized' : 'Updates Available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Checked:</span>
              <span className="text-slate-300">
                {freshness.checked_at ? new Date(freshness.checked_at).toLocaleTimeString() : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded bg-navy-900/60 p-3 text-xs text-slate-400 leading-relaxed border border-navy-800">
          <p>
            <strong>Pipeline Separation Rule:</strong> Refreshing market prices via Yahoo Finance acquires new trading
            data into raw files. However, the quantitative risk models (GARCH, GJR-GARCH, Kupiec Backtesting, and Stress
            Testing) require full execution of the Python analysis pipeline to recalculate downstream metrics. The
            terminal strictly avoids presenting stale outputs as freshly computed.
          </p>
        </div>
      </div>
    </div>
  );
};
