"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Timeline } from "@/components/ui/Timeline";
import { LiveMap } from "@/components/ui/LiveMap";
import { CategoryBadge, IconCheck, IconArrowLeft, IconCamera, IconAlertTriangle, IconMapPin, IconUpload } from "@/components/ui/Icons";
import {
  MOCK_INCIDENTS, MOCK_UC_STATS, MOCK_COMPLAINT_QUEUE,
  MOCK_STREET_RANKINGS, MOCK_REP_PERFORMANCE,
  MOCK_DUPLICATE_REPORTS, MOCK_DUPLICATE_SIGNALS,
  LAHORE_INCIDENT_MARKERS, MOCK_CONTRACTORS,
} from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";
import { formatDate } from "@/lib/utils";

type View = "dashboard" | "incident-detail" | "resolve";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "review",    label: "Review" },
  { id: "queue",     label: "Complaint Queue" },
  { id: "map",       label: "Live Map" },
  { id: "reps",      label: "Representatives" },
  { id: "budget",    label: "Budget" },
];

const CONTRACTORS = ["Al-Jalil Builders", "Metro Contractors", "Lahore Infra Co"];
// contractor cards are sourced from MOCK_CONTRACTORS; CONTRACTORS[0] is the default selection

// white card style
const CARD = { background: "#FFFFFF", border: "1px solid #E6E3DC", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" };

function fmtTime(d: Date): string {
  return d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DepartmentApp() {
  const { workOrders, createWorkOrder, disputeWorkOrder } = useAppState();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [view, setView]           = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resDesc, setResDesc]     = useState("");
  const [resImage, setResImage]   = useState(false);
  const [resDone, setResDone]     = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [mergedDone, setMergedDone] = useState(false);
  const [reviewTab, setReviewTab] = useState<"review" | "in_progress" | "completed">("review");

  // Work order modal
  const [woOpen, setWoOpen]   = useState(false);
  const [woIncidentId, setWoIncidentId] = useState<string | null>(null);
  const [woContractor, setWoContractor] = useState(CONTRACTORS[0]);
  const [woCost, setWoCost]   = useState("");
  const [toast, setToast]     = useState<string | null>(null);
  const [dismissedDisputes, setDismissedDisputes] = useState<string[]>([]);

  const selectedIncident = MOCK_INCIDENTS.find((i) => i.id === selectedId);
  const woIncident = MOCK_INCIDENTS.find((i) => i.id === woIncidentId);

  const disputes = workOrders.filter((w) => w.status === "DISPUTED" && !dismissedDisputes.includes(w.id));
  const liveCompleted = workOrders.filter((w) => w.status === "COMPLETED" || w.status === "RESOLVED");
  const liveInProgress = workOrders.filter((w) => w.status === "ASSIGNED" || w.status === "IN_PROGRESS");

  function openIncident(id: string) { setSelectedId(id); setView("incident-detail"); setResDone(false); setResDesc(""); setResImage(false); }

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

  // ── Reusable: disputes banner (red) ─────────────────────────────────────────
  const DisputesBanner = () => {
    if (disputes.length === 0) return null;
    return (
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#FEF0EE", border: "1px solid #F3C0BA" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: "#C0392B", fontFamily: "Outfit,sans-serif" }}>Reported Problems (Disputes)</p>
          <span className="text-xs font-semibold" style={{ color: "#C0392B" }}>Requires Attention</span>
        </div>
        <div className="space-y-2">
          {disputes.map((d) => (
            <div key={d.id} className="flex items-center gap-3 bg-white rounded-xl p-3" style={{ border: "1px solid #F3C0BA" }}>
              <CategoryBadge category={d.category} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "#16233A" }}>{d.category}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF0EE", color: "#C0392B" }}>Disputed</span>
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
    );
  };

  // ── Reusable: completed jobs table (white) ──────────────────────────────────
  const CompletedJobsTable = () => {
    const fallback = MOCK_INCIDENTS.filter((i) => i.status === "RESOLVED").map((i) => ({
      id: i.id, category: i.category, area: i.location, contractor: "Al-Jalil Builders",
      cost: 185000, rating: 4, hasAfter: true,
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
    <div className="rounded-2xl overflow-hidden" style={{ background: "#F8F7F4", boxShadow: "0 4px 24px rgba(10,31,60,0.15)", minHeight: "680px", position: "relative" }}>

      {/* ── Top bar (dark for contrast) ── */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#0A1F3C" }}>
        <div>
          <p className="text-white font-bold text-base" style={{ fontFamily: "Outfit,sans-serif" }}>UCO Dashboard · UC-14 Gulberg Town</p>
          <p className="text-xs" style={{ color: "#8A99B0" }}>Officer: Kamran Sheikh · Union Council dashboard · District East</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#12345E", color: "#B0BAC8" }}>Export monthly report</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor: "#C6A55C", color: "#C6A55C" }}>Publish rankings</button>
        </div>
      </div>

      {/* ── Nav tabs (white) ── */}
      <div className="flex overflow-x-auto" style={{ background: "#FFFFFF", borderBottom: "1px solid #E6E3DC" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setActiveNav(n.id); setView("dashboard"); }}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-colors"
            style={{ color: activeNav === n.id ? "#0E8A5F" : "#5A6B84", borderBottom: activeNav === n.id ? "2px solid #0E8A5F" : "2px solid transparent" }}>
            {n.label}
          </button>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ top: 90, background: "#0E8A5F", boxShadow: "0 8px 24px rgba(14,138,95,0.4)" }}>
          <IconCheck size={16} color="white" /> {toast}
        </div>
      )}

      <div className="overflow-y-auto" style={{ maxHeight: "640px" }}>

        {/* ══ DASHBOARD ══ */}
        {view === "dashboard" && activeNav === "dashboard" && (
          <div className="p-5 space-y-5">
            <DisputesBanner />

            {/* KPI row */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "STREETS IN UC-14",  value: MOCK_UC_STATS.streets,          color: "#16233A" },
                { label: "AVERAGE SCORE",      value: MOCK_UC_STATS.avgScore,         color: "#0E8A5F" },
                { label: "OPEN COMPLAINTS",    value: MOCK_UC_STATS.openComplaints,   color: "#16233A" },
                { label: "OVERDUE",            value: MOCK_UC_STATS.overdue,          color: "#E0A400" },
                { label: "ACTIVE WORK ORDERS", value: MOCK_UC_STATS.activeWorkOrders + liveInProgress.length, color: "#16233A" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl p-4" style={{ ...CARD }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#5A6B84" }}>{k.label}</p>
                  <p className="text-3xl font-bold" style={{ color: k.color, fontFamily: "Outfit,sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Live map */}
              <div className="rounded-xl p-4" style={{ ...CARD }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Live street map · UC-14</p>
                <LiveMap height="260px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} className="rounded-xl" />
                <div className="flex gap-4 mt-3">
                  {[{l:"Good",c:"#0E8A5F"},{l:"Needs work",c:"#E0A400"},{l:"Urgent",c:"#C0392B"}].map((leg)=>(
                    <div key={leg.l} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                      <span className="text-[11px]" style={{ color: "#5A6B84" }}>{leg.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaint queue preview */}
              <div className="rounded-xl p-4" style={{ ...CARD }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Complaint queue</p>
                <div className="space-y-3">
                  {MOCK_COMPLAINT_QUEUE.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#F8F7F4" }}>
                      <CategoryBadge category={item.title.split(" ").slice(0,2).join(" ")} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold" style={{ color: "#16233A" }}>{item.title} · {item.street}</p>
                          {item.status === "overdue" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#C0392B", color: "white" }}>Overdue {item.daysOverdue}d</span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: "#5A6B84" }}>{item.code} · {item.verifiedByRep ? "verified by rep" : "pending rep verification"} · {item.daysOld}d old</p>
                      </div>
                      {item.status === "pending_rep" ? (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: "#F5F3EF", color: "#5A6B84" }}>Waiting</span>
                      ) : (
                        <button onClick={() => openWorkOrderModal(item.id === "cq-001" ? "inc-005" : "inc-003")}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white whitespace-nowrap" style={{ background: "#0E8A5F" }}>Create work order</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rankings + rep performance */}
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-xl p-4" style={{ ...CARD }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Street rankings · UC-14</p>
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
                      <tr key={row.rank} style={{ borderTop: "1px solid #E6E3DC" }}>
                        <td className="py-2 pr-2" style={{ color: "#16233A" }}>{row.rank}</td>
                        <td className="py-2 pr-2" style={{ color: row.flagged ? "#C0392B" : "#16233A" }}>{row.street}</td>
                        <td className="py-2 pr-2 font-bold" style={{ color: row.score >= 75 ? "#0E8A5F" : row.score >= 55 ? "#E0A400" : "#C0392B" }}>{row.score}</td>
                        <td className="py-2 pr-2" style={{ color: "#5A6B84" }}>{row.open}</td>
                        <td className="py-2 pr-2 font-bold" style={{ color: row.trend > 0 ? "#0E8A5F" : "#C0392B" }}>{row.trend > 0 ? "▲" : "▼"} {Math.abs(row.trend)}</td>
                        <td className="py-2" style={{ color: row.flagged ? "#C0392B" : "#5A6B84" }}>{row.rep}{row.flagged ? " · flagged" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
                        <p className="text-[11px]" style={{ color: rep.flagged ? "#C0392B" : "#5A6B84" }}>Verify avg {rep.avgVerifyHrs} hrs · {rep.checklists}% checklists · {rep.rating}★{rep.flagged ? " · review scheduled" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #E6E3DC" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#16233A" }}>Budget · July <span style={{ color: "#5A6B84", fontWeight: 400 }}>PKR</span></p>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>1.84M <span className="text-sm font-normal" style={{ color: "#5A6B84" }}>of 2.5M used</span></p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E6E3DC" }}>
                    <div className="h-full rounded-full" style={{ width: "73.6%", background: "linear-gradient(90deg,#0E8A5F,#12A874)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ COMPLAINT QUEUE tab ══ */}
        {view === "dashboard" && activeNav === "queue" && (
          <div className="p-5">
            <DisputesBanner />
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Complaint Queue</p>
                <p className="text-xs" style={{ color: "#5A6B84" }}>Sorted by priority · overdue first</p>
              </div>
              {!mergedDone && (
                <button onClick={() => setShowDuplicates(!showDuplicates)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "#FFF8E1", color: "#B8860B", border: "1px solid #C6A55C" }}>
                  <IconAlertTriangle size={14} color="#B8860B" /> AI: 5 duplicate reports detected
                </button>
              )}
            </div>

            {showDuplicates && !mergedDone && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#FFFFFF", border: "1px solid #C6A55C" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#FFF8E1", color: "#B8860B" }}>AI DETECTION</span>
                  <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>5 reports from same location — likely same issue</p>
                </div>
                <div className="space-y-2 mb-4">
                  {MOCK_DUPLICATE_REPORTS.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "#F8F7F4" }}>
                      <CategoryBadge category={r.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold" style={{ color: "#16233A" }}>{r.category}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.shortCode}</span>
                        </div>
                        <p className="text-[11px] italic" style={{ color: "#5A6B84" }}>&ldquo;{r.description}&rdquo;</p>
                        <p className="text-[10px]" style={{ color: "#5A6B84" }}>{r.street} · {r.distance_m}m away</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-3 mb-4" style={{ background: "#F8F7F4" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#B8860B" }}>AI Similarity Signals</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Distance", value: `≤${MOCK_DUPLICATE_SIGNALS.distance_m}m` },
                      { label: "Semantic similarity", value: `${(MOCK_DUPLICATE_SIGNALS.semantic_similarity * 100).toFixed(0)}%` },
                      { label: "Image similarity", value: `${(MOCK_DUPLICATE_SIGNALS.image_similarity * 100).toFixed(0)}%` },
                      { label: "Category match", value: MOCK_DUPLICATE_SIGNALS.category_match ? "Yes" : "No" },
                      { label: "Combined probability", value: `${(MOCK_DUPLICATE_SIGNALS.combined_probability * 100).toFixed(0)}%` },
                      { label: "Recommendation", value: "Merge" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xs font-bold" style={{ color: "#0E8A5F", fontFamily: "Outfit,sans-serif" }}>{s.value}</p>
                        <p className="text-[10px]" style={{ color: "#5A6B84" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setMergedDone(true); setShowDuplicates(false); }} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>Merge into Single Incident</button>
                  <button onClick={() => setShowDuplicates(false)} className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#F5F3EF", color: "#5A6B84" }}>Dismiss</button>
                </div>
              </div>
            )}

            {mergedDone && (
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "#E7F4EF", border: "1px solid #0E8A5F" }}>
                <IconCheck size={20} color="#0E8A5F" />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#0E8A5F" }}>5 reports merged into single incident</p>
                  <p className="text-xs" style={{ color: "#5A6B84" }}>INC-LHR-002 now has 7 supporting reports. Priority recalculated.</p>
                </div>
              </div>
            )}

            {/* Queue list with create work order */}
            <div className="space-y-2">
              {MOCK_INCIDENTS.slice().sort((a,b) => b.priorityScore - a.priorityScore).map((inc) => (
                <div key={inc.id} className="rounded-2xl p-4" style={{ ...CARD }}>
                  <div className="flex items-start gap-3">
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{inc.shortCode}</span>
                          </div>
                          <p className="text-[11px]" style={{ color: "#5A6B84" }}>{inc.location} · {inc.reportCount} reports</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusChip status={inc.status} />
                          <PriorityBadge band={inc.priorityBand} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {inc.status === "REOPENED"
                          ? <p className="text-xs font-semibold" style={{ color: "#C0392B" }}>↺ Citizen rejected — action needed</p>
                          : <span />}
                        {["SUBMITTED","VERIFIED","ASSIGNED"].includes(inc.status) && (
                          <button onClick={() => openWorkOrderModal(inc.id)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ background: "#0E8A5F" }}>Create work order</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ REVIEW tab ══ */}
        {view === "dashboard" && activeNav === "review" && (
          <div className="p-5">
            <DisputesBanner />
            <div className="mb-4">
              <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Incident Review</p>
              <p className="text-xs" style={{ color: "#5A6B84" }}>Review reports, track in-progress work, confirm completed resolutions</p>
            </div>

            <div className="flex gap-2 mb-5">
              {([
                ["review", "To Review", MOCK_INCIDENTS.filter((i) => ["SUBMITTED","VERIFIED","ASSIGNED"].includes(i.status)).length],
                ["in_progress", "In Progress", MOCK_INCIDENTS.filter((i) => ["IN_PROGRESS","RESOLUTION_SUBMITTED","AWAITING_CITIZEN_VERIFICATION","REOPENED"].includes(i.status)).length + liveInProgress.length],
                ["completed", "Completed", MOCK_INCIDENTS.filter((i) => i.status === "RESOLVED").length + liveCompleted.length],
              ] as const).map(([id, label, count]) => (
                <button key={id} onClick={() => setReviewTab(id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
                  style={{ background: reviewTab === id ? "#0E8A5F" : "#FFFFFF", color: reviewTab === id ? "white" : "#5A6B84", border: `1px solid ${reviewTab === id ? "#0E8A5F" : "#E6E3DC"}` }}>
                  {label}
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: reviewTab === id ? "rgba(255,255,255,0.25)" : "#F5F3EF", color: reviewTab === id ? "white" : "#5A6B84" }}>{count}</span>
                </button>
              ))}
            </div>

            {reviewTab === "review" && (
              <div className="space-y-4">
                {/* AI merged banner */}
                <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #C6A55C" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#FFF8E1", color: "#B8860B" }}>AI MERGED</span>
                    <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{MOCK_DUPLICATE_REPORTS.length} citizen reports merged into 1 incident</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {MOCK_DUPLICATE_REPORTS.slice(0, 4).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 rounded-xl p-2" style={{ background: "#F8F7F4" }}>
                        <CategoryBadge category={r.category} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate" style={{ color: "#16233A" }}>{r.shortCode}</p>
                          <p className="text-[10px] truncate" style={{ color: "#5A6B84" }}>{r.street} · {r.distance_m}m</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-xl p-2.5" style={{ background: "#F8F7F4" }}>
                    <span className="text-[10px] font-semibold" style={{ color: "#0E8A5F" }}>Combined confidence</span>
                    <span className="text-sm font-bold" style={{ color: "#0E8A5F", fontFamily: "Outfit,sans-serif" }}>{(MOCK_DUPLICATE_SIGNALS.combined_probability * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {MOCK_INCIDENTS.filter((i) => ["SUBMITTED","VERIFIED","ASSIGNED"].includes(i.status)).map((inc) => (
                  <div key={inc.id} className="rounded-2xl p-4" style={{ ...CARD }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={inc.category} size="md" />
                        <div>
                          <p className="text-sm font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                          <p className="text-[10px] font-mono" style={{ color: "#5A6B84" }}>{inc.shortCode}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusChip status={inc.status} />
                        <PriorityBadge band={inc.priorityBand} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Citizen Report (Before)</p>
                        <div className="rounded-xl h-24 flex items-center justify-center mb-1.5" style={{ background: "#0A1F3C" }}>
                          <CategoryBadge category={inc.category} size="lg" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#0A1F3C" }}>H</div>
                          <p className="text-[10px]" style={{ color: "#5A6B84" }}>Reported by citizen</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Street Rep Verification</p>
                        <div className="rounded-xl h-24 flex items-center justify-center mb-1.5" style={{ background: inc.repVerified ? "#E7F4EF" : "#F5F3EF", border: `1px solid ${inc.repVerified ? "#0E8A5F" : "#E6E3DC"}` }}>
                          {inc.repVerified ? <IconCheck size={28} color="#0E8A5F" /> : <span className="text-[10px]" style={{ color: "#5A6B84" }}>Pending rep visit</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#C6A55C", color: "#0A1F3C" }}>AR</div>
                          <p className="text-[10px]" style={{ color: inc.repVerified ? "#0E8A5F" : "#5A6B84" }}>{inc.repVerified ? "Ahmed Raza · verified" : "Awaiting Ahmed Raza"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl p-2.5 mb-3" style={{ background: "#F8F7F4" }}>
                      <p className="text-[11px] font-medium" style={{ color: "#16233A" }}>{inc.location}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: "#5A6B84" }}>{inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}</p>
                    </div>
                    <button onClick={() => openWorkOrderModal(inc.id)} className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "#0E8A5F" }}>Review &amp; Create Work Order</button>
                  </div>
                ))}
              </div>
            )}

            {reviewTab === "in_progress" && (
              <div className="space-y-2">
                {liveInProgress.map((w) => (
                  <div key={w.id} className="rounded-2xl p-4" style={{ ...CARD }}>
                    <div className="flex items-start gap-3">
                      <CategoryBadge category={w.category} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="text-xs font-bold" style={{ color: "#16233A" }}>{w.category}</p>
                            <p className="text-[10px] font-mono" style={{ color: "#5A6B84" }}>{w.shortCode} · {w.address}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: w.status === "IN_PROGRESS" ? "#FFF3E0" : "#EAF0FA", color: w.status === "IN_PROGRESS" ? "#B8860B" : "#0E2A4E" }}>{w.status === "IN_PROGRESS" ? "Contractor working" : "Assigned"}</span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: "#5A6B84" }}>Contractor: {w.contractor}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {MOCK_INCIDENTS.filter((i) => ["IN_PROGRESS","RESOLUTION_SUBMITTED","AWAITING_CITIZEN_VERIFICATION","REOPENED"].includes(i.status)).map((inc) => (
                  <button key={inc.id} onClick={() => openIncident(inc.id)} className="w-full text-left rounded-2xl p-4" style={{ ...CARD }}>
                    <div className="flex items-start gap-3">
                      <CategoryBadge category={inc.category} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                            <p className="text-[10px] font-mono" style={{ color: "#5A6B84" }}>{inc.shortCode} · {inc.location}</p>
                          </div>
                          <StatusChip status={inc.status} />
                        </div>
                        {inc.status === "REOPENED" && <p className="text-[11px] font-semibold mt-1.5" style={{ color: "#C0392B" }}>↺ Citizen rejected — needs re-work</p>}
                        {inc.status === "AWAITING_CITIZEN_VERIFICATION" && <p className="text-[11px] font-semibold mt-1.5" style={{ color: "#C6A55C" }}>⏳ Waiting on citizen confirmation</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {reviewTab === "completed" && <CompletedJobsTable />}
          </div>
        )}

        {/* ══ MAP tab ══ */}
        {view === "dashboard" && activeNav === "map" && (
          <div className="p-5">
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Live Incident Map · UC-14</p>
            <LiveMap height="440px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} />
            <div className="flex gap-4 mt-3">
              {[{l:"Critical",c:"#C0392B"},{l:"High",c:"#C6A55C"},{l:"Medium",c:"#E0A400"},{l:"Resolved",c:"#0E8A5F"}].map((leg)=>(
                <div key={leg.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                  <span className="text-xs" style={{ color: "#5A6B84" }}>{leg.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ REPS tab ══ */}
        {view === "dashboard" && activeNav === "reps" && (
          <div className="p-5 space-y-3">
            <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Representatives</p>
            {MOCK_REP_PERFORMANCE.map((rep) => (
              <div key={rep.initials} className="rounded-2xl p-4 flex items-center gap-3" style={{ ...CARD }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold" style={{ background: rep.flagged ? "#FEF0EE" : "#EAF0FA", color: rep.flagged ? "#C0392B" : "#0E2A4E" }}>{rep.initials}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: "#16233A" }}>{rep.name}</p>
                  <p className="text-[11px]" style={{ color: "#5A6B84" }}>Verify avg {rep.avgVerifyHrs} hrs · {rep.checklists}% checklists · {rep.rating}★</p>
                </div>
                {rep.repOfMonth && <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#FFF8E1", color: "#B8860B" }}>★ Rep of Month</span>}
              </div>
            ))}
          </div>
        )}

        {/* ══ BUDGET tab ══ */}
        {view === "dashboard" && activeNav === "budget" && (
          <div className="p-5">
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Budget · July 2026</p>
            <div className="rounded-2xl p-5" style={{ ...CARD }}>
              <p className="text-3xl font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>PKR 1.84M <span className="text-base font-normal" style={{ color: "#5A6B84" }}>of 2.5M used</span></p>
              <div className="h-2.5 rounded-full overflow-hidden mt-3" style={{ background: "#E6E3DC" }}>
                <div className="h-full rounded-full" style={{ width: "73.6%", background: "linear-gradient(90deg,#0E8A5F,#12A874)" }} />
              </div>
            </div>
            <div className="mt-5"><CompletedJobsTable /></div>
          </div>
        )}

        {/* ══ INCIDENT DETAIL ══ */}
        {view === "incident-detail" && selectedIncident && (
          <div className="p-5 space-y-4">
            <button onClick={() => setView("dashboard")} className="flex items-center gap-1 text-xs mb-1" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back to queue
            </button>
            <div className="rounded-2xl p-4 flex items-start justify-between" style={{ ...CARD }}>
              <div>
                <p className="text-xs font-mono mb-1" style={{ color: "#5A6B84" }}>{selectedIncident.shortCode}</p>
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={selectedIncident.category} size="md" />
                  <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{selectedIncident.category}</p>
                </div>
                <p className="text-xs" style={{ color: "#5A6B84" }}>{selectedIncident.location} · {selectedIncident.reportCount} reports · {formatDate(selectedIncident.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusChip status={selectedIncident.status} size="md" />
                <PriorityBadge band={selectedIncident.priorityBand} score={selectedIncident.priorityScore} showScore />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>LOCATION</p>
              <LiveMap height="180px" center={[selectedIncident.lng, selectedIncident.lat]} zoom={15}
                markers={[{ id: selectedIncident.id, lng: selectedIncident.lng, lat: selectedIncident.lat, color: "#C0392B", label: selectedIncident.shortCode, category: selectedIncident.category }]} />
            </div>
            {selectedIncident.aiSummary && (
              <div className="rounded-2xl p-4" style={{ ...CARD }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#B8860B" }}>AI Intelligence</p>
                <p className="text-xs mb-3" style={{ color: "#5A6B84" }}>{selectedIncident.aiSummary}</p>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden" style={{ ...CARD }}>
              <div className="px-4 py-2" style={{ borderBottom: "1px solid #E6E3DC" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5A6B84" }}>Status Timeline</p>
              </div>
              <Timeline status={selectedIncident.status} repVerified={selectedIncident.repVerified} />
            </div>
            {["SUBMITTED","VERIFIED","ASSIGNED"].includes(selectedIncident.status) && (
              <button onClick={() => openWorkOrderModal(selectedIncident.id)} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>Create Work Order</button>
            )}
          </div>
        )}
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
