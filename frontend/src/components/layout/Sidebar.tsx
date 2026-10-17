import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  ShieldAlert,
  BarChart3,
  Activity,
  CheckCircle,
  GitCompare,
  Flame,
  Database,
  FileText,
  Info,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/portfolio', label: 'Portfolio Analytics', icon: PieChart },
  { path: '/risk-models', label: 'Risk Models', icon: ShieldAlert },
  { path: '/historical-var', label: 'Historical VaR & ES', icon: TrendingDown },
  { path: '/volatility', label: 'Volatility Analysis', icon: Activity },
  { path: '/backtesting', label: 'VaR Backtesting', icon: CheckCircle },
  { path: '/model-comparison', label: 'Model Comparison', icon: GitCompare },
  { path: '/stress-testing', label: 'Stress Testing', icon: Flame },
  { path: '/data-explorer', label: 'Data Explorer', icon: Database },
  { path: '/reports', label: 'Reports & Exports', icon: FileText },
  { path: '/about', label: 'About Project', icon: Info },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-navy-800 bg-navy-950 transition-all duration-300 lg:static ${
          collapsed ? 'w-18' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-navy-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-200">
                  Risk Terminal
                </span>
                <span className="text-[10px] font-mono text-teal-400">
                  EQUITY VaR & ES
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-navy-850 hover:text-slate-200'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Collapse toggle footer */}
        <div className="hidden border-t border-navy-800 p-3 lg:block">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-navy-800 bg-navy-900 py-2 text-xs font-medium text-slate-400 hover:bg-navy-850 hover:text-slate-200 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse Navigation</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
