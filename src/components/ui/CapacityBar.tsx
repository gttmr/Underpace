"use client";

interface CapacityBarProps {
  current: number;
  max: number;
  waitlisted?: number;
  showLabel?: boolean;
}

export function CapacityBar({ current, max, waitlisted = 0, showLabel = true }: CapacityBarProps) {
  const ratio = max > 0 ? current / max : 0;
  const pct = Math.min(ratio * 100, 100);

  const barColor =
    ratio >= 1 ? "bg-red-500" :
    ratio >= 0.85 ? "bg-amber-400" :
    ratio >= 0.6 ? "bg-amber-300" :
    "bg-brand-primary";

  const label =
    ratio >= 1 ? "정원 마감" :
    ratio >= 0.85 ? "마감 임박" : "";

  const labelColor =
    ratio >= 1 ? "text-red-600" :
    ratio >= 0.85 ? "text-amber-600" :
    "text-brand-text-subtle";

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-brand-text-muted">
            정원 <span className="font-bold text-brand-text">{current}</span>/{max}명
            {waitlisted > 0 && (
              <span className="ml-1.5 text-amber-600 text-xs font-semibold">· 대기 {waitlisted}명</span>
            )}
          </span>
          {label && <span className={`text-xs font-bold ${labelColor}`}>{label}</span>}
        </div>
      )}

      <div className="w-full h-1.5 bg-brand-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showLabel && ratio < 1 && (
        <p className="text-xs text-brand-text-subtle">잔여 {max - current}자리</p>
      )}
    </div>
  );
}
