"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// ── Report (citizen → street rep) ─────────────────────────────────────────────

export interface LiveReport {
  id: string;
  shortCode: string;
  category: string;
  description: string;
  street: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hasPhoto: boolean;
  photoDataUrl?: string;        // citizen-uploaded photo (object URL / data URL)
  submittedAt: Date;
  status: "SUBMITTED" | "VERIFIED" | "REJECTED";
  repVerified: boolean;
}

// ── Timeline event (timestamped, shown on citizen tracker) ────────────────────

export interface TimelineEvent {
  key: string;                  // reported | verified | work_order | in_progress | completed | resolved | disputed
  label: string;
  sublabel: string;
  at: Date;
}

// ── Work order (department → contractor) ──────────────────────────────────────

export type WorkOrderStatus =
  | "REVIEW"          // department reviewing, not yet assigned
  | "ASSIGNED"        // work order created, assigned to contractor
  | "IN_PROGRESS"     // contractor started work
  | "COMPLETED"       // contractor finished + uploaded photo, awaiting citizen sign-off
  | "RESOLVED"        // citizen confirmed + released payment
  | "DISPUTED";       // street rep / citizen rejected the work

export interface WorkOrder {
  id: string;
  shortCode: string;            // e.g. CP-INC-8A2F
  category: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  citizenPhotoUrl?: string;     // before photo (citizen)
  repPhotoUrl?: string;         // street rep verification photo
  contractorPhotoUrl?: string;  // after photo (contractor completion)
  contractor?: string;          // assigned contractor name
  cost?: number;                // PKR
  rating?: number;              // 1-5 citizen rating
  disputeReason?: string;
  status: WorkOrderStatus;
  createdAt: Date;
  history: TimelineEvent[];     // timestamped lifecycle
}

interface AppState {
  // reports
  liveReports: LiveReport[];
  addReport: (r: Omit<LiveReport, "id" | "submittedAt" | "status" | "repVerified">) => string;
  verifyReport: (id: string) => void;
  rejectReport: (id: string) => void;

  // work orders
  workOrders: WorkOrder[];
  createWorkOrder: (w: {
    shortCode: string;
    category: string;
    description: string;
    address: string;
    latitude?: number;
    longitude?: number;
    citizenPhotoUrl?: string;
    repPhotoUrl?: string;
    contractor: string;
    cost?: number;
  }) => string;
  startWork: (id: string) => void;
  completeWork: (id: string, contractorPhotoUrl?: string) => void;
  resolveWorkOrder: (id: string, rating: number) => void;
  disputeWorkOrder: (id: string, reason: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function ev(key: string, label: string, sublabel: string): TimelineEvent {
  return { key, label, sublabel, at: new Date() };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  // ── Reports ────────────────────────────────────────────────────────────────

  const addReport = useCallback((r: Omit<LiveReport, "id" | "submittedAt" | "status" | "repVerified">) => {
    const id = `live-${Date.now()}`;
    setLiveReports((prev) => [
      { ...r, id, submittedAt: new Date(), status: "SUBMITTED", repVerified: false },
      ...prev,
    ]);
    return id;
  }, []);

  const verifyReport = useCallback((id: string) => {
    setLiveReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED", repVerified: true } : r))
    );
  }, []);

  const rejectReport = useCallback((id: string) => {
    setLiveReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
    );
  }, []);

  // ── Work orders ──────────────────────────────────────────────────────────────

  const createWorkOrder = useCallback((w: {
    shortCode: string;
    category: string;
    description: string;
    address: string;
    latitude?: number;
    longitude?: number;
    citizenPhotoUrl?: string;
    repPhotoUrl?: string;
    contractor: string;
    cost?: number;
  }) => {
    const id = `wo-${Date.now()}`;
    const now = new Date();
    setWorkOrders((prev) => [
      {
        id,
        shortCode: w.shortCode,
        category: w.category,
        description: w.description,
        address: w.address,
        latitude: w.latitude,
        longitude: w.longitude,
        citizenPhotoUrl: w.citizenPhotoUrl,
        repPhotoUrl: w.repPhotoUrl,
        contractor: w.contractor,
        cost: w.cost,
        status: "ASSIGNED",
        createdAt: now,
        history: [
          { key: "reported",   label: "Reported",   sublabel: "Citizen submitted",        at: now },
          { key: "verified",   label: "Verified",   sublabel: "Street Rep verified",      at: now },
          { key: "work_order", label: "Work Order", sublabel: `Assigned to ${w.contractor}`, at: now },
        ],
      },
      ...prev,
    ]);
    return id;
  }, []);

  const startWork = useCallback((id: string) => {
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "IN_PROGRESS", history: [...w.history, ev("in_progress", "In Progress", "Contractor started work")] }
          : w
      )
    );
  }, []);

  const completeWork = useCallback((id: string, contractorPhotoUrl?: string) => {
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "COMPLETED", contractorPhotoUrl, history: [...w.history, ev("completed", "Completed", "Contractor finished, pending review")] }
          : w
      )
    );
  }, []);

  const resolveWorkOrder = useCallback((id: string, rating: number) => {
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "RESOLVED", rating, history: [...w.history, ev("resolved", "Resolved", "Citizen confirmed & released payment")] }
          : w
      )
    );
  }, []);

  const disputeWorkOrder = useCallback((id: string, reason: string) => {
    setWorkOrders((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "DISPUTED", disputeReason: reason, history: [...w.history, ev("disputed", "Disputed", reason)] }
          : w
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        liveReports, addReport, verifyReport, rejectReport,
        workOrders, createWorkOrder, startWork, completeWork, resolveWorkOrder, disputeWorkOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be inside AppStateProvider");
  return ctx;
}
