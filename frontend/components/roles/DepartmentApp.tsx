"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { LiveMap } from "@/components/ui/LiveMap";
import { CategoryBadge, IconCheck, IconMapPin, IconCamera, IconAlertTriangle } from "@/components/ui/Icons";
import {
  MOCK_INCIDENTS, MOCK_UC_STATS, MOCK_STREET_RANKINGS, MOCK_REP_PERFORMANCE,
  MOCK_DUPLICATE_REPORTS, MOCK_DUPLICATE_SIGNALS,
  LAHORE_INCIDENT_MARKERS, MOCK_CONTRACTORS,
} from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";

const CONTRACTORS = ["Al-Jalil Builders", "Metro Contractors", "Lahore Infra Co"];

// white card style
const CARD = { background: "#FFFFFF", border: "1px solid #E6E3DC", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" };

// KPI overrides (spec-exact)
const UC_STATS = {
  streets: 142,
  avgScore: 69.1,
  openComplaints: 10,
  overdue: 7,
  activeWorkOrders: 3,
};

type QueueTab = "review" | "in_process" | "waiting";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DepartmentApp() {
  const { workOrders, createWorkOrder } = useAppState();

  const [queueTab, setQueueTab] = useState<QueueTab>("review");

  // Work order modal
  const [woOpen, setWoOpen]   = useState(false);
  const [woIncidentId, setWoIncidentId] = useState<string | null>(null);
  const [woContractor, setWoContractor] = useState(CONTRACTORS[0]);
  const [woCost, setWoCost]   = useState("");
  const [toast, setToast]     = useState<string | null>(null);
  const [dismissedDisputes, setDismissedDisputes] = useState<string[]>([]);

  const woIncident = MOCK_INCIDENTS.find((i) => i.id === woIncidentId);

  const disputes = workOrders.filter((w) => w.status === "DISPUTED" && !dismissedDisputes.includes(w.id));
  const liveCompleted = workOrders.filter((w) => w.status === "COMPLETED" || w.status === "RESOLVED");
  const liveInProgress = workOrders.filter((w) => w.status === "ASSIGNED" || w.status === "IN_PROGRESS");

  const reviewIncidents = MOCK_INCIDENTS.filter((i) => ["SUBMITTED", "VERIFIED", "ASSIGNED"].includes(i.status));
  const inProcessIncidents = MOCK_INCIDENTS.filter((i) =>
    ["IN_PROGRESS", "RESOLUTION_SUBMITTED", "AWAITING_CITIZEN_VERIFICATION", "REOPENED"].includes(i.status)
  );
  const waitingIncidents = MOCK_INCIDENTS.filter((i) => i.status === "ASSIGNED");

  function openWorkOrderModal(incidentId: string) {
    setWoIncidentId(incidentId);
    setWoContractor(CONTRACTORS[0]);
    setWoCost("");
    setWoOpen(true);
  }

  function submitWorkOrder() {
    if (!woIncident) return;
    createWorkOrder({
      shortCode: `CP-${woIncident.shortCode}`,
      category: woIncident.category,
      description: woIncident.description,
      address: woIncident.location,
      latitude: woIncident.lat,
      longitude: woIncident.lng,
      contractor: woContractor,
      cost: woCost ? Number(woCost) : undefined,
    });
    setWoOpen(false);
    setToast(`Work order generated and assigned to ${woContractor}`);
    setTimeout(() => setToast(null), 3500);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Completed jobs table (white) ────────────────────────────────────────────
  const CompletedJobsTable = () => {
    const fallback = MOCK_INCIDENTS.filter((i) => i.status === "RESOLVED").map((i) => ({
      id: i.id, category: i.category, area: i.location, contractor: "Bilal & Sons",
      cost: 62000, rating: 4, hasAfter: true,
    }));
    const liveRows = liveCompleted.map((w) => ({
      id: w.id, category: w.category, area: w.address, contractor: w.contractor || "—",
      cost: w.cost ?? 0, rating: w.rating ?? 0, hasAfter: !!w.contractorPhotoUrl,
    }));
    const rows = [...liveRows, ...fallback];

    return (
      <div className="rounded-2xl overflow-hidden" style={{ ...CARD }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E6E3DC" }}>
          <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Completed Jobs &amp; Work Records</p>
          <span className="text-[11px]" style={{ color: "#5A6B84" }}>Past 30 days</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#F8F7F4", color: "#5A6B84" }}>
              {["JOB DETAILS", "CONTRACTOR", "PHOTOS (BEFORE / AFTER)", "COST & RATING"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #E6E3DC" }}>
                <td className="px-4 py-3">
                  <p className="font-bold" style={{ color: "#0E2A4E" }}>{r.category}</p>
                  <p className="text-[11px]" style={{ color: "#5A6B84" }}>{r.area}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.contractor}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: "#0A1F3C" }}>
                      <IconCamera size={13} color="rgba(255,255,255,0.5)" />
                    </div>
                    <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: r.hasAfter ? "#E7F4EF" : "#F5F3EF", border: "1px solid #E6E3DC" }}>
                      {r.hasAfter ? <IconCheck size={13} color="#0E8A5F" /> : <span className="text-[9px]" style={{ color: "#5A6B84" }}>—</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold" style={{ color: "#0E8A5F" }}>PKR {r.cost ? r.cost.toLocaleString() : "—"}</p>
                  <p className="text-[11px]" style={{ color: "#C6A55C" }}>{"★".repeat(r.rating)}{"☆".repeat(Math.max(0, 5 - r.rating))}</p>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#5A6B84" }}>No completed jobs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#F5F3EF", boxShadow: "0 4px 24px rgba(10,31,60,0.15)", minHeight: "680px", position: "relative" }}>

      {/* ── Toast ── */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ top: 20, background: "#0E8A5F", boxShadow: "0 8px 24px rgba(14,138,95,0.4)" }}>
          <IconCheck size={16} color="white" /> {toast}
        </div>
      )}

      <div className="overflow-y-auto p-5 space-y-5" style={{ maxHeight: "720px" }}>

        {/* ── 1. Header row (white) ── */}
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between" style={{ ...CARD }}>
          <div>
            <p className="font-bold text-base" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>UC-14 Operations · Gulshan Town</p>
            <p className="text-xs mt-0.5" style={{ color: "#5A6B84" }}>Officer: Kamran Sheikh · Union Council dashboard · District East</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#FFFFFF", color: "#5A6B84", border: "1px solid #E6E3DC" }}>Export monthly report</button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#0E8A5F" }}>Publish rankings</button>
          </div>
        </div>

        {/* ── 2. KPI row ── */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "STREETS IN UC-14",  value: UC_STATS.streets,          color: "#16233A" },
            { label: "AVERAGE SCORE",      value: UC_STATS.avgScore,         color: "#0E8A5F" },
            { label: "OPEN COMPLAINTS",    value: UC_STATS.openComplaints,   color: "#C6A55C" },
            { label: "OVERDUE",            value: UC_STATS.overdue,          color: "#C0392B" },
            { label: "ACTIVE WORK ORDERS", value: UC_STATS.activeWorkOrders + liveInProgress.length, color: "#0E2A4E" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl p-4" style={{ ...CARD }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#5A6B84" }}>{k.label}</p>
              <p className="text-3xl font-bold" style={{ color: k.color, fontFamily: "Outfit,sans-serif" }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* ── 3. Two-column row (map + queue) ── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "58fr 42fr" }}>
          {/* LEFT — Live map */}
          <div className="rounded-xl p-4" style={{ ...CARD }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Live street map · UC-14</p>
            <LiveMap height="380px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} className="rounded-xl" />
            <div className="flex flex-wrap gap-4 mt-3">
              {[{l:"Good",c:"#0E8A5F"},{l:"Needs work",c:"#E0A400"},{l:"Urgent",c:"#C0392B"}].map((leg)=>(
                <div key={leg.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                  <span className="text-[11px]" style={{ color: "#5A6B84" }}>{leg.l}</span>
                </div>
              ))}
              <span className="text-[11px]" style={{ color: "#C9C4BA" }}>|</span>
              {[{l:"Roads",c:"#16233A"},{l:"Water",c:"#0E2A4E"},{l:"Electric",c:"#C6A55C"},{l:"Waste",c:"#0E8A5F"}].map((leg)=>(
                <div key={leg.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                  <span className="text-[11px]" style={{ color: "#5A6B84" }}>{leg.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Complaint queue */}
          <div className="rounded-xl p-4" style={{ ...CARD }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Complaint queue</p>

            {/* Sub-tabs */}
            <div className="flex gap-1 mb-4" style={{ borderBottom: "1px solid #E6E3DC" }}>
              {([
                ["review", "Needs Review"],
                ["in_process", "In Process"],
                ["waiting", "Active (Waiting)"],
              ] as const).map(([id, label]) => (
                <button key={id} onClick={() => setQueueTab(id)}
                  className="px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors"
                  style={{ color: queueTab === id ? "#0E8A5F" : "#5A6B84", borderBottom: queueTab === id ? "2px solid #0E8A5F" : "2px solid transparent", marginBottom: "-1px" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Needs Review */}
            {queueTab === "review" && (
              <div className="space-y-3" style={{ maxHeight: "360px", overflowY: "auto" }}>
                <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "#FFF8E1", border: "1px solid #C6A55C" }}>
                  <IconAlertTriangle size={16} color="#B8860B" />
                  <div>
                    <p className="text-[11px] font-bold" style={{ color: "#B8860B" }}>AI Merge</p>
                    <p className="text-[11px]" style={{ color: "#5A6B84" }}>5 similar reports were identified at this location. Root cause appears to be structural.</p>
                  </div>
                </div>
                {reviewIncidents.map((inc, idx) => (
                  <div key={inc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category} · Street 14</p>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FFF3E0", color: "#B8860B" }}>Overdue 2 hrs</span>
                        )}
                        {idx < 2 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>AI merged</span>
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: "#5A6B84" }}>{inc.shortCode} · verified by Ahmed Raza · {2 + idx * 3} hrs old</p>
                    </div>
                    <button onClick={() => openWorkOrderModal(inc.id)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white whitespace-nowrap" style={{ background: "#0E8A5F" }}>Review</button>
                  </div>
                ))}
                {reviewIncidents.length === 0 && (
                  <p className="text-center text-xs py-6" style={{ color: "#5A6B84" }}>Nothing to review</p>
                )}
              </div>
            )}

            {/* In Process */}
            {queueTab === "in_process" && (
              <div className="space-y-2" style={{ maxHeight: "360px", overflowY: "auto" }}>
                {liveInProgress.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                    <CategoryBadge category={w.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: "#16233A" }}>{w.category}</p>
                      <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{w.shortCode} · {w.contractor}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: w.status === "IN_PROGRESS" ? "#FFF3E0" : "#EAF0FA", color: w.status === "IN_PROGRESS" ? "#B8860B" : "#0E2A4E" }}>{w.status === "IN_PROGRESS" ? "Contractor working" : "Assigned"}</span>
                  </div>
                ))}
                {inProcessIncidents.map((inc) => (
                  <div key={inc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                      <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{inc.shortCode} · {inc.location}</p>
                    </div>
                    <StatusChip status={inc.status} />
                  </div>
                ))}
                {liveInProgress.length === 0 && inProcessIncidents.length === 0 && (
                  <p className="text-center text-xs py-6" style={{ color: "#5A6B84" }}>Nothing in process</p>
                )}
              </div>
            )}

            {/* Active (Waiting) */}
            {queueTab === "waiting" && (
              <div className="space-y-2" style={{ maxHeight: "360px", overflowY: "auto" }}>
                {waitingIncidents.map((inc) => (
                  <div key={inc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                      <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{inc.shortCode} · {inc.location}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: "#F5F3EF", color: "#5A6B84" }}>Waiting</span>
                  </div>
                ))}
                {waitingIncidents.length === 0 && (
                  <p className="text-center text-xs py-6" style={{ color: "#5A6B84" }}>Nothing waiting</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Street rankings ── */}
        <div className="rounded-xl p-4" style={{ ...CARD }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Street rankings · UC-14</p>
            <span className="text-[11px]" style={{ color: "#5A6B84" }}>public after publishing</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: "#5A6B84" }}>
                {["#","STREET","SCORE","OPEN","TREND","REPRESENTATIVE"].map((h) => (
                  <th key={h} className="pb-2 text-left font-semibold text-[10px] uppercase tracking-wide pr-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_STREET_RANKINGS.map((row) => (
                <tr key={row.rank} style={{ borderTop: "1px solid #E6E3DC", background: row.flagged ? "#FEF0EE" : "transparent" }}>
                  <td className="py-2 pr-2" style={{ color: "#16233A" }}>{row.rank}</td>
                  <td className="py-2 pr-2" style={{ color: row.flagged ? "#C0392B" : "#16233A" }}>{row.street}</td>
                  <td className="py-2 pr-2 font-bold" style={{ color: row.score >= 75 ? "#0E8A5F" : row.score >= 55 ? "#E0A400" : "#C0392B" }}>{row.score}</td>
                  <td className="py-2 pr-2" style={{ color: "#5A6B84" }}>{row.open}</td>
                  <td className="py-2 pr-2 font-bold" style={{ color: row.trend > 0 ? "#0E8A5F" : "#C0392B" }}>{row.trend > 0 ? "▲" : "▼"} {Math.abs(row.trend)}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: row.flagged ? "#FEE2DE" : "#EAF0FA", color: row.flagged ? "#C0392B" : "#0E2A4E" }}>{initialsOf(row.rep)}</div>
                      <span style={{ color: row.flagged ? "#C0392B" : "#5A6B84" }}>{row.rep}</span>
                      {row.flagged && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2DE", color: "#C0392B" }}>flagged</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 5. Representative performance ── */}
        <div className="rounded-xl p-4" style={{ ...CARD }}>
          <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Representative performance</p>
          <div className="space-y-3">
            {MOCK_REP_PERFORMANCE.map((rep) => (
              <div key={rep.initials} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: rep.flagged ? "#FEF0EE" : "#EAF0FA", color: rep.flagged ? "#C0392B" : "#0E2A4E", fontFamily: "Outfit,sans-serif" }}>{rep.initials}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold" style={{ color: "#16233A" }}>{rep.name}</p>
                    {rep.repOfMonth && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FFF8E1", color: "#B8860B", border: "1px solid #C6A55C" }}>★ Rep of the Month</span>}
                  </div>
                  <p className="text-[11px]" style={{ color: rep.flagged ? "#C0392B" : "#5A6B84" }}>Verify avg {rep.avgVerifyHrs} hrs · {rep.checklists}% checklists · {rep.rating}★ citizen rating{rep.flagged ? " · review scheduled" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. Budget · July ── */}
        <div className="rounded-xl p-5" style={{ ...CARD }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#16233A" }}>Budget · July <span style={{ color: "#5A6B84", fontWeight: 400 }}>PKR</span></p>
          <p className="text-3xl font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>1.84M <span className="text-base font-normal" style={{ color: "#5A6B84" }}>of 2.5M used</span></p>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E6E3DC" }}>
            <div className="h-full rounded-full" style={{ width: "73.6%", background: "linear-gradient(90deg,#0E8A5F,#12A874)" }} />
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {["Top spend: sewerage 41%", "Top spend: roads 33%", "Top spend: lighting 14%"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#0E8A5F" }} />
                <span className="text-[11px]" style={{ color: "#5A6B84" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 7. Disputes banner (red) ── */}
        {disputes.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#FEF0EE", border: "1px solid #F3C0BA" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "#C0392B", fontFamily: "Outfit,sans-serif" }}>Reported Problems (Disputes)</p>
              <span className="text-xs font-semibold" style={{ color: "#C0392B" }}>Requires Attention</span>
            </div>
            <div className="space-y-2">
              {disputes.map((d) => (
                <div key={d.id} className="flex items-center gap-3 bg-white rounded-xl p-3" style={{ border: "1px solid #F3C0BA" }}>
                  <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#0A1F3C" }}>
                    <IconCamera size={15} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "#16233A" }}>{d.category}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF0EE", color: "#C0392B" }}>re-disputed</span>
                    </div>
                    <p className="text-xs italic mt-0.5" style={{ color: "#5A6B84" }}>&ldquo;{d.disputeReason || "Work rejected by street rep"}&rdquo;</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => showToast(`Re-assigned ${d.category} to a contractor`)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: "#C0392B" }}>Assign to Contractor</button>
                    <button onClick={() => setDismissedDisputes((p) => [...p, d.id])}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: "#F5F3EF", color: "#5A6B84", border: "1px solid #E6E3DC" }}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. Completed jobs & work records ── */}
        <CompletedJobsTable />
      </div>

      {/* ══ WORK ORDER MODAL ══ */}
      {woOpen && woIncident && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(10,31,60,0.45)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", maxHeight: "90%", overflowY: "auto" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#0A1F3C" }}>
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Outfit,sans-serif" }}>Create Work Order</p>
              <button onClick={() => setWoOpen(false)} className="text-white text-lg font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <CategoryBadge category={woIncident.category} size="lg" />
                <div>
                  <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{woIncident.category}</p>
                  <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{woIncident.shortCode}</p>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                <div className="flex items-start gap-1.5">
                  <IconMapPin size={14} color="#0E8A5F" />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#16233A" }}>{woIncident.location}</p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "#5A6B84" }}>{woIncident.lat.toFixed(5)}, {woIncident.lng.toFixed(5)}</p>
                  </div>
                </div>
              </div>

              {/* Citizen + rep photos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Citizen Photo (Before)</p>
                  <div className="rounded-xl h-28 flex items-center justify-center" style={{ background: "#0A1F3C" }}>
                    <CategoryBadge category={woIncident.category} size="lg" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Street Rep Verification</p>
                  <div className="rounded-xl h-28 flex items-center justify-center" style={{ background: "#E7F4EF", border: "1px solid #0E8A5F" }}>
                    <IconCheck size={30} color="#0E8A5F" />
                  </div>
                </div>
              </div>

              {/* Contractor selection cards */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Assign Contractor</p>
                <div className="space-y-2">
                  {MOCK_CONTRACTORS.map((c) => {
                    const selected = woContractor === c.name;
                    return (
                      <button key={c.id} onClick={() => setWoContractor(c.name)}
                        className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all"
                        style={{ border: `1.5px solid ${selected ? "#0E8A5F" : "#E6E3DC"}`, background: selected ? "#E7F4EF" : "#FFFFFF" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: selected ? "#0E8A5F" : "#EAF0FA", color: selected ? "white" : "#0E2A4E" }}>{c.avatarInitials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold" style={{ color: "#16233A" }}>{c.name}</p>
                            <span className="text-[11px] font-semibold" style={{ color: "#C6A55C" }}>★ {c.rating}</span>
                          </div>
                          <p className="text-[11px]" style={{ color: "#5A6B84" }}>{c.specialty}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "#5A6B84" }}>{c.completedJobs} completed · {c.pendingJobs} pending</p>
                        </div>
                        {selected && <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: "#0E8A5F", color: "white" }}>Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Budget (PKR)</p>
                <input type="number" value={woCost} onChange={(e) => setWoCost(e.target.value)} placeholder="e.g. 185000"
                  className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={{ border: "1.5px solid #E6E3DC", color: "#16233A" }} />
              </div>

              <button onClick={submitWorkOrder} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F", fontFamily: "Outfit,sans-serif" }}>
                Generate Work Order
              </button>
              <p className="text-[11px] text-center" style={{ color: "#5A6B84" }}>The contractor will see this in their portal and can start work.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
