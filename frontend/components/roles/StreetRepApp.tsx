"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Timeline } from "@/components/ui/Timeline";
import { LiveMap } from "@/components/ui/LiveMap";
import { Button } from "@/components/ui/Button";
import { CategoryBadge, IconHome, IconMap, IconClipboard, IconChat, IconUser, IconCamera, IconArrowLeft, IconCheck, IconMerge, IconAlertTriangle } from "@/components/ui/Icons";
import {
  MOCK_INCIDENTS, MOCK_STREET_AREA, MOCK_AREA_INCIDENTS,
  MOCK_STREET_REP_UPDATES, MOCK_CITIZEN_MESSAGES,
  MOCK_REP_PENDING_REPORTS, LAHORE_INCIDENT_MARKERS,
} from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";
import { formatRelativeTime, formatDate } from "@/lib/utils";

type View = "home" | "verify-list" | "verify-detail" | "area-map" | "incidents" | "incident-detail" | "field-report" | "messages" | "profile";

const HEALTH_COLOR = (s: number) => s >= 75 ? "#0E8A5F" : s >= 50 ? "#E0A400" : "#C0392B";

export default function StreetRepApp() {
  const [view, setView]                     = useState<View>("home");
  const [selectedReportId, setSelectedRep]  = useState<string | null>(null);
  const [selectedIncidentId, setSelectedInc]= useState<string | null>(null);
  const [verifiedIds, setVerifiedIds]       = useState<string[]>([]);
  const [rejectedIds, setRejectedIds]       = useState<string[]>([]);
  const [mergedIds, setMergedIds]           = useState<string[]>([]);
  const [fieldType, setFieldType]           = useState<"escalation"|"field-note"|"verification">("field-note");
  const [fieldNote, setFieldNote]           = useState("");
  const [fieldRef, setFieldRef]             = useState("");
  const [fieldImage, setFieldImage]         = useState(false);
  const [fieldDone, setFieldDone]           = useState(false);
  const [replyText, setReplyText]           = useState("");
  const [replyMsgId, setReplyMsgId]         = useState<string|null>(null);

  const area             = MOCK_STREET_AREA;
  const { liveReports, verifyReport: verifyLiveReport, rejectReport: rejectLiveReport } = useAppState();

  // Combine live submitted reports + static pending
  const livePending = liveReports
    .filter((r) => r.status === "SUBMITTED")
    .map((r) => ({ id: r.id, shortCode: r.shortCode, category: r.category, description: r.description, street: r.street, submittedAt: r.submittedAt, hasPhoto: r.hasPhoto, isLive: true as const }));

  const staticPending = MOCK_REP_PENDING_REPORTS
    .filter((r) => !verifiedIds.includes(r.id) && !rejectedIds.includes(r.id) && !mergedIds.includes(r.id))
    .map((r) => ({ ...r, isLive: false as const }));

  const pendingReports   = [...livePending, ...staticPending];
  const selectedReport   = [...livePending, ...MOCK_REP_PENDING_REPORTS].find((r) => r.id === selectedReportId);
  const selectedIncident = MOCK_INCIDENTS.find((i) => i.id === selectedIncidentId);
  const unreadMsgs       = MOCK_CITIZEN_MESSAGES.filter((m) => !m.read).length;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#F5F3EF", minHeight: 780, position: "relative" }}>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-4 py-1" style={{ background: "#0A1F3C" }}>
        <span className="text-white text-xs font-medium">11:42</span>
        <span className="text-white text-xs font-semibold" style={{ fontFamily: "Outfit,sans-serif" }}>CivicPulse</span>
        <span className="text-white text-xs">▲ 5G ▮</span>
      </div>

      {/* ── Rep header card (only on non-home views) ── */}
      {view !== "home" && (view === "verify-list" || view === "verify-detail") && (
        <div className="px-4 pt-3 pb-3 flex items-center justify-between" style={{ background: "#F5F3EF", borderBottom: "1px solid #E6E3DC" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#C6A55C" }}>Street Representative</p>
            <p className="font-bold text-base leading-tight" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Ahmed Raza · UC-14</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "#0A1F3C" }}>AR</div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 718, paddingBottom: 68 }}>

        {/* ══ HOME ══════════════════════════════════════════════════════════ */}
        {view === "home" && (
          <div className="pb-2" style={{ background: "#F5F3EF" }}>
            {/* My Streets header */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>My Streets</p>
                  <p className="text-sm" style={{ color: "#5A6B84" }}>Ahmed Raza · Street Representative, UC-14</p>
                </div>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "#0A1F3C", fontFamily: "Outfit,sans-serif" }}>AR</div>
              </div>
            </div>

            {/* Street score cards */}
            <div className="px-5 space-y-3 mb-4">
              {[
                { name: "Street 14, Block 6", score: 82, inspection: "Next inspection: 1 Aug",    condition: "Good",       condColor: "#0E8A5F", condBg: "#E7F4EF", strokeColor: "#0E8A5F" },
                { name: "Street 15, Block 6", score: 76, inspection: "Next inspection: 3 Aug",    condition: "Good",       condColor: "#0E8A5F", condBg: "#E7F4EF", strokeColor: "#0E8A5F" },
                { name: "Street 9, Block 7",  score: 61, inspection: "Next inspection: Due in 4 days", condition: "Needs work", condColor: "#B8860B", condBg: "#FFF8E1", strokeColor: "#E0A400" },
              ].map((s) => (
                <div key={s.name} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="#E6E3DC" strokeWidth="5" />
                    <circle cx="36" cy="36" r="28" fill="none" stroke={s.strokeColor} strokeWidth="5"
                      strokeDasharray={`${(s.score / 100) * 175.9} 175.9`}
                      strokeLinecap="round" transform="rotate(-90 36 36)" />
                    <text x="36" y="38" textAnchor="middle" fontSize="15" fontWeight="700" fill="#16233A" fontFamily="Outfit,sans-serif">{s.score}</text>
                    <text x="36" y="50" textAnchor="middle" fontSize="9" fill="#5A6B84">/100</text>
                  </svg>
                  <div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: "#16233A" }}>{s.name}</p>
                    <p className="text-xs mb-2" style={{ color: "#5A6B84" }}>{s.inspection}</p>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: s.condBg, color: s.condColor }}>{s.condition}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verify reports CTA */}
            <div className="px-5 space-y-2">
              <button onClick={() => setView("verify-list")}
                className="w-full rounded-2xl py-4 flex items-center justify-between px-5 text-white font-bold text-base"
                style={{ background: "#0E8A5F", boxShadow: "0 4px 16px rgba(14,138,95,0.35)", fontFamily: "Outfit,sans-serif" }}>
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Verify reports
                </div>
                {pendingReports.length > 0 && (
                  <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-sm" style={{ color: "#0E8A5F" }}>{pendingReports.length}</span>
                )}
              </button>

              <button className="w-full bg-white rounded-2xl py-4 flex items-center gap-3 px-5 text-sm font-semibold" style={{ color: "#16233A", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                Monthly checklist · St 9
              </button>

              <button className="w-full bg-white rounded-2xl py-4 flex items-center justify-between px-5 text-sm font-semibold" style={{ color: "#16233A", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#E7F4EF" }}>
                    <IconCheck size={12} color="#0E8A5F" />
                  </div>
                  Verify completed work
                </div>
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ background: "#0E8A5F" }}>1</span>
              </button>
            </div>
          </div>
        )}

        {/* ══ VERIFY LIST — matches screenshot ════════════════════════════ */}
        {view === "verify-list" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-xs mb-1 font-medium" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> My Streets
            </button>
            <p className="text-xl font-bold mb-0.5" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Verify reports</p>
            <p className="text-sm mb-4" style={{ color: "#5A6B84" }}>{pendingReports.length} waiting · verify within 24 hrs</p>

            <div className="space-y-3">
              {pendingReports.map((r) => (
                <button key={r.id} onClick={() => { setSelectedRep(r.id); setView("verify-detail"); }}
                  className="w-full text-left bg-white rounded-2xl p-4 transition-shadow hover:shadow-md"
                  style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)", border: "1px solid #F0EDE6" }}>
                  <div className="flex items-start gap-3">
                    <CategoryBadge category={r.category} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold" style={{ color: "#16233A" }}>{r.category}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.shortCode}</span>
                      </div>
                      <p className="text-xs italic mb-2" style={{ color: "#5A6B84" }}>"{r.description}"</p>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#FFF3E0", color: "#B8860B" }}>
                        Awaiting verification
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {pendingReports.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#E7F4EF" }}>
                    <IconCheck size={24} color="#0E8A5F" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#16233A" }}>All reports verified!</p>
                  <p className="text-xs mt-1" style={{ color: "#5A6B84" }}>No pending verifications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ VERIFY DETAIL — matches screenshot ══════════════════════════ */}
        {view === "verify-detail" && selectedReport && (
          <div className="px-4 py-4">
            <button onClick={() => setView("verify-list")} className="flex items-center gap-1 text-xs mb-1 font-medium" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> My Streets
            </button>
            <p className="text-xl font-bold mb-0.5" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Verify report</p>
            <p className="text-sm mb-4" style={{ color: "#5A6B84" }}>{pendingReports.length} waiting · verify within 24 hrs</p>

            {/* Photo area — dark, with camera placeholder */}
            <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: "#0A1F3C", height: "200px" }}>
              {selectedReport.hasPhoto ? (
                <div className="w-full h-full flex items-center justify-center">
                  <IconCheck size={40} color="#0E8A5F" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <IconCamera size={24} color="rgba(255,255,255,0.5)" />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No photo attached</p>
                  <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                    Citizen photo · not provided
                  </span>
                </div>
              )}
            </div>

            {/* Report info card */}
            <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)", border: "1px solid #F0EDE6" }}>
              <div className="flex items-center gap-3 mb-2">
                <CategoryBadge category={selectedReport.category} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: "#16233A" }}>{selectedReport.category}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{selectedReport.shortCode}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm italic" style={{ color: "#5A6B84" }}>"{selectedReport.description}"</p>
              <p className="text-xs mt-2" style={{ color: "#B0BAC8" }}>Resident · {selectedReport.street}</p>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => {
                if (selectedReport && "isLive" in selectedReport && selectedReport.isLive) {
                  verifyLiveReport(selectedReport.id);
                } else {
                  setVerifiedIds((p) => [...p, selectedReport!.id]);
                }
                setView("verify-list");
              }}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 mb-3 text-sm font-bold text-white"
              style={{ background: "#0E8A5F" }}>
              <IconCamera size={16} className="text-white" />
              Confirm on ground (take photo)
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (selectedReport && "isLive" in selectedReport && selectedReport.isLive) {
                    rejectLiveReport(selectedReport.id);
                  } else {
                    setRejectedIds((p) => [...p, selectedReport!.id]);
                  }
                  setView("verify-list");
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold border"
                style={{ background: "white", color: "#16233A", borderColor: "#E6E3DC" }}>
                Reject with reason
              </button>
              <button
                onClick={() => {
                  setMergedIds((p) => [...p, selectedReport!.id]);
                  setView("verify-list");
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold border flex items-center justify-center gap-1.5"
                style={{ background: "white", color: "#16233A", borderColor: "#E6E3DC" }}>
                <IconMerge size={14} /> Merge duplicate
              </button>
            </div>
          </div>
        )}

        {/* ══ AREA MAP ══════════════════════════════════════════════════════ */}
        {view === "area-map" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{area.name} — Incident Map</p>
            <LiveMap height="280px" markers={LAHORE_INCIDENT_MARKERS.slice(0, 5)} zoom={13} className="mb-3" />
            <div className="space-y-2">
              {MOCK_AREA_INCIDENTS.map((inc) => (
                <button key={inc.id} onClick={() => { setSelectedInc(inc.id); setView("incident-detail"); }}
                  className="w-full text-left bg-white rounded-2xl border p-3 flex items-center gap-3"
                  style={{ borderColor: "#E6E3DC", boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                  <CategoryBadge category={inc.category} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.shortCode}</p>
                      <StatusChip status={inc.status} />
                    </div>
                    <p className="text-xs truncate" style={{ color: "#5A6B84" }}>{inc.location}</p>
                  </div>
                  <PriorityBadge band={inc.priorityBand} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ INCIDENTS ═════════════════════════════════════════════════════ */}
        {view === "incidents" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>All Area Incidents</p>
            <div className="space-y-2">
              {MOCK_AREA_INCIDENTS.sort((a,b) => b.priorityScore - a.priorityScore).map((inc) => (
                <button key={inc.id} onClick={() => { setSelectedInc(inc.id); setView("incident-detail"); }}
                  className="w-full text-left bg-white rounded-2xl border p-3"
                  style={{ borderColor: "#E6E3DC", boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                  <div className="flex items-start gap-3">
                    <CategoryBadge category={inc.category} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div>
                          <p className="text-xs font-bold" style={{ color: "#16233A" }}>{inc.category}</p>
                          <p className="text-[10px] font-mono" style={{ color: "#5A6B84" }}>{inc.shortCode}</p>
                        </div>
                        <PriorityBadge band={inc.priorityBand} />
                      </div>
                      <p className="text-xs truncate mb-1.5" style={{ color: "#5A6B84" }}>{inc.location}</p>
                      <div className="flex items-center gap-2">
                        <StatusChip status={inc.status} />
                        <span className="text-[10px]" style={{ color: "#5A6B84" }}>{inc.reportCount} reports</span>
                      </div>
                    </div>
                  </div>
                  {inc.status === "REOPENED" && (
                    <p className="text-xs mt-2 font-semibold" style={{ color: "#C0392B" }}>↺ Reopened — follow-up needed</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ INCIDENT DETAIL (rep view) ═══════════════════════════════════ */}
        {view === "incident-detail" && selectedIncident && (
          <div className="px-4 py-4">
            <button onClick={() => setView("incidents")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            <div className="bg-white rounded-2xl border p-4 mb-3" style={{ borderColor: "#E6E3DC", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CategoryBadge category={selectedIncident.category} size="lg" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{selectedIncident.category}</p>
                    <p className="text-[10px] font-mono" style={{ color: "#5A6B84" }}>{selectedIncident.shortCode}</p>
                  </div>
                </div>
                <StatusChip status={selectedIncident.status} size="md" />
              </div>
            </div>

            <LiveMap height="160px" center={[selectedIncident.lng, selectedIncident.lat]} zoom={15}
              markers={[{ id: selectedIncident.id, lng: selectedIncident.lng, lat: selectedIncident.lat, color: "#C0392B", label: selectedIncident.shortCode, category: selectedIncident.category }]}
              className="mb-3" />

            {/* Rep actions */}
            <div className="bg-white rounded-2xl border p-4 mb-3" style={{ borderColor: "#E6E3DC" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Street Rep Actions</p>
              <div className="space-y-2">
                {[
                  { type: "escalation" as const, label: "Escalate to Supervisor", bg: "#FEF0EE", color: "#C0392B", borderColor: "#C0392B" },
                  { type: "field-note" as const, label: "Add Field Note", bg: "#EAF0FA", color: "#0E2A4E", borderColor: "#0E2A4E" },
                  ...(selectedIncident.status === "AWAITING_CITIZEN_VERIFICATION" ? [{ type: "verification" as const, label: "Submit Field Verification", bg: "#E7F4EF", color: "#0E8A5F", borderColor: "#0E8A5F" }] : []),
                ].map((a) => (
                  <button key={a.type} onClick={() => { setFieldRef(selectedIncident.shortCode); setFieldType(a.type); setFieldDone(false); setFieldNote(""); setView("field-report"); }}
                    className="w-full text-left rounded-xl px-3 py-2.5 text-xs font-semibold border transition-colors"
                    style={{ background: a.bg, color: a.color, borderColor: a.borderColor }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <Timeline status={selectedIncident.status} repVerified={selectedIncident.repVerified} />
            </div>
          </div>
        )}

        {/* ══ FIELD REPORT ══════════════════════════════════════════════════ */}
        {view === "field-report" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            {!fieldDone ? (
              <>
                <p className="text-base font-bold mb-4" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Field Update</p>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
                  {([["field-note","Note"],["escalation","Escalation"],["verification","Verification"]] as const).map(([t,l]) => (
                    <button key={t} onClick={() => setFieldType(t)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{ background: fieldType === t ? "#0A1F3C" : "white", color: fieldType === t ? "white" : "#5A6B84", borderColor: fieldType === t ? "#0A1F3C" : "#E6E3DC" }}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Incident ref */}
                <div className="bg-white rounded-2xl border p-3 mb-3" style={{ borderColor: "#E6E3DC" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>Incident Reference</p>
                  <select value={fieldRef} onChange={(e) => setFieldRef(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                    style={{ border: "1.5px solid #E6E3DC", color: "#16233A" }}>
                    <option value="">Select incident…</option>
                    {MOCK_INCIDENTS.map((i) => (
                      <option key={i.id} value={i.shortCode}>{i.shortCode} — {i.category}</option>
                    ))}
                  </select>
                </div>

                {/* Photo */}
                <div className="bg-white rounded-2xl border p-3 mb-3" style={{ borderColor: "#E6E3DC" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>Field Photo (optional)</p>
                  {!fieldImage ? (
                    <button onClick={() => setFieldImage(true)} className="w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-1 transition-colors"
                      style={{ borderColor: "#E6E3DC" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0E8A5F"; (e.currentTarget as HTMLElement).style.background = "#E7F4EF"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E6E3DC"; (e.currentTarget as HTMLElement).style.background = ""; }}>
                      <IconCamera size={22} color="#5A6B84" />
                      <p className="text-xs" style={{ color: "#5A6B84" }}>Add field photo</p>
                    </button>
                  ) : (
                    <div className="relative">
                      <div className="w-full h-28 rounded-xl flex items-center justify-center" style={{ background: "#E7F4EF" }}>
                        <IconCheck size={28} color="#0E8A5F" />
                      </div>
                      <button onClick={() => setFieldImage(false)} className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: "#C0392B" }}>✕</button>
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="bg-white rounded-2xl border p-3 mb-4" style={{ borderColor: "#E6E3DC" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#5A6B84" }}>{fieldType === "escalation" ? "Escalation Reason*" : fieldType === "verification" ? "Verification Note*" : "Field Note*"}</p>
                  <textarea value={fieldNote} onChange={(e) => setFieldNote(e.target.value)}
                    placeholder={fieldType === "escalation" ? "Why does this need urgent escalation?" : "Describe what you observed on site…"}
                    className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                    style={{ border: "1.5px solid #E6E3DC", color: "#16233A" }}
                    rows={4} maxLength={500} />
                  <p className="text-xs text-right mt-1" style={{ color: "#5A6B84" }}>{fieldNote.length}/500</p>
                </div>

                {fieldType === "escalation" && (
                  <div className="rounded-xl p-3 mb-3 border" style={{ background: "#FEF0EE", borderColor: "#C0392B" }}>
                    <p className="text-xs font-semibold" style={{ color: "#C0392B" }}>Escalation will notify department supervisor and flag this incident for priority review.</p>
                  </div>
                )}

                <Button variant="primary" size="lg" className="w-full" disabled={!fieldNote.trim() || !fieldRef} onClick={() => setFieldDone(true)}>
                  {fieldType === "escalation" ? "Submit Escalation" : fieldType === "verification" ? "Submit Verification" : "Submit Field Note"}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center pt-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "#E7F4EF" }}>
                  <IconCheck size={32} color="#0E8A5F" />
                </div>
                <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Submitted!</p>
                <p className="text-xs mt-2" style={{ color: "#5A6B84" }}>
                  {fieldType === "escalation" ? "Department supervisor notified. Incident flagged for priority review." :
                   fieldType === "verification" ? "Field verification recorded and linked to incident history." :
                   "Field note recorded and linked to the incident."}
                </p>
                {fieldRef && <div className="mt-3 rounded-xl px-4 py-2" style={{ background: "#EAF0FA" }}><p className="text-xs font-mono font-bold" style={{ color: "#0A1F3C" }}>{fieldRef}</p></div>}
                <Button variant="primary" size="lg" className="w-full mt-6" onClick={() => { setView("home"); setFieldDone(false); setFieldNote(""); setFieldRef(""); setFieldImage(false); }}>Back to Home</Button>
              </div>
            )}
          </div>
        )}

        {/* ══ MESSAGES ══════════════════════════════════════════════════════ */}
        {view === "messages" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("home")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}><IconArrowLeft size={12} /> Back</button>
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Citizen Messages</p>
            <div className="space-y-2">
              {MOCK_CITIZEN_MESSAGES.map((msg) => (
                <div key={msg.id}>
                  <button onClick={() => setReplyMsgId(replyMsgId === msg.id ? null : msg.id)}
                    className="w-full text-left bg-white rounded-2xl border p-3"
                    style={{ borderColor: !msg.read ? "#0E8A5F" : "#E6E3DC", borderLeftWidth: !msg.read ? 4 : 1, boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "#0A1F3C" }}>
                        {msg.from[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold" style={{ color: "#16233A" }}>{msg.from}</p>
                          <div className="flex items-center gap-1.5">
                            {!msg.read && <span className="w-2 h-2 rounded-full" style={{ background: "#0E8A5F" }} />}
                            <span className="text-[10px]" style={{ color: "#5A6B84" }}>{formatRelativeTime(msg.sentAt)}</span>
                          </div>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#5A6B84" }}>{msg.text}</p>
                        {msg.incidentRef && <p className="text-[10px] mt-1 font-semibold" style={{ color: "#0E8A5F" }}>Re: {msg.incidentRef}</p>}
                      </div>
                    </div>
                  </button>
                  {replyMsgId === msg.id && (
                    <div className="mt-1 rounded-2xl border p-3" style={{ background: "#F8F7F4", borderColor: "#E6E3DC" }}>
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply…"
                        className="w-full rounded-xl p-2 text-xs resize-none focus:outline-none bg-white"
                        style={{ border: "1.5px solid #E6E3DC", color: "#16233A" }} rows={3} />
                      <div className="flex gap-2 mt-2">
                        <button disabled={!replyText.trim()} onClick={() => { setReplyText(""); setReplyMsgId(null); }}
                          className="flex-1 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-40" style={{ background: "#0A1F3C" }}>
                          Send Reply
                        </button>
                        <button onClick={() => setReplyMsgId(null)} className="px-3 py-2 text-xs rounded-xl" style={{ background: "#E6E3DC", color: "#5A6B84" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ PROFILE ═══════════════════════════════════════════════════════ */}
        {view === "profile" && (
          <div className="px-4 py-6">
            <div className="flex flex-col items-center pb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3" style={{ background: "#C6A55C", color: "#0A1F3C", fontFamily: "Outfit,sans-serif" }}>AR</div>
              <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Ahmed Raza</p>
              <p className="text-xs" style={{ color: "#5A6B84" }}>ahmed.raza@civicpulse.pk</p>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#FFF3E0", color: "#C6A55C" }}>Street Rep</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#E7F4EF", color: "#0E8A5F" }}>Verified</span>
              </div>
            </div>
            <div className="space-y-2">
              {[["Assigned Area","Gulberg III"],["Union Council","UC-14, District East"],["Serving Since","January 2026"],["Field Updates","28"],["Escalations (month)","4"],["Area Health Score",`${area.healthScore}/100`]].map(([l,v]) => (
                <div key={l} className="bg-white rounded-2xl border p-3 flex items-center justify-between" style={{ borderColor: "#E6E3DC" }}>
                  <p className="text-xs" style={{ color: "#16233A" }}>{l}</p>
                  <p className="text-xs font-bold" style={{ color: "#0E8A5F" }}>{v}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-3 rounded-2xl text-sm font-semibold border" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Log Out</button>
          </div>
        )}
      </div>

      {/* ── Bottom Navigation — matches screenshot ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E6E3DC", height: 60, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {[
          { id: "home",        Icon: IconHome,      label: "My Streets" },
          { id: "verify-list", Icon: IconClipboard, label: "Verify",    badge: pendingReports.length },
          { id: "incidents",   Icon: IconMap,       label: "Checklist" },
          { id: "messages",    Icon: IconChat,      label: "Work",      badge2: unreadMsgs },
        ].map(({ id, Icon, label, badge, badge2 }) => {
          const active = view === id || (id === "verify-list" && view === "verify-detail") || (id === "home" && ["incident-detail","field-report","area-map"].includes(view));
          return (
            <button key={id} onClick={() => setView(id as View)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "0 8px", color: active ? "#0E8A5F" : "#5A6B84", minWidth: 44, cursor: "pointer", background: "none", border: "none", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Icon size={22} />
                {((badge ?? 0) > 0 || (badge2 ?? 0) > 0) && (
                  <span style={{ position: "absolute", top: -6, right: -8, width: 16, height: 16, borderRadius: "50%", background: "#C0392B", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {badge ?? badge2}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
