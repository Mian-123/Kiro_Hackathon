"use client";

import { useState } from "react";
import { MOCK_DUPLICATE_REPORTS, MOCK_DUPLICATE_SIGNALS, type MockDuplicateReport } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import { CategoryBadge, IconMerge, IconAI, IconCheck } from "@/components/ui/Icons";

interface DuplicateDetectionPanelProps {
  reports?: MockDuplicateReport[];
  signals?: typeof MOCK_DUPLICATE_SIGNALS;
  onMerge?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function DuplicateDetectionPanel({
  reports = MOCK_DUPLICATE_REPORTS,
  signals = MOCK_DUPLICATE_SIGNALS,
  onMerge,
  onDismiss,
  className = "",
}: DuplicateDetectionPanelProps) {
  const [merged, setMerged] = useState(false);

  function handleMerge() {
    setMerged(true);
    onMerge?.();
  }

  if (merged) {
    return (
      <div className={`rounded-xl border border-[#0E8A5F] bg-[#E7F4EF] p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0E8A5F] flex items-center justify-center">
            <IconCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0E8A5F]">Incidents Merged</p>
            <p className="text-xs text-[#5A6B84]">
              {signals.reportCount} duplicate reports merged into a single incident. All citizens notified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pctProbability = Math.round(signals.combined_probability * 100);
  const probColor = pctProbability >= 90 ? '#C0392B' : pctProbability >= 70 ? '#E0A400' : '#5A6B84';

  return (
    <div className={`rounded-xl border border-[#E6E3DC] bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A1F3C] to-[#0E2A4E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C6A55C]/20 border border-[#C6A55C]/40 flex items-center justify-center">
            <IconAI size={14} className="text-[#C6A55C]" />
          </div>
          <div>
            <p className="text-white text-xs font-bold">AI Duplicate Detection</p>
            <p className="text-[#5A6B84] text-[10px]">Automated similarity analysis</p>
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: probColor + '22', color: probColor, border: `1px solid ${probColor}44` }}
        >
          {pctProbability}% match
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary */}
        <div className="bg-[#FFF8E1] border border-[#E0A400] rounded-lg p-3">
          <p className="text-xs font-semibold text-[#B8860B]">
            {signals.reportCount} reports detected from same location within {signals.distance_m}m
          </p>
          <p className="text-[11px] text-[#5A6B84] mt-0.5">
            All within {Math.round(signals.time_minutes / 60)}h · Same category · High semantic similarity
          </p>
        </div>

        {/* Similarity signals */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Proximity", value: `${signals.distance_m}m radius`, pct: Math.min(100, (500 - signals.distance_m) / 500 * 100), color: '#0E8A5F' },
            { label: "Category match", value: signals.category_match ? 'Yes' : 'No', pct: signals.category_match ? 100 : 0, color: '#0E8A5F' },
            { label: "Semantic similarity", value: `${Math.round(signals.semantic_similarity * 100)}%`, pct: signals.semantic_similarity * 100, color: '#C6A55C' },
            { label: "Image similarity", value: `${Math.round(signals.image_similarity * 100)}%`, pct: signals.image_similarity * 100, color: '#0E2A4E' },
          ].map((sig) => (
            <div key={sig.label} className="bg-[#F8F7F4] rounded-lg p-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-[#5A6B84]">{sig.label}</span>
                <span className="font-bold text-[#16233A]">{sig.value}</span>
              </div>
              <div className="bg-[#E6E3DC] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${sig.pct}%`, background: sig.color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Report list */}
        <div>
          <p className="text-[11px] font-semibold text-[#5A6B84] uppercase tracking-wide mb-2">
            Duplicate reports
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {reports.map((r) => (
              <div key={r.id} className="flex items-start gap-2 bg-[#F8F7F4] rounded-lg p-2">
                <CategoryBadge category={r.category} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-[#0A1F3C] bg-[#EAF0FA] px-1.5 py-0.5 rounded">
                      {r.shortCode}
                    </span>
                    <span className="text-[10px] text-[#5A6B84]">{r.distance_m}m away</span>
                  </div>
                  <p className="text-[11px] text-[#5A6B84] italic truncate mt-0.5">
                    &ldquo;{r.description}&rdquo;
                  </p>
                  <p className="text-[10px] text-[#9BA8BA]">{formatRelativeTime(r.submittedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Merged preview */}
        <div className="bg-[#EAF0FA] border border-[#0A1F3C]/20 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-[#0A1F3C] mb-1">Merged incident preview</p>
          <div className="flex items-center gap-2">
            <CategoryBadge category={reports[0]?.category || 'Broken Road'} size="sm" />
            <div>
              <p className="text-xs font-bold text-[#16233A]">{reports[0]?.category}</p>
              <p className="text-[11px] text-[#5A6B84]">
                {reports[0]?.street || reports[0]?.location} · {signals.reportCount} citizens reported
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleMerge}
            className="flex-1 flex items-center justify-center gap-2 bg-[#0E8A5F] hover:bg-[#12A874] text-white rounded-lg py-2.5 text-xs font-bold transition-colors"
          >
            <IconMerge size={14} />
            Merge into single incident
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-2.5 text-xs font-semibold text-[#5A6B84] border border-[#E6E3DC] rounded-lg hover:bg-[#F8F7F4] transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
