"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Timeline } from "@/components/ui/Timeline";
import { LiveMap } from "@/components/ui/LiveMap";
import { Button } from "@/components/ui/Button";
import { CategoryBadge, IconCheck, IconArrowLeft, IconCamera, IconAlertTriangle, IconTrendingUp, IconSettings, IconUpload } from "@/components/ui/Icons";
import {
  MOCK_INCIDENTS, MOCK_UC_STATS, MOCK_COMPLAINT_QUEUE,
  MOCK_STREET_RANKINGS, MOCK_REP_PERFORMANCE,
  MOCK_DUPLICATE_REPORTS, MOCK_DUPLICATE_SIGNALS,
  LAHORE_INCIDENT_MARKERS,
} from "@/lib/mock-data";
import { formatRelativeTime, formatDate } from "@/lib/utils";

type View = "dashboard" | "incident-detail" | "resolve";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "queue",     label: "Complaint Queue" },
  { id: "map",       label: "Live Map" },
  { id: "reps",      label: "Representatives" },
  { id: "budget",    label: "Budget" },
];

// dark card style
const DC = "rounded-xl p-4";
const DARK_CARD = { background: "#0E2A4E", border: "1px solid #12345E" };

export default function DepartmentApp() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [view, setView]           = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [resDesc, setResDesc]     = useState("");
  const [resImage, setResImage]   = useState(false);
  const [resDone, setResDone]     = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [mergedDone, setMergedDone] = useState(false);

  const selectedIncident = MOCK_INCIDENTS.find((i) => i.id === selectedId);

  function openIncident(id: string) { setSelectedId(id); setView("incident-detail"); setResDone(false); setResDesc(""); setResImage(false); }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#081426", boxShadow: "0 4px 24px rgba(0,0,0,0.5)", minHeight: "680px" }}>

      {/* ── Top bar ── */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#0A1F3C", borderBottom: "1px solid #12345E" }}>
        <div>
          <p className="text-white font-bold text-base" style={{ fontFamily: "Outfit,sans-serif" }}>UC-14 Operations · Gulberg Town</p>
          <p className="text-xs" style={{ color: "#5A6B84" }}>Officer: Kamran Sheikh · Union Council dashboard · District East</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#12345E", color: "#B0BAC8" }}>Export monthly report</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor: "#C6A55C", color: "#C6A55C" }}>Publish rankings</button>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div className="flex overflow-x-auto" style={{ background: "#0E2A4E", borderBottom: "1px solid #12345E" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setActiveNav(n.id); setView("dashboard"); }}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-colors"
            style={{ color: activeNav === n.id ? "white" : "#5A6B84", borderBottom: activeNav === n.id ? "2px solid #0E8A5F" : "2px solid transparent" }}>
            {n.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "620px" }}>

        {/* ══ DASHBOARD ═════════════════════════════════════════════════════ */}
        {view === "dashboard" && activeNav === "dashboard" && (
          <div className="p-5 space-y-5">

            {/* KPI row — 5 cards */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "STREETS IN UC-14",     value: MOCK_UC_STATS.streets,          color: "white"    },
                { label: "AVERAGE SCORE",         value: MOCK_UC_STATS.avgScore,         color: "#0E8A5F"  },
                { label: "OPEN COMPLAINTS",       value: MOCK_UC_STATS.openComplaints,   color: "white"    },
                { label: "OVERDUE",               value: MOCK_UC_STATS.overdue,          color: "#E0A400"  },
                { label: "ACTIVE WORK ORDERS",    value: MOCK_UC_STATS.activeWorkOrders, color: "white"    },
              ].map((k) => (
                <div key={k.label} className={DC} style={{ ...DARK_CARD }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#5A6B84" }}>{k.label}</p>
                  <p className="text-3xl font-bold" style={{ color: k.color, fontFamily: "Outfit,sans-serif" }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-5">
              {/* Live street map */}
              <div className={DC} style={{ ...DARK_CARD }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>Live street map · UC-14</p>
                  <p className="text-xs" style={{ color: "#5A6B84" }}>hover a street</p>
                </div>
                <LiveMap
                  height="260px"
                  markers={LAHORE_INCIDENT_MARKERS}
                  zoom={12}
                  className="rounded-xl"
                />
                <div className="flex gap-4 mt-3">
                  {[{l:"Good",c:"#0E8A5F"},{l:"Needs work",c:"#E0A400"},{l:"Urgent",c:"#C0392B"}].map((leg)=>(
                    <div key={leg.l} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                      <span className="text-[11px]" style={{ color: "#5A6B84" }}>{leg.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaint queue */}
              <div className={DC} style={{ ...DARK_CARD }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>Complaint queue</p>
                  <p className="text-[11px]" style={{ color: "#5A6B84" }}>overdue rise to top</p>
                </div>
                <div className="space-y-3">
                  {MOCK_COMPLAINT_QUEUE.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#081426" }}>
                      <CategoryBadge category={item.title.split(" ").slice(0,2).join(" ")} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-bold text-white">{item.title} · {item.street}</p>
                          {item.status === "overdue" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#C0392B", color: "white" }}>
                              Overdue {item.daysOverdue}d
                            </span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: "#5A6B84" }}>
                          {item.code} · {item.verifiedByRep ? "verified by rep" : "pending rep verification"} · {item.daysOld}d old
                        </p>
                      </div>
                      {item.status === "pending_rep" ? (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: "#12345E", color: "#5A6B84" }}>Waiting</span>
                      ) : (
                        <button onClick={() => openIncident(item.id === "cq-001" ? "inc-005" : "inc-003")}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white whitespace-nowrap" style={{ background: "#0E8A5F" }}>
                          Create work order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom two-col */}
            <div className="grid grid-cols-2 gap-5">
              {/* Street rankings */}
              <div className={DC} style={{ ...DARK_CARD }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>Street rankings · UC-14</p>
                  <p className="text-[11px]" style={{ color: "#5A6B84" }}>public after publishing</p>
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
                      <tr key={row.rank} style={{ borderTop: "1px solid #12345E" }}>
                        <td className="py-2 pr-2 text-white">{row.rank}</td>
                        <td className="py-2 pr-2" style={{ color: row.flagged ? "#C0392B" : "white" }}>{row.street}</td>
                        <td className="py-2 pr-2 font-bold" style={{ color: row.score >= 75 ? "#0E8A5F" : row.score >= 55 ? "#E0A400" : "#C0392B", fontFamily: "Outfit,sans-serif" }}>{row.score}</td>
                        <td className="py-2 pr-2" style={{ color: "#5A6B84" }}>{row.open}</td>
                        <td className="py-2 pr-2 font-bold" style={{ color: row.trend > 0 ? "#0E8A5F" : "#C0392B" }}>
                          {row.trend > 0 ? "▲" : "▼"} {Math.abs(row.trend)}
                        </td>
                        <td className="py-2" style={{ color: row.flagged ? "#C0392B" : "#B0BAC8" }}>
                          {row.rep}{row.flagged ? " · flagged" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rep performance */}
              <div className={DC} style={{ ...DARK_CARD }}>
                <p className="text-sm font-bold text-white mb-3" style={{ fontFamily: "Outfit,sans-serif" }}>Representative performance</p>
                <div className="space-y-3">
                  {MOCK_REP_PERFORMANCE.map((rep) => (
                    <div key={rep.initials} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: rep.flagged ? "#3a0a0a" : "#12345E", color: rep.flagged ? "#C0392B" : "white", fontFamily: "Outfit,sans-serif" }}>
                        {rep.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-white">{rep.name}</p>
                          {rep.repOfMonth && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#3a2800", color: "#C6A55C", border: "1px solid #C6A55C" }}>
                              ★ Rep of the Month
                            </span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: rep.flagged ? "#C0392B" : "#5A6B84" }}>
                          Verify avg {rep.avgVerifyHrs} hrs · {rep.checklists}% checklists · {rep.rating}★
                          {rep.flagged ? " · review scheduled" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Budget */}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid #12345E" }}>
                  <p className="text-xs font-semibold text-white mb-2">Budget · July <span style={{ color: "#5A6B84", fontWeight: 400 }}>PKR</span></p>
                  <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>1.84M
                    <span className="text-sm font-normal ml-1" style={{ color: "#5A6B84" }}>of 2.5M used</span>
                  </p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#12345E" }}>
                    <div className="h-full rounded-full" style={{ width: "73.6%", background: "linear-gradient(90deg,#0E8A5F,#12A874)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ COMPLAINT QUEUE tab ═══════════════════════════════════════════ */}
        {view === "dashboard" && activeNav === "queue" && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>Complaint Queue</p>
                <p className="text-xs" style={{ color: "#5A6B84" }}>Sorted by priority · overdue first</p>
              </div>

              {/* AI Duplicate detection banner */}
              {!mergedDone && (
                <button onClick={() => setShowDuplicates(!showDuplicates)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "#12345E", color: "#C6A55C", border: "1px solid #C6A55C" }}>
                  <IconAlertTriangle size={14} color="#C6A55C" />
                  AI: 5 duplicate reports detected
                </button>
              )}
            </div>

            {/* Duplicate detection panel */}
            {showDuplicates && !mergedDone && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#0E2A4E", border: "1px solid #C6A55C" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#C6A55C20", color: "#C6A55C" }}>AI DETECTION</span>
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>5 reports from same location — likely same issue</p>
                </div>
                <div className="space-y-2 mb-4">
                  {MOCK_DUPLICATE_REPORTS.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "#081426" }}>
                      <CategoryBadge category={r.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white">{r.category}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#12345E", color: "#B0BAC8" }}>{r.shortCode}</span>
                        </div>
                        <p className="text-[11px] italic" style={{ color: "#5A6B84" }}>"{r.description}"</p>
                        <p className="text-[10px]" style={{ color: "#5A6B84" }}>{r.street} · {r.distance_m}m away</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Signals */}
                <div className="rounded-xl p-3 mb-4" style={{ background: "#081426" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#C6A55C" }}>AI Similarity Signals</p>
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
                  <button onClick={() => { setMergedDone(true); setShowDuplicates(false); }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>
                    Merge into Single Incident
                  </button>
                  <button onClick={() => setShowDuplicates(false)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#12345E", color: "#5A6B84" }}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {mergedDone && (
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "#0E2A4E", border: "1px solid #0E8A5F" }}>
                <IconCheck size={20} color="#0E8A5F" />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#0E8A5F" }}>5 reports merged into single incident</p>
                  <p className="text-xs" style={{ color: "#5A6B84" }}>INC-LHR-002 now has 7 supporting reports. Priority recalculated.</p>
                </div>
              </div>
            )}

            {/* Full incident list */}
            <div className="space-y-2">
              {MOCK_INCIDENTS.sort((a,b) => b.priorityScore - a.priorityScore).map((inc) => (
                <button key={inc.id} onClick={() => openIncident(inc.id)}
                  className="w-full text-left rounded-2xl p-4 transition-all hover:border-[#0E8A5F]"
                  style={{ background: "#0E2A4E", border: `1px solid ${selectedId === inc.id ? "#0E8A5F" : "#12345E"}` }}>
                  <div className="flex items-start gap-3">
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-white">{inc.category}</p>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#12345E", color: "#B0BAC8" }}>{inc.shortCode}</span>
                          </div>
                          <p className="text-[11px]" style={{ color: "#5A6B84" }}>{inc.location} · {inc.reportCount} reports</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusChip status={inc.status} />
                          <PriorityBadge band={inc.priorityBand} />
                        </div>
                      </div>
                      {inc.status === "REOPENED" && (
                        <p className="text-xs font-semibold mt-1" style={{ color: "#C0392B" }}>↺ Citizen rejected — action needed</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ MAP tab ═══════════════════════════════════════════════════════ */}
        {view === "dashboard" && activeNav === "map" && (
          <div className="p-5">
            <p className="text-base font-bold text-white mb-3" style={{ fontFamily: "Outfit,sans-serif" }}>Live Incident Map · UC-14</p>
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

        {/* ══ INCIDENT DETAIL ═══════════════════════════════════════════════ */}
        {view === "incident-detail" && selectedIncident && (
          <div className="p-5 space-y-4">
            <button onClick={() => setView("dashboard")} className="flex items-center gap-1 text-xs mb-1" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back to queue
            </button>

            {/* Header */}
            <div className="rounded-2xl p-4 flex items-start justify-between" style={{ background: "#0E2A4E", border: "1px solid #12345E" }}>
              <div>
                <p className="text-xs font-mono mb-1" style={{ color: "#5A6B84" }}>{selectedIncident.shortCode}</p>
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={selectedIncident.category} size="md" />
                  <p className="text-sm font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>{selectedIncident.category}</p>
                </div>
                <p className="text-xs" style={{ color: "#5A6B84" }}>{selectedIncident.location} · {selectedIncident.reportCount} reports · {formatDate(selectedIncident.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusChip status={selectedIncident.status} size="md" />
                <PriorityBadge band={selectedIncident.priorityBand} score={selectedIncident.priorityScore} showScore />
              </div>
            </div>

            {/* Real map */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>LOCATION</p>
              <LiveMap height="180px" center={[selectedIncident.lng, selectedIncident.lat]} zoom={15}
                markers={[{ id: selectedIncident.id, lng: selectedIncident.lng, lat: selectedIncident.lat, color: "#C0392B", label: selectedIncident.shortCode, category: selectedIncident.category }]} />
            </div>

            {/* AI Intelligence */}
            {selectedIncident.aiSummary && (
              <div className="rounded-2xl p-4" style={{ background: "#0E2A4E", border: "1px solid #12345E" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#C6A55C" }}>AI Intelligence</p>
                <p className="text-xs mb-3" style={{ color: "#B0BAC8" }}>{selectedIncident.aiSummary}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Category confidence", value: "87%" },
                    { label: "Severity", value: selectedIncident.severity.toUpperCase() },
                    { label: "Relevance", value: "92%" },
                    { label: "Duplicate probability", value: "<5%" },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between text-xs">
                      <span style={{ color: "#5A6B84" }}>{r.label}</span>
                      <span className="font-bold text-white">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority explanation */}
            <div className="rounded-2xl p-4" style={{ background: "#0E2A4E", border: "1px solid #12345E" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Priority Score · {selectedIncident.priorityScore.toFixed(0)}/100</p>
              {[
                { f: "Severity",           w: 0.30, v: 0.87, label: selectedIncident.severity },
                { f: "Citizen support",    w: 0.20, v: 0.67, label: `${selectedIncident.reportCount} reports` },
                { f: "Population/context", w: 0.20, v: 0.80, label: "Dense area" },
                { f: "Location sensitivity",w:0.15, v: 0.70, label: "Near market" },
                { f: "Duration",           w: 0.15, v: 0.50, label: "3 days" },
              ].map((row) => (
                <div key={row.f} className="flex items-center gap-2 mb-2">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-[10px]" style={{ color: "#5A6B84" }}>{row.f}</p>
                    <p className="text-[10px] font-semibold text-white">{row.label}</p>
                  </div>
                  <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "#12345E" }}>
                    <div className="h-full rounded-full" style={{ width: `${row.v * 100}%`, background: "#0E8A5F" }} />
                  </div>
                  <span className="text-[10px] w-10 text-right" style={{ color: "#5A6B84" }}>{(row.w * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="rounded-2xl overflow-hidden">
              <div className="px-4 py-2" style={{ background: "#0E2A4E", borderBottom: "1px solid #12345E" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#5A6B84" }}>Status Timeline</p>
              </div>
              <Timeline status={selectedIncident.status} repVerified={selectedIncident.repVerified} />
            </div>

            {/* Actions */}
            {selectedIncident.status === "ASSIGNED" && (
              <button className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>
                Mark In Progress
              </button>
            )}
            {selectedIncident.status === "IN_PROGRESS" && (
              <button onClick={() => setView("resolve")} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>
                Submit Resolution Evidence
              </button>
            )}
            {selectedIncident.status === "REOPENED" && (
              <div className="rounded-2xl p-4" style={{ background: "#2a0a0a", border: "1px solid #C0392B" }}>
                <p className="text-sm font-bold mb-1" style={{ color: "#C0392B" }}>↺ Incident Reopened</p>
                <p className="text-xs mb-3" style={{ color: "#B0BAC8" }}>Citizen rejected the resolution. Submit new evidence.</p>
                <button onClick={() => setView("resolve")} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>
                  Re-submit Resolution
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ RESOLUTION FORM ═══════════════════════════════════════════════ */}
        {view === "resolve" && selectedIncident && (
          <div className="p-5">
            <button onClick={() => setView("incident-detail")} className="flex items-center gap-1 text-xs mb-4" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            <p className="text-base font-bold text-white mb-1" style={{ fontFamily: "Outfit,sans-serif" }}>Submit Resolution Evidence</p>
            <p className="text-xs mb-5" style={{ color: "#5A6B84" }}>A resolution photo and description are required.</p>

            {!resDone ? (
              <div className="space-y-4">
                {/* Photo upload */}
                <div className="rounded-2xl p-4" style={{ background: "#0E2A4E", border: "1px solid #12345E" }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: "#5A6B84" }}>RESOLUTION PHOTO *</p>
                  {!resImage ? (
                    <button onClick={() => setResImage(true)}
                      className="w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 transition-colors"
                      style={{ borderColor: "#12345E" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0E8A5F"; (e.currentTarget as HTMLElement).style.background = "rgba(14,138,95,0.06)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#12345E"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                      <IconUpload size={24} color="#5A6B84" />
                      <p className="text-sm font-semibold" style={{ color: "#5A6B84" }}>Upload resolution photo</p>
                      <p className="text-xs" style={{ color: "#5A6B84" }}>JPEG · PNG · WEBP · Max 10 MB</p>
                    </button>
                  ) : (
                    <div className="relative">
                      <div className="w-full h-40 rounded-xl flex items-center justify-center" style={{ background: "rgba(14,138,95,0.1)", border: "1px solid #0E8A5F" }}>
                        <IconCheck size={36} color="#0E8A5F" />
                      </div>
                      <button onClick={() => setResImage(false)} className="absolute top-2 right-2 w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: "#C0392B" }}>✕</button>
                      <p className="text-xs mt-1.5 font-medium" style={{ color: "#0E8A5F" }}>✓ resolution_photo.jpg</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="rounded-2xl p-4" style={{ background: "#0E2A4E", border: "1px solid #12345E" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>RESOLUTION DESCRIPTION * (min 20 chars)</p>
                  <textarea value={resDesc} onChange={(e) => setResDesc(e.target.value)}
                    placeholder="Describe what work was done…"
                    className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                    style={{ background: "#081426", border: "1.5px solid #12345E", color: "white" }}
                    rows={4} maxLength={1000} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px]" style={{ color: resDesc.length < 20 ? "#C0392B" : "#0E8A5F" }}>
                      {resDesc.length < 20 ? `${20 - resDesc.length} more characters needed` : "✓ Description ready"}
                    </span>
                    <span className="text-[11px]" style={{ color: "#5A6B84" }}>{resDesc.length}/1000</span>
                  </div>
                </div>

                <button className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
                  style={{ background: resImage && resDesc.length >= 20 ? "#0E8A5F" : "#12345E", color: resImage && resDesc.length >= 20 ? "white" : "#5A6B84" }}
                  disabled={!resImage || resDesc.length < 20}
                  onClick={() => setResDone(true)}>
                  Submit Resolution
                </button>
                <p className="text-xs text-center" style={{ color: "#5A6B84" }}>Citizen will be notified to verify.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(14,138,95,0.15)", border: "2px solid #0E8A5F" }}>
                  <IconCheck size={32} color="#0E8A5F" />
                </div>
                <p className="text-base font-bold text-white" style={{ fontFamily: "Outfit,sans-serif" }}>Resolution Submitted!</p>
                <p className="text-xs mt-2" style={{ color: "#5A6B84" }}>Citizen notified. They have 7 days to verify.</p>
                <div className="mt-3"><StatusChip status="AWAITING_CITIZEN_VERIFICATION" size="md" /></div>
                <button onClick={() => setView("dashboard")} className="mt-6 px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>Back to Queue</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
