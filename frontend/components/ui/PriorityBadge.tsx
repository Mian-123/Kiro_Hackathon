"use client";

import { PRIORITY_CLASS, type PriorityBand } from "@/lib/utils";

interface PriorityBadgeProps {
  band: PriorityBand;
  score?: number;
  showScore?: boolean;
}

const PRIORITY_ICONS: Record<PriorityBand, string> = {
  LOW: "▽",
  MEDIUM: "▲",
  HIGH: "▲▲",
  CRITICAL: "⚠",
};

export function PriorityBadge({ band, score, showScore = false }: PriorityBadgeProps) {
  const cls = PRIORITY_CLASS[band] || "priority-low";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}
      aria-label={`Priority: ${band}${score !== undefined ? `, score ${score.toFixed(0)}` : ""}`}
    >
      <span aria-hidden="true" style={{ fontSize: "9px" }}>{PRIORITY_ICONS[band]}</span>
      {band}
      {showScore && score !== undefined && (
        <span className="opacity-70 ml-0.5">· {score.toFixed(0)}</span>
      )}
    </span>
  );
}
