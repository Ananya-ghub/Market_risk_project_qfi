import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, RefreshCw, Calendar, User, ShieldCheck } from 'lucide-react';
import { useRiskData } from '../../context/RiskDataContext';

interface HeaderProps {
  onOpenMobile: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview Dashboard', subtitle: 'Executive Risk Summary & Key Portfolio Indicators' },
  '/portfolio': { title: 'Portfolio Analytics', subtitle: 'Holdings, P&L Distribution & Return Dynamics' },
  '/risk-models': { title: 'Risk Models', subtitle: 'Theoretical Foundations, Parameters & Mathematical Formulations' },
  '/historical-var': { title: 'Historical VaR & Expected Shortfall', subtitle: 'Tail-Loss Risk Metrics Across Confidence Levels & Windows' },
  '/volatility': { title: 'Volatility Analysis', subtitle: 'EWMA, GARCH(1,1), and GJR-GARCH Conditional Modeling' },
  '/backtesting': { title: 'VaR Backtesting', subtitle: 'Kupiec POF & Christoffersen Independence Statistical Validation' },
  '/model-comparison': { title: 'Model Comparison', subtitle: 'Comprehensive Model Efficiency & Exception Evaluation' },
  '/stress-testing': { title: 'Stress Testing & Scenario Analysis', subtitle: 'Macro Shocks, Volatility Spikes & Hypothetical Loss Scenarios' },
  '/data-explorer': { title: 'Data Explorer', subtitle: 'Inspect, Filter & Export Processed Risk Datasets' },
  '/reports': { title: 'Reports & Exports', subtitle: 'Executive Summaries & Downloadable Risk Center' },
  '/about': { title: 'About Project', subtitle: 'Quant Pipeline Methodology & Architectural Overview' },
  '/settings': { title: 'Settings & Diagnostics', subtitle: 'System Configuration, Preferences & Data Freshness Diagnostics' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobile }) => {
  const location = useLocation();
  const { freshness, refreshing, triggerRefresh } = useRiskData();

  const current = pageTitles[location.pathname] || {
    title: 'Risk Terminal',
    subtitle: 'Institutional Risk Analytics'
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-800 bg-navy-950/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="rounded-md border border-navy-700 bg-navy-900 p-2 text-slate-400 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-white tracking-wide">{current.title}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Latest Market Date Badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-md border border-navy-750 bg-navy-900 px-2.5 py-1 text-xs font-mono text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-teal-400" />
          <span>Market Data:</span>
          <span className="font-semibold text-white">{freshness.local_latest_date}</span>
        </div>

        {/* Refresh Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-navy-750 bg-navy-900 px-2.5 py-1 text-xs font-mono">
          <span
            className={`h-2 w-2 rounded-full ${
              freshness.status === 'data_up_to_date'
                ? 'bg-emerald-400'
                : freshness.status === 'updates_available'
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`}
          />
          <span className="text-slate-300">
            {freshness.status === 'data_up_to_date'
              ? 'Synchronized'
              : freshness.status === 'updates_available'
              ? 'Update Avail'
              : 'Offline'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          title="Query Exchange Market Freshness"
          className="flex items-center gap-1.5 rounded-md border border-navy-700 bg-navy-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-navy-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-teal-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>

        {/* Terminal Badge */}
        <div className="hidden xl:flex items-center gap-1 rounded bg-teal-950/40 border border-teal-500/20 px-2 py-1 text-[11px] font-mono text-teal-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
          <span>INSTITUTIONAL QUANT</span>
        </div>

        {/* Profile Placeholder */}
        <div className="flex items-center gap-2 border-l border-navy-800 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-800 border border-navy-700 text-slate-300">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">Risk Analyst</span>
            <span className="text-[10px] text-slate-500 font-mono">Quant Portfolio</span>
          </div>
        </div>
      </div>
    </header>
  );
};
