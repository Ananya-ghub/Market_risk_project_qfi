import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  passed: boolean;
  labelPass?: string;
  labelFail?: string;
  showIcon?: boolean;
}

export const TestStatusBadge: React.FC<StatusBadgeProps> = ({
  passed,
  labelPass = 'PASSED (5%)',
  labelFail = 'REJECTED (5%)',
  showIcon = true
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-mono font-semibold ${
        passed
          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
      }`}
    >
      {showIcon && (
        passed ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <XCircle className="h-3 w-3 text-rose-400" />
        )
      )}
      <span>{passed ? labelPass : labelFail}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ pctLoss: number }> = ({ pctLoss }) => {
  const absLoss = Math.abs(pctLoss);

  if (absLoss >= 0.20) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300">
        <XCircle className="h-3 w-3 text-rose-400" />
        EXTREME CRASH
      </span>
    );
  }

  if (absLoss >= 0.10) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        SEVERE SHOCK
      </span>
    );
  }

  if (absLoss >= 0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-yellow-950/70 border border-yellow-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-300">
        <AlertTriangle className="h-3 w-3 text-yellow-400" />
        MODERATE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
      MILD
    </span>
  );
};
