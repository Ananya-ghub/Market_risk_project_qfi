import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { useRiskData } from '../../context/RiskDataContext';

export const FreshnessBanner: React.FC = () => {
  const { freshness, refreshing, triggerRefresh } = useRiskData();

  const isStaleOrUpdatesAvailable = freshness.status === 'updates_available';

  return (
    <div className="mb-6 rounded-lg border border-navy-700 bg-navy-900/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {isStaleOrUpdatesAvailable ? (
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
          ) : (
            <div className="rounded-full bg-teal-500/10 p-2 text-teal-400 border border-teal-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Data Freshness & Pipeline Integrity
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                  isStaleOrUpdatesAvailable
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isStaleOrUpdatesAvailable ? 'NEW TRADING DATA ON EXCHANGE' : 'DATASET VERIFIED'}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-4xl">
              {isStaleOrUpdatesAvailable ? (
                <>
                  <strong className="text-amber-200">Notice:</strong> The exchange has published trading data up to{' '}
                  <span className="font-mono text-white">{freshness.market_latest_date}</span>, whereas the current
                  risk models and baseline analyses were computed on data through{' '}
                  <span className="font-mono text-white">{freshness.local_latest_date}</span>. To preserve mathematical
                  consistency across all downstream backtests and GARCH models, analyses are strictly pegged to the verified
                  baseline run from <span className="font-mono text-slate-300">{freshness.analysis_mtime ? new Date(freshness.analysis_mtime).toLocaleTimeString() : 'latest run'}</span>.
                </>
              ) : (
                <>
                  Portfolio records and risk estimates are synchronized with the verified market close at{' '}
                  <span className="font-mono text-white">{freshness.local_latest_date}</span>. All downstream risk models,
                  volatility forecasts, and Kupiec/Christoffersen backtests reflect this unified dataset.
                </>
              )}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-400" />
                Latest Market Data: <span className="text-slate-300">{freshness.local_latest_date}</span>
              </span>
              <span>•</span>
              <span>
                Exchange Date: <span className="text-slate-300">{freshness.market_latest_date}</span>
              </span>
              <span>•</span>
              <span>
                Checked: <span className="text-slate-300">{freshness.checked_at ? new Date(freshness.checked_at).toLocaleTimeString() : 'Just now'}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-md border border-navy-600 bg-navy-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-navy-700 hover:text-white transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-teal-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Checking Exchange...' : 'Check Freshness'}</span>
        </button>
      </div>
    </div>
  );
};
