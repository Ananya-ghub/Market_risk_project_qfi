import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FreshnessBanner } from '../common/FreshnessBanner';
import { useRiskData } from '../../context/RiskDataContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const Shell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, error } = useRiskData();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Freshness Banner at top */}
            <FreshnessBanner />

            {/* Error or Loading state */}
            {loading ? (
              <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-lg border border-navy-800 bg-navy-900/50">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                <span className="text-sm font-medium text-slate-300">
                  Loading Quantitative Risk Datasets...
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Parsing CSV records: Portfolio values, VaR cutoffs, GARCH volatility, and Backtests
                </span>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
                <h3 className="mt-2 text-sm font-semibold text-rose-300">Data Loading Error</h3>
                <p className="mt-1 text-xs text-rose-400/80">{error}</p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
