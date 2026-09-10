"use client";

import { STATUS_LABELS, STATUS_CLASS, type StatusType } from "@/lib/utils";

interface StatusChipProps {
  status: StatusType;
  size?: "sm" | "md";
}

const STATUS_ICONS: Partial<Record<StatusType, string>> = {
  SUBMITTED: "○",
  AI_REVIEW: "◐",
  VERIFIED: "✓",
  ASSIGNED: "→",
  IN_PROGRESS: "⚙",
  RESOLUTION_SUBMITTED: "↑",
  AWAITING_CITIZEN_VERIFICATION: "?",
  RESOLVED: "✓",
  REOPENED: "↺",
  FLAGGED: "⚑",
  REJECTED: "✕",
  MERGED: "⊕",
};

export function StatusChip({ status, size = "sm" }: StatusChipProps) {
  const cls = STATUS_CLASS[status] || "status-submitted";
  const label = STATUS_LABELS[status] || status;
  const icon = STATUS_ICONS[status] || "○";

  const sizeClass = size === "md"
    ? "px-3 py-1 text-xs font-semibold"
    : "px-2 py-0.5 text-[11px] font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${cls} ${sizeClass}`}
      aria-label={`Status: ${label}`}
      style={{ borderWidth: 1 }}
    >
      <span aria-hidden="true" style={{ fontSize: "10px" }}>{icon}</span>
      {label}
    </span>
  );
}
