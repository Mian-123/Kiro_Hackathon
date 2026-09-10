"use client";

import { IconCheck } from "./Icons";
import type { StatusType } from "@/lib/utils";

interface TimelineProps {
  status: StatusType;
  compact?: boolean;
  repVerified?: boolean;
}

const STEPS = [
  {
    key: "reported",
    label: "Reported",
    subtitle: "You · submitted",
  },
  {
    key: "verified",
    label: "Verified",
    subtitle: "Under Street Rep review",
  },
  {
    key: "work_order",
    label: "Work Order",
    subtitle: "Officer assigns department",
  },
  {
    key: "in_progress",
    label: "In Progress",
    subtitle: "Department working on site",
  },
  {
    key: "completed",
    label: "Completed",
    subtitle: "Awaiting Rep verification",
  },
  {
    key: "verified_done",
    label: "Verified Done",
    subtitle: "Resolved · confirmed",
  },
];

function statusToDoneCount(status: StatusType, repVerified = false): number {
  switch (status) {
    case "SUBMITTED":
      return 1;
    case "AI_REVIEW":
      return repVerified ? 2 : 1;
    case "VERIFIED":
      return 2;
    case "ASSIGNED":
      return 3;
    case "IN_PROGRESS":
      return 4;
    case "RESOLUTION_SUBMITTED":
    case "AWAITING_CITIZEN_VERIFICATION":
      return 5;
    case "RESOLVED":
      return 6;
    case "REOPENED":
      return 4; // back to in progress
    default:
      return 1;
  }
}

export function Timeline({ status, compact = false, repVerified = false }: TimelineProps) {
  const doneCount = statusToDoneCount(status, repVerified);

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const done = stepNum < doneCount;
        const current = stepNum === doneCount;
        const pending = stepNum > doneCount;
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Dot + line column */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              {done || current ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#0E8A5F", boxShadow: current ? "0 0 0 4px rgba(14,138,95,0.15)" : "none" }}
                >
                  <IconCheck size={14} className="text-white" />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ border: "2px solid #E6E3DC", background: "#F8F7F4" }}
                />
              )}

              {/* Line */}
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-1 mb-1"
                  style={{
                    minHeight: compact ? "20px" : "28px",
                    background: done ? "#0E8A5F" : "#E6E3DC",
                    ...(pending ? { backgroundImage: "repeating-linear-gradient(to bottom, #E6E3DC 0, #E6E3DC 4px, transparent 4px, transparent 8px)" } : {}),
                  }}
                />
              )}
            </div>

            {/* Label */}
            <div className={`${isLast ? "pb-0" : compact ? "pb-3" : "pb-5"} flex-1`}>
              <p
                className="font-bold leading-tight"
                style={{
                  fontSize: compact ? "13px" : "15px",
                  color: pending ? "#B0BAC8" : "#16233A",
                }}
              >
                {step.label}
              </p>
              {!compact && (
                <p
                  className="mt-0.5"
                  style={{ fontSize: "12px", color: pending ? "#C8D0DA" : "#5A6B84" }}
                >
                  {step.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
