import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  badge?: string;
  tooltip?: string;
  variant?: 'neutral' | 'positive' | 'negative' | 'warning' | 'primary';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  change,
  isPositive,
  icon: Icon,
  badge,
  tooltip,
  variant = 'neutral'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'positive':
        return 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400';
      case 'negative':
        return 'border-rose-500/30 bg-rose-950/10 text-rose-400';
      case 'warning':
        return 'border-amber-500/30 bg-amber-950/10 text-amber-400';
      case 'primary':
        return 'border-teal-500/30 bg-teal-950/10 text-teal-400';
      default:
        return 'border-navy-700 bg-navy-850 text-slate-300';
    }
  };

  return (
    <div className="relative rounded-lg border border-navy-700 bg-navy-850 p-4 transition-all duration-200 hover:border-navy-600 hover:shadow-card">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium tracking-wider uppercase">
          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded bg-navy-750 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
              {badge}
            </span>
          )}
          {tooltip && (
            <div className="group relative cursor-pointer">
              <Info className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300" />
              <div className="absolute right-0 top-5 z-50 hidden w-48 rounded bg-navy-900 p-2 text-[11px] leading-tight text-slate-200 shadow-xl border border-navy-700 group-hover:block">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="font-mono text-2xl font-bold tracking-tight text-white">
          {value}
        </div>
        {change && (
          <span
            className={`font-mono text-xs font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {subValue && (
        <div className="mt-1 text-xs text-slate-400 font-mono">
          {subValue}
        </div>
      )}
    </div>
  );
};
