"use client";

import { useState, useRef } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { Timeline, EventTimeline } from "@/components/ui/Timeline";
import { LiveMap, LocationPickerMap, useGeolocation } from "@/components/ui/LiveMap";
import { Button } from "@/components/ui/Button";
import {
  CategoryBadge, IconHome, IconMap, IconClipboard,
  IconBell, IconUser, IconCamera, IconMapPin,
  IconArrowLeft, IconCheck, IconAlertTriangle,
} from "@/components/ui/Icons";
import {
  MOCK_CITIZEN_REPORTS, MOCK_INCIDENTS, MOCK_NOTIFICATIONS,
  MOCK_ANNOUNCEMENTS, LAHORE_INCIDENT_MARKERS,
} from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";
import { formatRelativeTime } from "@/lib/utils";
import type { StatusType } from "@/lib/utils";

type View = "home" | "map" | "my-reports" | "alerts" | "profile" | "wizard" | "incident-detail" | "verify";

const CATEGORIES = [
  "Broken Road", "Garbage / Waste", "Sewerage / Water", "Streetlight",
  "Encroachment", "Flooding / Standing Water", "Safety Hazard", "Drainage", "Infrastructure", "Other",
];

// Map live report status to StatusType chip
function liveStatusToType(s: "SUBMITTED" | "VERIFIED" | "REJECTED"): StatusType {
  if (s === "VERIFIED") return "VERIFIED";
  if (s === "REJECTED") return "REJECTED";
  return "SUBMITTED";
}

export default function CitizenApp() {
  const { liveReports, addReport, workOrders, resolveWorkOrder } = useAppState();

  const [view, setView]                     = useState<View>("home");
  const [selectedIncidentId, setSelectedId] = useState<string | null>(null);
  const [step, setStep]                     = useState(0);
  const [wizardCategory, setWizardCategory] = useState("");
  const [wizardDesc, setWizardDesc]         = useState("");
  const [wizardLang, setWizardLang]         = useState<"en"|"ur"|"roman_ur">("en");
  const [wizardImageFile, setWizardImageFile] = useState<File | null>(null);
  const [wizardImagePreview, setWizardImagePreview] = useState<string | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{lng:number;lat:number}|null>(null);
  const [submitted, setSubmitted]           = useState(false);
  const [newReportId, setNewReportId]       = useState<string | null>(null);
  const [verifyOutcome, setVerifyOutcome]   = useState<"confirm"|"reject"|null>(null);
  const [rejectReason, setRejectReason]     = useState("");
  const [verifyDone, setVerifyDone]         = useState(false);
  const [woRating, setWoRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const geo = useGeolocation();

  const unread          = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  const selectedIncident = MOCK_INCIDENTS.find((i) => i.id === selectedIncidentId);

  // Combine static + live reports
  const allActiveReports = [
    ...liveReports.map((r) => ({
      id: r.id,
      shortCode: r.shortCode,
      status: liveStatusToType(r.status) as StatusType,
      category: r.category,
      description: r.description,
      location: r.street,
      submittedAt: r.submittedAt,
      incidentId: undefined as string | undefined,
      incidentShortCode: undefined as string | undefined,
      repVerified: r.repVerified,
      isLive: true,
    })),
    ...MOCK_CITIZEN_REPORTS
      .filter((r) => r.status !== "RESOLVED")
      .map((r) => ({ ...r, repVerified: true, isLive: false })),
  ];

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setWizardImageFile(file);
    const url = URL.createObjectURL(file);
    setWizardImagePreview(url);
  }

  function handleSubmit() {
    const lat = geo.lat ?? pickedLocation?.lat;
    const lng = geo.lng ?? pickedLocation?.lng;
    const resolvedAddress = geo.address ?? (lat && lng ? `Pinned location near ${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Location pending");
    const id = addReport({
      shortCode: `LHR-${Math.random().toString(36).slice(2,7).toUpperCase()}`,
      category: wizardCategory,
      description: wizardDesc,
      street: resolvedAddress,
      address: resolvedAddress,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      hasPhoto: !!wizardImageFile,
    });
    setNewReportId(id);
    setSubmitted(true);
  }

  function resetWizard() {
    setStep(0); setWizardCategory(""); setWizardDesc("");
    setWizardImageFile(null); setWizardImagePreview(null);
    setSubmitted(false); setPickedLocation(null);
    setNewReportId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openIncident(id: string) { setSelectedId(id); setView("incident-detail"); }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#F5F3EF", minHeight: 780 }}>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-5 py-2" style={{ background: "#0A1F3C" }}>
        <span className="text-white text-xs font-semibold">11:42</span>
        <span className="text-white text-xs font-bold" style={{ fontFamily: "Outfit,sans-serif", letterSpacing: "0.02em" }}>CivicPulse Lahore</span>
        <span className="text-white text-xs">▲ 5G ▮</span>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 718, paddingBottom: 68 }}>

        {/* ══ HOME — matches screenshot ════════════════════════════════════ */}
        {view === "home" && (
          <div style={{ background: "#F5F3EF" }}>
            {/* Greeting section (light cream bg) */}
            <div className="px-5 pt-5 pb-4" style={{ background: "#F5F3EF" }}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-2xl font-bold leading-tight" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Salaam, Citizen</p>
                  <p className="text-sm mt-0.5" style={{ color: "#5A6B84" }}>Gulberg, District Lahore</p>
                </div>
                <button className="w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold"
                  style={{ borderColor: "#E6E3DC", color: "#5A6B84", background: "white" }}>
                  اردو
                </button>
              </div>

              {/* Street health card */}
              <div className="bg-white rounded-2xl p-4 mb-3" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                <div className="flex items-center gap-4">
                  {/* Circle score */}
                  <svg width="72" height="72" viewBox="0 0 72 72" className="flex-shrink-0">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#E6E3DC" strokeWidth="5" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke="#0E8A5F" strokeWidth="5"
                      strokeDasharray={`${(82 / 100) * 188.5} 188.5`}
                      strokeLinecap="round" transform="rotate(-90 36 36)" />
                    <text x="36" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#16233A" fontFamily="Outfit,sans-serif">82</text>
                    <text x="36" y="50" textAnchor="middle" fontSize="9" fill="#5A6B84" fontFamily="Inter,sans-serif">/ 100</text>
                  </svg>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#E7F4EF", color: "#0E8A5F" }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#0E8A5F" }} />
                        Good condition
                      </span>
                    </div>
                    <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Main Boulevard</p>
                    <p className="text-xs" style={{ color: "#5A6B84" }}>Street Health · <span style={{ color: "#0E8A5F" }}>+4 this month</span></p>
                  </div>
                </div>
              </div>

              {/* Street Rep card */}
              <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#5A6B84" }}>Your Street Representative</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: "#0A1F3C", fontFamily: "Outfit,sans-serif" }}>AR</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#16233A" }}>Ahmed Raza</p>
                      <p className="text-xs" style={{ color: "#5A6B84" }}>Verified · Serving since Jan 2026</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                    style={{ borderColor: "#E6E3DC", color: "#16233A", background: "#F5F3EF" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Message
                  </button>
                </div>
              </div>

              {/* Report CTA */}
              <button onClick={() => { resetWizard(); setView("wizard"); }}
                className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 mb-5 text-white font-bold text-base transition-all"
                style={{ background: "#0E8A5F", fontFamily: "Outfit,sans-serif", boxShadow: "0 4px 16px rgba(14,138,95,0.35)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#12A874"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#0E8A5F"; }}>
                {/* Megaphone icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
                Report a Problem
              </button>
            </div>

            {/* Active reports section */}
            <div className="px-5 pb-2" style={{ background: "#F5F3EF" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#5A6B84" }}>Your active reports</p>

              {allActiveReports.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                  {/* SVG clipboard — no emoji */}
                  <svg width="40" height="46" viewBox="0 0 52 60" fill="none" className="mb-3 opacity-50">
                    <rect x="4" y="8" width="44" height="48" rx="4" fill="white" stroke="#5A6B84" strokeWidth="2.5"/>
                    <rect x="18" y="2" width="16" height="10" rx="3" fill="#5A6B84"/>
                    <circle cx="26" cy="7" r="2" fill="white"/>
                    <line x1="14" y1="24" x2="38" y2="24" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="14" y1="32" x2="38" y2="32" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="14" y1="40" x2="28" y2="40" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm font-semibold" style={{ color: "#16233A" }}>No active reports yet.</p>
                  <p className="text-xs mt-1" style={{ color: "#5A6B84" }}>Tap Report a Problem to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allActiveReports.map((r) => (
                    <button key={r.id}
                      onClick={() => r.incidentId ? openIncident(r.incidentId) : undefined}
                      className="w-full text-left bg-white rounded-2xl p-4 flex items-start gap-3 transition-shadow hover:shadow-md"
                      style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                      <CategoryBadge category={r.category} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold truncate" style={{ color: "#16233A" }}>{r.category}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.shortCode}</span>
                        </div>
                        <p className="text-xs truncate mb-2" style={{ color: "#5A6B84" }}>{r.description}</p>
                        <StatusChip status={r.status} />
                        {"repVerified" in r && r.repVerified && r.status === "SUBMITTED" && (
                          <span className="text-[10px] ml-2 font-semibold" style={{ color: "#0E8A5F" }}>✓ Rep verified</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Announcements */}
            <div className="px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#5A6B84" }}>Announcements</p>
              {MOCK_ANNOUNCEMENTS.map((a, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 mb-2 flex gap-3" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                  <div className="w-1 rounded-full flex-shrink-0" style={{ background: "#0E8A5F", minHeight: 40 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#16233A" }}>{a.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#5A6B84" }}>{a.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ MAP ═══════════════════════════════════════════════════════════ */}
        {view === "map" && (
          <div className="px-4 py-4">
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Lahore Incident Map</p>
            <LiveMap height="320px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} className="mb-3" />
            <div className="flex gap-4 mb-3 flex-wrap">
              {[{l:"Critical",c:"#C0392B"},{l:"High",c:"#C6A55C"},{l:"Medium",c:"#E0A400"},{l:"Resolved",c:"#0E8A5F"}].map((l)=>(
                <div key={l.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.c }} />
                  <span className="text-xs" style={{ color: "#5A6B84" }}>{l.l}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Nearby incidents</p>
            <div className="space-y-2">
              {MOCK_INCIDENTS.slice(0, 4).map((inc) => (
                <button key={inc.id} onClick={() => openIncident(inc.id)}
                  className="w-full text-left bg-white rounded-2xl border p-3 flex items-center gap-3 transition-shadow hover:shadow-md"
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

        {/* ══ MY REPORTS ════════════════════════════════════════════════════ */}
        {view === "my-reports" && (
          <div className="px-4 py-4">
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>My Reports</p>

            {/* Live work orders — tracked with timestamps */}
            {workOrders.length > 0 && (
              <div className="mb-5 space-y-4">
                {workOrders.map((w) => (
                  <div key={w.id} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)", border: "1px solid #E6E3DC" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#16233A" }}>{w.category}</p>
                        <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{w.shortCode}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: w.status === "RESOLVED" ? "#E7F4EF" : w.status === "COMPLETED" ? "#FFF8E1" : "#EAF0FA", color: w.status === "RESOLVED" ? "#0E8A5F" : w.status === "COMPLETED" ? "#B8860B" : "#0E2A4E" }}>
                        {w.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Before / After photos */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="h-20 rounded-xl flex items-center justify-center" style={{ background: "#0A1F3C" }}>
                          <IconCamera size={20} color="rgba(255,255,255,0.5)" />
                        </div>
                        <p className="text-[10px] text-center mt-1" style={{ color: "#5A6B84" }}>Before</p>
                      </div>
                      <div>
                        <div className="h-20 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: w.contractorPhotoUrl ? "transparent" : "#F5F3EF", border: "1px solid #E6E3DC" }}>
                          {w.contractorPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={w.contractorPhotoUrl} alt="After" className="w-full h-full object-cover" />
                          ) : <IconCamera size={20} color="#B0BAC8" />}
                        </div>
                        <p className="text-[10px] text-center mt-1" style={{ color: "#5A6B84" }}>After</p>
                      </div>
                    </div>

                    {/* Timestamped timeline */}
                    <EventTimeline events={w.history} />

                    {/* Rate & release payment card when contractor completed */}
                    {w.status === "COMPLETED" && (
                      <div className="mt-3 rounded-2xl p-4 text-center" style={{ background: "#FFF8E1", border: "1px solid #C6A55C" }}>
                        <p className="text-sm font-bold" style={{ color: "#B8860B", fontFamily: "Outfit,sans-serif" }}>Work verified by Street Rep. Please review!</p>
                        <p className="text-xs mt-1.5" style={{ color: "#5A6B84" }}>The contractor marked this issue as fixed. Confirm it is resolved and rate the work to release payment.</p>
                        <div className="flex justify-center gap-1 my-3">
                          {[1,2,3,4,5].map((s) => (
                            <button key={s} onClick={() => setWoRating(s)} className="text-2xl" style={{ color: s <= woRating ? "#C6A55C" : "#D9D2C4" }}>★</button>
                          ))}
                        </div>
                        <button onClick={() => resolveWorkOrder(w.id, woRating || 5)}
                          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F", fontFamily: "Outfit,sans-serif" }}>
                          Submit Rating &amp; Release Payment
                        </button>
                        <p className="text-xs mt-2 font-semibold underline" style={{ color: "#C0392B", cursor: "pointer" }}>Wait, there is still an issue!</p>
                      </div>
                    )}

                    {w.status === "RESOLVED" && (
                      <div className="mt-3 rounded-xl p-3 flex items-center gap-2" style={{ background: "#E7F4EF", border: "1px solid #0E8A5F" }}>
                        <IconCheck size={16} color="#0E8A5F" />
                        <p className="text-xs font-bold" style={{ color: "#0E8A5F" }}>Resolved · payment released{w.rating ? ` · you rated ${w.rating}★` : ""}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {liveReports.length === 0 && MOCK_CITIZEN_REPORTS.length === 0 && (
              <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                <svg width="52" height="60" viewBox="0 0 52 60" fill="none" className="mb-4">
                  <rect x="4" y="8" width="44" height="48" rx="4" fill="white" stroke="#C6A55C" strokeWidth="2.5"/>
                  <rect x="18" y="2" width="16" height="10" rx="3" fill="#C6A55C"/>
                  <circle cx="26" cy="7" r="2" fill="white"/>
                  <line x1="14" y1="24" x2="38" y2="24" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="14" y1="32" x2="38" y2="32" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="14" y1="40" x2="28" y2="40" stroke="#E6E3DC" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <p className="text-base font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>No reports yet</p>
                <p className="text-sm mb-5" style={{ color: "#5A6B84" }}>Submit a report and track its progress here</p>
                <button onClick={() => { resetWizard(); setView("wizard"); }}
                  className="w-full rounded-2xl py-4 text-white font-bold text-base"
                  style={{ background: "#0E8A5F", fontFamily: "Outfit,sans-serif", boxShadow: "0 4px 16px rgba(14,138,95,0.3)" }}>
                  Report a Problem
                </button>
              </div>
            )}

            {/* Live reports */}
            {liveReports.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#0E8A5F" }}>Just submitted</p>
                {liveReports.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl border p-4 mb-2" style={{ borderColor: "#0E8A5F", borderLeftWidth: 4, boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                    <div className="flex items-start gap-3">
                      <CategoryBadge category={r.category} size="lg" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: "#16233A" }}>{r.category}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.shortCode}</span>
                        </div>
                        <p className="text-xs truncate mb-2" style={{ color: "#5A6B84" }}>{r.description}</p>
                        <div className="flex items-center gap-2">
                          <StatusChip status={liveStatusToType(r.status)} />
                          {r.repVerified && (
                            <span className="text-[10px] font-bold" style={{ color: "#0E8A5F" }}>✓ Verified by Rep</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Static mock reports */}
            {MOCK_CITIZEN_REPORTS.map((r) => (
              <button key={r.id} onClick={() => r.incidentId && openIncident(r.incidentId)}
                className="w-full text-left bg-white rounded-2xl border p-4 mb-2 transition-shadow hover:shadow-md"
                style={{ borderColor: "#E6E3DC", boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                <div className="flex items-start gap-3">
                  <CategoryBadge category={r.category} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold" style={{ color: "#16233A" }}>{r.category}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#EAF0FA", color: "#0E2A4E" }}>{r.shortCode}</span>
                    </div>
                    <p className="text-xs truncate mb-2" style={{ color: "#5A6B84" }}>{r.description}</p>
                    <div className="flex items-center gap-2">
                      <StatusChip status={r.status} />
                      <span className="text-xs" style={{ color: "#5A6B84" }}>{formatRelativeTime(r.submittedAt)}</span>
                    </div>
                  </div>
                </div>
                {r.incidentShortCode && (
                  <p className="text-xs mt-2 font-medium" style={{ color: "#0E8A5F" }}>→ {r.incidentShortCode}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ══ ALERTS ════════════════════════════════════════════════════════ */}
        {view === "alerts" && (
          <div className="px-4 py-4">
            <p className="text-base font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Notifications</p>
            <div className="space-y-2">
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="bg-white rounded-2xl border p-3"
                  style={{ borderColor: n.isRead ? "#E6E3DC" : "#0E8A5F", borderLeftWidth: n.isRead ? 1 : 4, boxShadow: "0 1px 3px rgba(10,31,60,0.07)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.isRead ? "#E6E3DC" : "#0E8A5F" }} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: "#16233A" }}>{n.title}</p>
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#5A6B84" }}>{formatRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#5A6B84" }}>{n.body}</p>
                      {n.entityShortCode && <p className="text-[10px] mt-1 font-semibold" style={{ color: "#0E8A5F" }}>{n.entityShortCode}</p>}
                    </div>
                  </div>
                  {n.eventType === "VERIFICATION_REQUESTED" && (
                    <button onClick={() => { setSelectedId("inc-001"); setView("verify"); setVerifyDone(false); setVerifyOutcome(null); }}
                      className="mt-2 w-full py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#0E8A5F" }}>
                      Review &amp; Verify Resolution →
                    </button>
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
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                style={{ background: "#0A1F3C", fontFamily: "Outfit,sans-serif" }}>H</div>
              <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Hammad Ali</p>
              <p className="text-xs" style={{ color: "#5A6B84" }}>hammad@example.com</p>
              <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#E7F4EF", color: "#0E8A5F" }}>Citizen</span>
            </div>
            <div className="space-y-2">
              {[["Total Reports", String(MOCK_CITIZEN_REPORTS.length + liveReports.length)], ["In Progress","2"],["Preferred Language","English"]].map(([l,v]) => (
                <div key={l} className="bg-white rounded-2xl border p-3 flex items-center justify-between" style={{ borderColor: "#E6E3DC" }}>
                  <p className="text-sm" style={{ color: "#16233A" }}>{l}</p>
                  <p className="text-sm font-bold" style={{ color: "#0E8A5F" }}>{v}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-3 rounded-2xl text-sm font-semibold border" style={{ borderColor: "#C0392B", color: "#C0392B" }}>Log Out</button>
          </div>
        )}

        {/* ══ REPORT WIZARD ═════════════════════════════════════════════════ */}
        {view === "wizard" && !submitted && (
          <div className="px-4 py-4" style={{ background: "#F5F3EF" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => step === 0 ? setView("home") : setStep((s) => s - 1)}
                className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "white", boxShadow: "0 1px 3px rgba(10,31,60,0.1)" }}>
                <IconArrowLeft size={16} color="#0A1F3C" />
              </button>
              <div className="flex-1">
                <p className="text-xs font-medium mb-1" style={{ color: "#5A6B84" }}>Step {step + 1} of 5</p>
                <div className="flex gap-1">
                  {[0,1,2,3,4].map((s) => (
                    <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? "#0E8A5F" : "#E6E3DC" }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Step 0: Evidence ── */}
            {step === 0 && (
              <div>
                <p className="text-lg font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Add Evidence</p>
                <p className="text-sm mb-4" style={{ color: "#5A6B84" }}>Upload a photo from your device or take one now</p>

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageFile}
                />

                {!wizardImagePreview ? (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-2xl py-12 flex flex-col items-center gap-3 border-2 border-dashed transition-colors bg-white"
                    style={{ borderColor: "#E6E3DC" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0E8A5F"; (e.currentTarget as HTMLElement).style.background = "#F0FAF6"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E6E3DC"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#E7F4EF" }}>
                      <IconCamera size={28} color="#0E8A5F" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: "#0E8A5F" }}>Upload Photo</p>
                      <p className="text-xs mt-0.5" style={{ color: "#5A6B84" }}>JPEG · PNG · WEBP · Max 10 MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={wizardImagePreview} alt="Selected" className="w-full rounded-2xl object-cover" style={{ maxHeight: 220 }} />
                    <button onClick={() => { setWizardImageFile(null); setWizardImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-lg"
                      style={{ background: "#C0392B" }}>✕</button>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(14,138,95,0.9)" }}>
                      <IconCheck size={12} className="text-white" />
                      <span className="text-xs text-white font-medium">{wizardImageFile?.name}</span>
                    </div>
                  </div>
                )}
                <Button variant="primary" size="lg" className="w-full mt-4" disabled={!wizardImagePreview} onClick={() => { setStep(1); geo.request(); }}>Continue</Button>
                <button onClick={() => setStep(1)} className="w-full py-3 text-xs font-medium mt-2" style={{ color: "#5A6B84" }}>
                  Skip — no photo available
                </button>
              </div>
            )}

            {/* ── Step 1: Location ── */}
            {step === 1 && (
              <div>
                <p className="text-lg font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Confirm Location</p>
                <p className="text-sm mb-3" style={{ color: "#5A6B84" }}>GPS auto-detect or tap map to pin location</p>
                {geo.loading ? (
                  <div className="rounded-xl p-3 mb-3 flex items-center gap-2 border" style={{ background: "#EAF0FA", borderColor: "#0E2A4E" }}>
                    <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: "#0E8A5F", borderTopColor: "transparent" }} />
                    <p className="text-xs font-medium" style={{ color: "#0E2A4E" }}>Detecting your location…</p>
                  </div>
                ) : geo.lat ? (
                  <div className="rounded-xl p-3 mb-3 border" style={{ background: "#E7F4EF", borderColor: "#0E8A5F" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <IconCheck size={14} color="#0E8A5F" />
                      <p className="text-xs font-semibold" style={{ color: "#0E8A5F" }}>
                        GPS confirmed — ±{geo.accuracy !== null ? Math.round(geo.accuracy) : "?"}m
                      </p>
                    </div>
                    {geo.address && (
                      <p className="text-xs font-medium" style={{ color: "#16233A" }}>{geo.address}</p>
                    )}
                    <p className="text-[11px] mt-0.5 font-mono" style={{ color: "#5A6B84" }}>
                      {geo.lat.toFixed(5)}, {geo.lng?.toFixed(5)}
                    </p>
                  </div>
                ) : geo.error ? (
                  <div className="rounded-xl p-3 mb-3 border" style={{ background: "#FEF0EE", borderColor: "#C0392B" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <IconAlertTriangle size={14} color="#C0392B" />
                      <p className="text-xs font-medium" style={{ color: "#C0392B" }}>GPS unavailable — tap the map to pin</p>
                    </div>
                  </div>
                ) : (
                  <button onClick={geo.request} className="w-full rounded-xl p-3 mb-3 flex items-center justify-center gap-2 border text-sm font-semibold"
                    style={{ borderColor: "#0E8A5F", color: "#0E8A5F", background: "white" }}>
                    <IconMapPin size={15} /> Detect My Location
                  </button>
                )}
                <LocationPickerMap height="200px"
                  picked={pickedLocation ?? (geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null)}
                  onPick={(lng, lat) => setPickedLocation({ lng, lat })} />
                <p className="text-xs mt-2 mb-4" style={{ color: "#5A6B84" }}>Tap map to adjust the pin</p>
                <Button variant="primary" size="lg" className="w-full" disabled={!geo.lat && !pickedLocation} onClick={() => setStep(2)}>Continue</Button>
              </div>
            )}

            {/* ── Step 2: Category ── */}
            {step === 2 && (
              <div>
                <p className="text-lg font-bold mb-0.5" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Select Category</p>
                <p className="text-xs mb-1" style={{ color: "#5A6B84" }}>
                  AI suggests: <span className="font-semibold" style={{ color: "#0E8A5F" }}>Sewerage / Water (87%)</span>
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setWizardCategory(cat)}
                      className="bg-white rounded-2xl border p-3 text-left transition-all"
                      style={{
                        borderColor: wizardCategory === cat ? "#0E8A5F" : "#E6E3DC",
                        background: wizardCategory === cat ? "#E7F4EF" : "white",
                        boxShadow: wizardCategory === cat ? "0 0 0 2px rgba(14,138,95,0.2)" : "0 1px 3px rgba(10,31,60,0.07)",
                      }}>
                      <CategoryBadge category={cat} size="md" />
                      <p className="text-xs font-semibold mt-2 leading-tight" style={{ color: "#16233A" }}>{cat}</p>
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="lg" className="w-full" disabled={!wizardCategory} onClick={() => setStep(3)}>Continue</Button>
              </div>
            )}

            {/* ── Step 3: Description ── */}
            {step === 3 && (
              <div>
                <p className="text-lg font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Add Description</p>
                <div className="flex gap-2 mb-3">
                  {(["en","ur","roman_ur"] as const).map((l) => (
                    <button key={l} onClick={() => setWizardLang(l)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{ background: wizardLang === l ? "#0A1F3C" : "white", color: wizardLang === l ? "white" : "#5A6B84", borderColor: wizardLang === l ? "#0A1F3C" : "#E6E3DC" }}>
                      {l === "en" ? "English" : l === "ur" ? "اردو" : "Roman Urdu"}
                    </button>
                  ))}
                </div>
                <textarea value={wizardDesc} onChange={(e) => setWizardDesc(e.target.value)}
                  placeholder={wizardLang === "ur" ? "مسئلہ بیان کریں…" : wizardLang === "roman_ur" ? "Masla bayan karein…" : "Describe the civic issue…"}
                  dir={wizardLang === "ur" ? "rtl" : "ltr"}
                  className="w-full rounded-2xl p-3 text-sm resize-none focus:outline-none bg-white"
                  style={{ border: "1.5px solid #E6E3DC", color: "#16233A", fontFamily: wizardLang === "ur" ? "'Noto Nastaliq Urdu',serif" : "inherit" }}
                  rows={5} maxLength={1000} />
                <p className="text-xs text-right mt-1 mb-4" style={{ color: "#5A6B84" }}>{wizardDesc.length}/1000</p>
                <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(4)}>Continue</Button>
              </div>
            )}

            {/* ── Step 4: Review & Submit ── */}
            {step === 4 && (
              <div>
                <p className="text-lg font-bold mb-3" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Review & Submit</p>
                {wizardImagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wizardImagePreview} alt="Evidence" className="w-full rounded-2xl object-cover mb-3" style={{ maxHeight: 160 }} />
                )}
                <div className="bg-white rounded-2xl border divide-y mb-4" style={{ borderColor: "#E6E3DC" }}>
                  {[
                    { label: "Image",     value: wizardImageFile?.name || "No photo" },
                    { label: "Location",  value: geo.address ? `${geo.address} (${geo.lat?.toFixed(4)}, ${geo.lng?.toFixed(4)})` : geo.lat ? `${geo.lat.toFixed(4)}, ${geo.lng?.toFixed(4)}` : pickedLocation ? `${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)}` : "Not set" },
                    { label: "Category",  value: wizardCategory || "—" },
                    { label: "Description", value: wizardDesc || "(none)" },
                  ].map((row) => (
                    <div key={row.label} className="px-3 py-2.5">
                      <p className="text-xs" style={{ color: "#5A6B84" }}>{row.label}</p>
                      <p className="text-xs font-semibold mt-0.5 truncate" style={{ color: "#16233A" }}>{row.value}</p>
                    </div>
                  ))}
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit}>Submit Report</Button>
              </div>
            )}
          </div>
        )}

        {/* ══ WIZARD CONFIRMATION ═══════════════════════════════════════════ */}
        {view === "wizard" && submitted && (
          <div className="px-4 py-8 flex flex-col items-center text-center" style={{ background: "#F5F3EF" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "#E7F4EF" }}>
              <IconCheck size={32} color="#0E8A5F" />
            </div>
            <p className="text-lg font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Report Submitted!</p>
            <p className="text-sm mt-1" style={{ color: "#5A6B84" }}>Sent to your Street Rep for verification</p>
            <div className="mt-4 bg-white rounded-2xl border px-6 py-4 w-full" style={{ borderColor: "#E6E3DC" }}>
              <p className="text-xs" style={{ color: "#5A6B84" }}>Report ID</p>
              <p className="text-base font-bold mt-0.5 font-mono" style={{ color: "#0A1F3C" }}>{newReportId ? liveReports.find(r => r.id === newReportId)?.shortCode : "LHR-NEW"}</p>
              <div className="mt-2"><StatusChip status="SUBMITTED" size="md" /></div>
            </div>
            <div className="w-full mt-4">
              <Timeline status="SUBMITTED" repVerified={false} />
            </div>
            <p className="text-xs mt-3" style={{ color: "#5A6B84" }}>Your Street Rep will verify this within 24 hrs. You will be notified.</p>
            <Button variant="primary" size="lg" className="w-full mt-4" onClick={() => { setView("my-reports"); resetWizard(); }}>View My Reports</Button>
            <Button variant="ghost" size="md" className="w-full mt-2" onClick={() => { setView("home"); resetWizard(); }}>Back to Home</Button>
          </div>
        )}

        {/* ══ INCIDENT DETAIL ═══════════════════════════════════════════════ */}
        {view === "incident-detail" && selectedIncident && (
          <div className="px-4 py-4">
            <button onClick={() => setView("my-reports")} className="flex items-center gap-1 text-xs mb-3 hover:underline" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            <div className="bg-white rounded-2xl border p-4 mb-3" style={{ borderColor: "#E6E3DC", boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-mono mb-1" style={{ color: "#5A6B84" }}>{selectedIncident.shortCode}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={selectedIncident.category} size="md" />
                    <p className="text-sm font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{selectedIncident.category}</p>
                  </div>
                  <p className="text-xs" style={{ color: "#5A6B84" }}>📍 {selectedIncident.area} · {selectedIncident.reportCount} reports</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusChip status={selectedIncident.status} size="md" />
                  <PriorityBadge band={selectedIncident.priorityBand} score={selectedIncident.priorityScore} showScore />
                </div>
              </div>
            </div>
            <LiveMap height="160px" center={[selectedIncident.lng, selectedIncident.lat]} zoom={15}
              markers={[{ id: selectedIncident.id, lng: selectedIncident.lng, lat: selectedIncident.lat, color: "#C0392B", label: selectedIncident.shortCode, category: selectedIncident.category }]}
              className="mb-3" />
            {selectedIncident.aiSummary && (
              <div className="rounded-xl p-3 mb-3 border" style={{ background: "#F5F0FA", borderColor: "#D8CCED" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#5B2D8E" }}>AI Analysis</p>
                <p className="text-xs" style={{ color: "#5A6B84" }}>{selectedIncident.aiSummary}</p>
              </div>
            )}
            {selectedIncident.resolutionImage && (
              <div className="bg-white rounded-2xl border p-4 mb-3" style={{ borderColor: "#E6E3DC" }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Before / After</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <div className="h-24 rounded-xl flex items-center justify-center" style={{ background: "#0E2A4E" }}>
                      <CategoryBadge category={selectedIncident.category} size="lg" />
                    </div>
                    <p className="text-xs text-center mt-1" style={{ color: "#5A6B84" }}>Before</p>
                  </div>
                  <div>
                    <div className="h-24 rounded-xl flex items-center justify-center border" style={{ background: "#E7F4EF", borderColor: "#0E8A5F" }}>
                      <IconCheck size={32} color="#0E8A5F" />
                    </div>
                    <p className="text-xs text-center mt-1 font-medium" style={{ color: "#0E8A5F" }}>After</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Status Timeline</p>
              <Timeline status={selectedIncident.status} repVerified={selectedIncident.repVerified} />
            </div>
            {selectedIncident.status === "AWAITING_CITIZEN_VERIFICATION" && (
              <button onClick={() => { setView("verify"); setVerifyDone(false); setVerifyOutcome(null); }}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mb-2" style={{ background: "#0E8A5F" }}>
                Verify Resolution →
              </button>
            )}
          </div>
        )}

        {/* ══ VERIFY ════════════════════════════════════════════════════════ */}
        {view === "verify" && (
          <div className="px-4 py-4">
            <button onClick={() => setView("incident-detail")} className="flex items-center gap-1 text-xs mb-3" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back
            </button>
            {!verifyDone ? (
              <>
                <p className="text-lg font-bold mb-1" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>Verify Resolution</p>
                <p className="text-xs mb-4" style={{ color: "#5A6B84" }}>Review before &amp; after evidence, then confirm or reject.</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <div className="h-36 rounded-2xl flex items-center justify-center border" style={{ background: "#0E2A4E", borderColor: "#12345E" }}>
                      <div className="text-center"><IconCamera size={28} className="mx-auto text-white/40" /><p className="text-xs mt-1 text-white/40">Original</p></div>
                    </div>
                    <p className="text-xs text-center mt-1 font-medium" style={{ color: "#5A6B84" }}>Before</p>
                  </div>
                  <div>
                    <div className="h-36 rounded-2xl flex items-center justify-center border" style={{ background: "#E7F4EF", borderColor: "#0E8A5F" }}>
                      <IconCheck size={36} color="#0E8A5F" />
                    </div>
                    <p className="text-xs text-center mt-1 font-medium" style={{ color: "#0E8A5F" }}>After</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "#F8F7F4", color: "#5A6B84" }}>
                  <p className="font-semibold mb-0.5" style={{ color: "#16233A" }}>Department note:</p>
                  Blocked drain cleared, pipe repaired. Area cleaned and sanitised.
                </div>
                {verifyOutcome === "reject" && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: "#16233A" }}>Reason (optional)</p>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="The problem still persists…"
                      className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none bg-white"
                      style={{ border: "1.5px solid #E6E3DC", color: "#16233A" }} rows={3} maxLength={500} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setVerifyOutcome("confirm"); setVerifyDone(true); }}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#0E8A5F" }}>✓ Confirm</button>
                  {verifyOutcome !== "reject" ? (
                    <button onClick={() => setVerifyOutcome("reject")}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold border"
                      style={{ background: "#FEF0EE", color: "#C0392B", borderColor: "#C0392B" }}>Reject</button>
                  ) : (
                    <button onClick={() => { setVerifyOutcome("reject"); setVerifyDone(true); }}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: "#C0392B" }}>Submit Rejection</button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center pt-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: verifyOutcome === "confirm" ? "#E7F4EF" : "#FEF0EE" }}>
                  <IconCheck size={32} color={verifyOutcome === "confirm" ? "#0E8A5F" : "#C0392B"} />
                </div>
                <p className="text-base font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>
                  {verifyOutcome === "confirm" ? "Incident Resolved!" : "Incident Reopened"}
                </p>
                <p className="text-xs mt-2" style={{ color: "#5A6B84" }}>
                  {verifyOutcome === "confirm" ? "Thank you. The incident has been marked RESOLVED." : "Department notified. Incident reopened."}
                </p>
                <Button variant="primary" size="lg" className="w-full mt-6" onClick={() => setView("home")}>Back to Home</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Navigation ── */}
      {view !== "wizard" && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E6E3DC", height: 60, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {[
            { id: "home",       Icon: IconHome,      label: "Home"      },
            { id: "map",        Icon: IconMap,       label: "Map"       },
            { id: "my-reports", Icon: IconClipboard, label: "My Reports"},
            { id: "alerts",     Icon: IconBell,      label: "Alerts",   badge: unread },
            { id: "profile",    Icon: IconUser,      label: "Profile"   },
          ].map(({ id, Icon, label, badge }) => (
            <button key={id} onClick={() => setView(id as View)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "0 8px", color: view === id ? "#0E8A5F" : "#5A6B84", minWidth: 44, cursor: "pointer", background: "none", border: "none" }}>
              <div style={{ position: "relative" }}>
                <Icon size={22} />
                {badge != null && badge > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -8, width: 16, height: 16, borderRadius: "50%", background: "#C0392B", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
