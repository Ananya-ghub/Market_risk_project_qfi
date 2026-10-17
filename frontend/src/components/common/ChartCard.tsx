import React, { ReactNode } from 'react';
import { Download } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  availableRanges?: string[];
  onExportCsv?: () => void;
  badge?: string;
  actions?: ReactNode;
  height?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  timeRange,
  onTimeRangeChange,
  availableRanges = ['1Y', '3Y', '5Y', 'ALL'],
  onExportCsv,
  badge,
  actions,
  height = 'h-80'
}) => {
  return (
    <div className="rounded-lg border border-navy-700 bg-navy-850 p-4 transition-all duration-200 hover:border-navy-600">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-navy-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{title}</h3>
            {badge && (
              <span className="rounded bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 text-[10px] font-mono font-medium text-teal-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {onTimeRangeChange && availableRanges && (
            <div className="flex rounded-md bg-navy-900 p-0.5 border border-navy-750">
              {availableRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange(range)}
                  className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              title="Export Chart Data to CSV"
              className="rounded border border-navy-700 bg-navy-900 p-1.5 text-slate-400 hover:bg-navy-800 hover:text-slate-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className={`w-full ${height}`}>{children}</div>
    </div>
  );
};
