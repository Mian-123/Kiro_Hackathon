"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { StatusType } from "./utils";

export interface LiveReport {
  id: string;
  shortCode: string;
  category: string;
  description: string;
  street: string;
  hasPhoto: boolean;
  submittedAt: Date;
  status: "SUBMITTED" | "VERIFIED" | "REJECTED";
  repVerified: boolean;
}

interface AppState {
  liveReports: LiveReport[];
  addReport: (r: Omit<LiveReport, "id" | "submittedAt" | "status" | "repVerified">) => string;
  verifyReport: (id: string) => void;
  rejectReport: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);

  const addReport = useCallback((r: Omit<LiveReport, "id" | "submittedAt" | "status" | "repVerified">) => {
    const id = `live-${Date.now()}`;
    setLiveReports((prev) => [
      {
        ...r,
        id,
        submittedAt: new Date(),
        status: "SUBMITTED",
        repVerified: false,
      },
      ...prev,
    ]);
    return id;
  }, []);

  const verifyReport = useCallback((id: string) => {
    setLiveReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "VERIFIED", repVerified: true } : r)
    );
  }, []);

  const rejectReport = useCallback((id: string) => {
    setLiveReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r)
    );
  }, []);

  return (
    <AppContext.Provider value={{ liveReports, addReport, verifyReport, rejectReport }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be inside AppStateProvider");
  return ctx;
}
