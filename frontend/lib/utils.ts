import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type StatusType =
  | "SUBMITTED"
  | "AI_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLUTION_SUBMITTED"
  | "AWAITING_CITIZEN_VERIFICATION"
  | "RESOLVED"
  | "REOPENED"
  | "FLAGGED"
  | "REJECTED"
  | "MERGED";

export const STATUS_LABELS: Record<StatusType, string> = {
  SUBMITTED: "Submitted",
  AI_REVIEW: "AI Review",
  VERIFIED: "Verified",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLUTION_SUBMITTED: "Resolution Submitted",
  AWAITING_CITIZEN_VERIFICATION: "Awaiting Verification",
  RESOLVED: "Resolved",
  REOPENED: "Reopened",
  FLAGGED: "Flagged",
  REJECTED: "Rejected",
  MERGED: "Merged",
};

export const STATUS_CLASS: Record<StatusType, string> = {
  SUBMITTED: "status-submitted",
  AI_REVIEW: "status-ai_review",
  VERIFIED: "status-verified",
  ASSIGNED: "status-assigned",
  IN_PROGRESS: "status-in_progress",
  RESOLUTION_SUBMITTED: "status-resolution_submitted",
  AWAITING_CITIZEN_VERIFICATION: "status-awaiting_verification",
  RESOLVED: "status-resolved",
  REOPENED: "status-reopened",
  FLAGGED: "status-flagged",
  REJECTED: "status-rejected",
  MERGED: "status-merged",
};

export type PriorityBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const PRIORITY_CLASS: Record<PriorityBand, string> = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
  CRITICAL: "priority-critical",
};

export type Role = "citizen" | "street-rep" | "department" | "ministry" | "admin";
