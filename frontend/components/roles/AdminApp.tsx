"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { KPICard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/Icons";
import { MOCK_INCIDENTS, MOCK_MINISTRY_STATS } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "users", label: "Users", icon: "👥" },
  { id: "incidents", label: "Incidents", icon: "📋" },
  { id: "departments", label: "Departments", icon: "🏛️" },
  { id: "categories", label: "Categories", icon: "🏷️" },
  { id: "configuration", label: "Configuration", icon: "⚙️" },
  { id: "audit", label: "Audit Log", icon: "📜" },
];

const MOCK_USERS = [
  { id: "u1", name: "Hammad Ali", email: "citizen1@demo.civicpulse", role: "citizen", dept: "—", active: true, created: "Jan 2026" },
  { id: "u2", name: "Fatima Khan", email: "citizen2@demo.civicpulse", role: "citizen", dept: "—", active: true, created: "Feb 2026" },
  { id: "u3", name: "Saad Ahmed", email: "dept.waste@demo.civicpulse", role: "department", dept: "LWMC Solid Waste", active: true, created: "Dec 2025" },
  { id: "u4", name: "Ayesha Malik", email: "dept.roads@demo.civicpulse", role: "department", dept: "LDA – Roads", active: true, created: "Dec 2025" },
  { id: "u5", name: "Omar Sheikh", email: "ministry@demo.civicpulse", role: "ministry", dept: "—", active: true, created: "Nov 2025" },
  { id: "u6", name: "Admin User", email: "admin@demo.civicpulse", role: "admin", dept: "—", active: true, created: "Nov 2025" },
  { id: "u7", name: "Bilal Raza", email: "bilal@demo.civicpulse", role: "citizen", dept: "—", active: false, created: "Mar 2026" },
];

const MOCK_AUDIT = [
  { id: "a1", event: "INCIDENT_MERGED", actor: "Admin User", actorRole: "admin", entity: "INC-2026003", summary: "Merged INC-2026003 into INC-2026001. Reason: same location, same drain.", ts: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "a2", event: "USER_ROLE_CHANGED", actor: "Admin User", actorRole: "admin", entity: "u4", summary: "Role changed: citizen → department. Assigned to LDA Roads.", ts: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: "a3", event: "CONFIGURATION_CHANGED", actor: "Admin User", actorRole: "admin", entity: "AI_RELEVANCE_THRESHOLD", summary: "AI_RELEVANCE_THRESHOLD: 0.50 → 0.55", ts: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { id: "a4", event: "INCIDENT_STATUS_CHANGED", actor: "Saad Ahmed", actorRole: "department", entity: "INC-2026001", summary: "Status: ASSIGNED → IN_PROGRESS", ts: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: "a5", event: "REPORT_REJECTED", actor: "Admin User", actorRole: "admin", entity: "RPT-2026003", summary: "Report rejected. Reason: Not a civic issue — private property.", ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "a6", event: "USER_DEACTIVATED", actor: "Admin User", actorRole: "admin", entity: "u7", summary: "Account deactivated. Reason: duplicate account.", ts: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: "a7", event: "VERIFICATION_REJECTED", actor: "Hammad Ali", actorRole: "citizen", entity: "INC-2026005", summary: "Citizen rejected resolution. Reason: flooding still occurs after rain.", ts: new Date(Date.now() - 3 * 60 * 60 * 1000) },
];

const ROLE_COLORS: Record<string, string> = {
  citizen: "#E7F4EF",
  department: "#EAF0FA",
  ministry: "#FFF3E0",
  admin: "#F5F0FA",
};
const ROLE_TEXT: Record<string, string> = {
  citizen: "#0E8A5F",
  department: "#0E2A4E",
  ministry: "#C6A55C",
  admin: "#5B2D8E",
};

const DEFAULT_WEIGHTS = {
  severity: 0.30,
  citizen_support: 0.20,
  population: 0.20,
  location_sensitivity: 0.15,
  duration: 0.15,
};

const DEFAULT_THRESHOLDS = {
  AI_RELEVANCE_THRESHOLD: 0.55,
  DUPLICATE_SEARCH_RADIUS_M: 500,
  DUPLICATE_TIME_WINDOW_HOURS: 72,
  DUPLICATE_MERGE_THRESHOLD: 0.75,
  DUPLICATE_REVIEW_THRESHOLD: 0.50,
  CITIZEN_VERIFICATION_TIMEOUT_DAYS: 7,
  REPORT_SPAM_LIMIT_PER_HOUR: 10,
};

export default function AdminApp() {
  const [activeNav, setActiveNav] = useState("users");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [mergeDone, setMergeDone] = useState(false);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [configSaved, setConfigSaved] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [deactivatedUsers, setDeactivatedUsers] = useState<string[]>(["u7"]);
  const [auditFilter, setAuditFilter] = useState("All");

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightValid = Math.abs(weightSum - 1.0) < 0.001;

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const EVENT_ICONS: Record<string, string> = {
    INCIDENT_MERGED: "⊕",
    USER_ROLE_CHANGED: "🔄",
    CONFIGURATION_CHANGED: "⚙️",
    INCIDENT_STATUS_CHANGED: "→",
    REPORT_REJECTED: "✕",
    USER_DEACTIVATED: "🔒",
    VERIFICATION_REJECTED: "↺",
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E6E3DC]">
      {/* ── Top bar ── */}
      <div className="bg-[#0A1F3C] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C6A55C] flex items-center justify-center">
            <span className="text-[#0A1F3C] font-bold text-sm">⚙</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm font-display">Admin Governance</p>
            <p className="text-[#5A6B84] text-xs">CivicPulse Lahore · Platform Administration</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#0E8A5F] font-semibold bg-[#081426] px-2 py-1 rounded">Admin</span>
          <div className="w-8 h-8 rounded-full bg-[#C6A55C] flex items-center justify-center text-[#0A1F3C] text-xs font-bold">A</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="bg-[#0E2A4E] flex border-b border-[#12345E] overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveNav(item.id); setMergeOpen(false); setMergeDone(false); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeNav === item.id
                ? "text-white border-b-2 border-[#C6A55C]"
                : "text-[#5A6B84] hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ minHeight: "580px", maxHeight: "680px" }}>

        {/* ══════════════ USERS ══════════════ */}
        {activeNav === "users" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#16233A] font-display">User Management</h2>
              <Button variant="primary" size="sm">+ Add User</Button>
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="flex-1 border border-[#E6E3DC] rounded-lg px-3 py-2 text-xs text-[#16233A] focus:outline-none focus:border-[#0A1F3C]"
              />
              <select className="border border-[#E6E3DC] rounded-lg px-2 py-2 text-xs text-[#5A6B84] focus:outline-none">
                <option>All Roles</option>
                <option>citizen</option>
                <option>department</option>
                <option>ministry</option>
                <option>admin</option>
              </select>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#0A1F3C] text-white">
                  {["Name", "Email", "Role", "Department", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const isDeactivated = deactivatedUsers.includes(u.id);
                  return (
                    <tr key={u.id} className={`border-b border-[#E6E3DC] ${i % 2 === 0 ? "bg-white" : "bg-[#F8F7F4]"}`}>
                      <td className="px-3 py-2.5 font-medium text-[#16233A]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                            style={{ background: ROLE_COLORS[u.role], color: ROLE_TEXT[u.role] }}
                          >
                            {u.name[0]}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{u.email}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: ROLE_COLORS[u.role], color: ROLE_TEXT[u.role] }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{u.dept}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isDeactivated
                            ? "bg-[#FEF0EE] text-[#C0392B]"
                            : "bg-[#E7F4EF] text-[#0E8A5F]"
                        }`}>
                          {isDeactivated ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{u.created}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button className="px-2 py-1 text-[10px] font-semibold text-[#0E2A4E] bg-[#EAF0FA] rounded hover:bg-[#D0E0F8]">
                            Edit
                          </button>
                          {u.id !== "u6" && (
                            <button
                              onClick={() =>
                                setDeactivatedUsers((prev) =>
                                  prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]
                                )
                              }
                              className={`px-2 py-1 text-[10px] font-semibold rounded ${
                                isDeactivated
                                  ? "text-[#0E8A5F] bg-[#E7F4EF] hover:bg-[#D0EDE6]"
                                  : "text-[#C0392B] bg-[#FEF0EE] hover:bg-[#FDD]"
                              }`}
                            >
                              {isDeactivated ? "Reactivate" : "Deactivate"}
                            </button>
                          )}
                          {u.id === "u6" && (
                            <span className="text-[10px] text-[#5A6B84] px-1 py-1">Protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════════════ INCIDENTS ══════════════ */}
        {activeNav === "incidents" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#16233A] font-display">Incident Governance</h2>
              <Button variant="secondary" size="sm" onClick={() => setMergeOpen(!mergeOpen)}>
                ⊕ Merge Incidents
              </Button>
            </div>

            {/* Merge panel */}
            {mergeOpen && !mergeDone && (
              <div className="bg-[#F8F7F4] rounded-xl border border-[#E6E3DC] p-4">
                <p className="text-xs font-semibold text-[#16233A] mb-3">Merge Incidents</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] text-[#5A6B84] block mb-1">Source incident (will be merged away)</label>
                    <select
                      value={mergeSource}
                      onChange={(e) => setMergeSource(e.target.value)}
                      className="w-full border border-[#E6E3DC] rounded-lg px-2 py-1.5 text-xs text-[#16233A] focus:outline-none focus:border-[#0A1F3C]"
                    >
                      <option value="">Select source…</option>
                      {MOCK_INCIDENTS.map((i) => (
                        <option key={i.id} value={i.id}>{i.shortCode} — {i.category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#5A6B84] block mb-1">Target incident (surviving)</label>
                    <select
                      value={mergeTarget}
                      onChange={(e) => setMergeTarget(e.target.value)}
                      className="w-full border border-[#E6E3DC] rounded-lg px-2 py-1.5 text-xs text-[#16233A] focus:outline-none focus:border-[#0A1F3C]"
                    >
                      <option value="">Select target…</option>
                      {MOCK_INCIDENTS.filter((i) => i.id !== mergeSource).map((i) => (
                        <option key={i.id} value={i.id}>{i.shortCode} — {i.category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="Reason for merge (required, min 10 chars)…"
                  className="w-full border border-[#E6E3DC] rounded-lg px-3 py-2 text-xs text-[#16233A] focus:outline-none focus:border-[#0A1F3C] resize-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!mergeSource || !mergeTarget || mergeReason.length < 10 || mergeSource === mergeTarget}
                    onClick={() => setMergeDone(true)}
                  >
                    Confirm Merge
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setMergeOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {mergeDone && (
              <div className="bg-[#E7F4EF] rounded-xl border border-[#0E8A5F] p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-bold text-[#0E8A5F]">Merge Complete</p>
                  <p className="text-xs text-[#5A6B84]">
                    All reports moved to target incident. Source incident marked MERGED. Audit log entry created.
                  </p>
                </div>
              </div>
            )}

            {/* Incident table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0A1F3C] text-white">
                    {["Incident", "Category", "Status", "Priority", "Reports", "Department", "Actions"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INCIDENTS.map((inc, i) => (
                    <tr key={inc.id} className={`border-b border-[#E6E3DC] ${i % 2 === 0 ? "bg-white" : "bg-[#F8F7F4]"} hover:bg-[#EAF0FA] transition-colors`}>
                      <td className="px-3 py-2.5 font-mono font-semibold text-[#16233A]">{inc.shortCode}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <CategoryBadge category={inc.category} size="sm" />
                          <span className="text-[#5A6B84]">{inc.category}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5"><StatusChip status={inc.status} /></td>
                      <td className="px-3 py-2.5"><PriorityBadge band={inc.priorityBand} score={inc.priorityScore} showScore /></td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">👥 {inc.reportCount}</td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{inc.assignedDepartment || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button className="px-2 py-1 text-[10px] font-semibold text-[#0E2A4E] bg-[#EAF0FA] rounded">View</button>
                          <button className="px-2 py-1 text-[10px] font-semibold text-[#C6A55C] bg-[#FFF3E0] rounded">Override</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ DEPARTMENTS ══════════════ */}
        {activeNav === "departments" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#16233A] font-display">Department Management</h2>
              <Button variant="primary" size="sm">+ Add Department</Button>
            </div>
            <div className="space-y-3">
              {MOCK_MINISTRY_STATS.departmentPerformance.map((dept) => (
                <div key={dept.name} className="bg-white rounded-xl border border-[#E6E3DC] p-4 flex items-center gap-4 shadow-sm">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm font-display"
                    style={{ background: "#0A1F3C" }}
                  >
                    {dept.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#16233A]">{dept.name}</p>
                    <p className="text-[11px] text-[#5A6B84]">
                      {dept.assigned} assigned · {dept.resolved} resolved this month · {Math.round(dept.verificationRate * 100)}% verification rate
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#E7F4EF] text-[#0E8A5F]">Active</span>
                  <div className="flex gap-1">
                    <button className="px-2 py-1 text-[11px] font-semibold text-[#0E2A4E] bg-[#EAF0FA] rounded">Edit</button>
                    <button className="px-2 py-1 text-[11px] font-semibold text-[#C0392B] bg-[#FEF0EE] rounded">Deactivate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ CATEGORIES ══════════════ */}
        {activeNav === "categories" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#16233A] font-display">Category Management</h2>
              <Button variant="primary" size="sm">+ Add Category</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Garbage / Waste", icon: "🗑️", dept: "LWMC Solid Waste", count: 38, active: true },
                { name: "Broken Road", icon: "🕳️", dept: "LDA – Roads", count: 27, active: true },
                { name: "Sewerage / Water", icon: "💧", dept: "WASA Lahore", count: 24, active: true },
                { name: "Streetlight", icon: "💡", dept: "LESCO", count: 14, active: true },
                { name: "Encroachment", icon: "🚧", dept: "LMC", count: 9, active: true },
                { name: "Flooding / Standing Water", icon: "🌊", dept: "WASA Lahore", count: 19, active: true },
                { name: "Safety Hazard", icon: "⚠️", dept: "LMC", count: 7, active: true },
                { name: "Drainage", icon: "🔩", dept: "WASA Lahore", count: 11, active: true },
                { name: "Infrastructure", icon: "🏗️", dept: "LDA – Roads", count: 8, active: true },
                { name: "Other", icon: "📋", dept: "LMC", count: 5, active: true },
              ].map((cat) => (
                <div key={cat.name} className="bg-white rounded-xl border border-[#E6E3DC] p-3 flex items-center gap-3 shadow-sm">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#16233A] truncate">{cat.name}</p>
                    <p className="text-[10px] text-[#5A6B84]">{cat.dept} · {cat.count} incidents</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAF0FA] text-[#0E2A4E] font-semibold">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ CONFIGURATION ══════════════ */}
        {activeNav === "configuration" && (
          <div className="p-6 space-y-6">
            <h2 className="text-base font-bold text-[#16233A] font-display">Platform Configuration</h2>

            {/* Priority weights */}
            <div className="bg-[#F8F7F4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide">Priority Score Weights</p>
                <span className={`text-xs font-bold ${weightValid ? "text-[#0E8A5F]" : "text-[#C0392B]"}`}>
                  Sum: {weightSum.toFixed(2)} {weightValid ? "✓" : "✕ Must equal 1.00"}
                </span>
              </div>
              <div className="space-y-3">
                {(Object.entries(weights) as [keyof typeof weights, number][]).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs font-medium text-[#16233A] w-36 capitalize">
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={val}
                      onChange={(e) =>
                        setWeights((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                      }
                      className="flex-1 accent-[#0E8A5F]"
                    />
                    <span className="text-xs font-bold text-[#16233A] w-10 text-right">
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#5A6B84] mt-3">
                ⚠ These are configurable proposed weights, not immutable policy. Changes do not retroactively affect existing incidents.
              </p>
            </div>

            {/* Thresholds */}
            <div className="bg-[#F8F7F4] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide mb-3">System Thresholds</p>
              <div className="space-y-3">
                {(Object.entries(thresholds) as [keyof typeof thresholds, number][]).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-[11px] font-medium text-[#16233A] w-56 truncate" title={key}>
                      {key.replace(/_/g, " ")}
                    </label>
                    <input
                      type="number"
                      value={val}
                      step={key.includes("THRESHOLD") ? 0.05 : 1}
                      min={0}
                      onChange={(e) =>
                        setThresholds((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                      }
                      className="w-24 border border-[#E6E3DC] rounded-lg px-2 py-1.5 text-xs text-[#16233A] focus:outline-none focus:border-[#0A1F3C] text-right"
                    />
                    <span className="text-[11px] text-[#5A6B84]">
                      {key.includes("THRESHOLD") ? "(0–1)" : key.includes("HOURS") ? "hours" : key.includes("DAYS") ? "days" : key.includes("RADIUS") ? "m" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                disabled={!weightValid}
                onClick={() => { setConfigSaved(true); setTimeout(() => setConfigSaved(false), 3000); }}
              >
                Save Configuration
              </Button>
              {configSaved && (
                <div className="flex items-center gap-1 text-xs text-[#0E8A5F] font-semibold">
                  ✅ Saved — audit log entry created
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ AUDIT LOG ══════════════ */}
        {activeNav === "audit" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#16233A] font-display">Audit Log</h2>
              <div className="flex gap-2 text-[11px]">
                {["All", "Incidents", "Users", "Config"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAuditFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      auditFilter === f
                        ? "bg-[#0A1F3C] text-white"
                        : "bg-[#F8F7F4] text-[#5A6B84] hover:bg-[#EAF0FA]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Immutability note */}
            <div className="bg-[#FFF8E1] border border-[#E0A400] rounded-xl p-3 flex items-center gap-2 mb-4">
              <span>🔒</span>
              <p className="text-xs text-[#B8860B]">
                <strong>Audit log is immutable.</strong> No entry can be modified or deleted. All actions are permanently recorded.
              </p>
            </div>

            <div className="space-y-2">
              {MOCK_AUDIT.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl border border-[#E6E3DC] p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{EVENT_ICONS[entry.event] || "•"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#16233A]">{entry.event.replace(/_/g, " ")}</p>
                        <span className="text-[10px] text-[#5A6B84] flex-shrink-0">{formatDateTime(entry.ts)}</span>
                      </div>
                      <p className="text-[11px] text-[#5A6B84] mt-0.5">{entry.summary}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-[#0A1F3C] font-medium">{entry.actor}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: ROLE_COLORS[entry.actorRole] || "#F0F4FA", color: ROLE_TEXT[entry.actorRole] || "#0A1F3C" }}
                        >
                          {entry.actorRole}
                        </span>
                        <span className="text-[10px] text-[#5A6B84] font-mono">{entry.entity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#5A6B84] mt-3 text-center">
              Showing 7 of 142 audit entries · Use filters to narrow results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
