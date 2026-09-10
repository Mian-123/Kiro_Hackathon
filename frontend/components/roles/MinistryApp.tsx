"use client";

import { useState } from "react";
import { StatusChip } from "@/components/ui/StatusChip";
import { KPICard } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/Icons";
import { LiveMap } from "@/components/ui/LiveMap";
import { MOCK_MINISTRY_STATS, LAHORE_INCIDENT_MARKERS } from "@/lib/mock-data";

const DATE_PRESETS = ["Today", "7d", "30d", "3m", "6m"];
const CATEGORIES_FILTER = ["All Categories", "Garbage / Waste", "Broken Road", "Sewerage / Water", "Flooding", "Streetlight", "Other"];
const AREAS_FILTER = ["All Areas", "Gulberg", "Johar Town", "DHA Phase 5", "Ferozepur Road", "Model Town", "Cantt", "Shalimar"];

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "#0E2A4E",
  IN_PROGRESS: "#E0A400",
  AWAITING_CITIZEN_VERIFICATION: "#C6A55C",
  RESOLVED: "#0E8A5F",
  REOPENED: "#C0392B",
};

const NAV_ITEMS = [
  { id: "overview",    label: "Overview"    },
  { id: "map",         label: "City Map"    },
  { id: "hotspots",    label: "Hotspots"    },
  { id: "departments", label: "Departments" },
  { id: "trends",      label: "Trends"      },
];

export default function MinistryApp() {
  const [activeNav, setActiveNav] = useState("overview");
  const [datePreset, setDatePreset] = useState("30d");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [areaFilter, setAreaFilter] = useState("All Areas");

  const stats = MOCK_MINISTRY_STATS;
  const maxTrend = Math.max(...stats.resolutionTrend.map((d) => Math.max(d.created, d.resolved)));

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E6E3DC]">
      {/* ── Top bar ── */}
      <div className="bg-[#0A1F3C] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C6A55C] flex items-center justify-center">
            <span className="text-[#0A1F3C] font-bold text-sm" style={{ fontFamily: "Outfit,sans-serif" }}>M</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "Outfit,sans-serif" }}>Ministry of Local Government</p>
            <p className="text-[#5A6B84] text-xs">City Intelligence · Lahore · Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-[#081426] rounded-lg p-1">
            {DATE_PRESETS.map((p) => (
              <button key={p} onClick={() => setDatePreset(p)}
                className="px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                style={{ background: datePreset === p ? "#0E8A5F" : "transparent", color: datePreset === p ? "white" : "#5A6B84" }}>
                {p}
              </button>
            ))}
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#12345E] text-white text-xs rounded-lg px-2 py-1.5 border-none focus:outline-none">
            {CATEGORIES_FILTER.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-[#12345E] text-white text-xs rounded-lg px-2 py-1.5 border-none focus:outline-none">
            {AREAS_FILTER.map((a) => <option key={a}>{a}</option>)}
          </select>
          <span className="text-[11px] font-medium" style={{ color: "#0E8A5F" }}>● Live · 2 min ago</span>
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="bg-[#0E2A4E] flex border-b border-[#12345E] overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} onClick={() => setActiveNav(item.id)}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-colors"
            style={{ color: activeNav === item.id ? "white" : "#5A6B84", borderBottom: activeNav === item.id ? "2px solid #0E8A5F" : "2px solid transparent" }}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "680px" }}>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {activeNav === "overview" && (
          <div className="p-6 space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              <KPICard label="Total Active" value={stats.totalActive} icon="📊" accent="navy" trend="↑ 12 vs last period" trendUp={false} />
              <KPICard label="Resolved" value={stats.resolvedThisPeriod} icon="✅" accent="emerald" trend="↑ 18% vs last period" trendUp />
              <KPICard label="Reopened" value={stats.reopened} icon="↺" accent="red" />
              <KPICard label="Awaiting Verify" value={stats.awaitingVerification} icon="?" accent="gold" />
              <KPICard label="Avg Resolution" value={`${stats.avgResolutionHours}h`} icon="⏱" accent="amber" />
              <KPICard label="Critical" value={stats.criticalIncidents} icon="⚠️" accent="red" />
            </div>

            {/* Two-col layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Category breakdown */}
              <div className="bg-[#F8F7F4] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide mb-3">Category Distribution</p>
                <div className="space-y-2">
                  {stats.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <CategoryBadge category={cat.category} size="sm" />
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-[#16233A] font-medium">{cat.category}</span>
                          <span className="text-[#5A6B84]">{cat.count} ({cat.pct}%)</span>
                        </div>
                        <div className="bg-[#E6E3DC] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0A1F3C]"
                            style={{ width: `${cat.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-[#F8F7F4] rounded-xl p-4">
                <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide mb-3">Status Distribution</p>
                <div className="space-y-2">
                  {stats.statusBreakdown.map((s) => (
                    <div key={s.status} className="flex items-center gap-2">
                      <StatusChip status={s.status as any} />
                      <div className="flex-1 bg-[#E6E3DC] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(s.count / stats.totalActive) * 100}%`,
                            background: STATUS_COLORS[s.status] || "#0A1F3C",
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#16233A] w-6">{s.count}</span>
                    </div>
                  ))}
                </div>

                {/* Verification outcomes */}
                <div className="mt-4 pt-3 border-t border-[#E6E3DC]">
                  <p className="text-[11px] text-[#5A6B84] font-semibold mb-2">Verification Outcomes</p>
                  <div className="flex gap-3">
                    {[
                      { label: "Confirmed", count: 28, color: "#0E8A5F" },
                      { label: "Rejected", count: 8, color: "#C0392B" },
                      { label: "Pending", count: 4, color: "#C6A55C" },
                    ].map((v) => (
                      <div key={v.label} className="flex-1 text-center">
                        <p className="text-xl font-bold font-display" style={{ color: v.color }}>{v.count}</p>
                        <p className="text-[10px] text-[#5A6B84]">{v.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution trend chart */}
            <div className="bg-[#F8F7F4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide">Resolution Trend</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-[#0A1F3C] inline-block" /> Created</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-[#0E8A5F] inline-block" /> Resolved</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-24">
                {stats.resolutionTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: "80px" }}>
                      <div
                        className="flex-1 rounded-t-sm bg-[#0A1F3C] opacity-80"
                        style={{ height: `${(d.created / maxTrend) * 80}px` }}
                        title={`Created: ${d.created}`}
                      />
                      <div
                        className="flex-1 rounded-t-sm bg-[#0E8A5F]"
                        style={{ height: `${(d.resolved / maxTrend) * 80}px` }}
                        title={`Resolved: ${d.resolved}`}
                      />
                    </div>
                    <p className="text-[9px] text-[#5A6B84]">{d.date.replace("Aug ", "")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ MAP ══ */}
        {activeNav === "map" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#16233A]" style={{ fontFamily: "Outfit,sans-serif" }}>City-Wide Incident Map</h2>
              <div className="flex gap-2">
                {["All", "Critical", "High", "Resolved"].map((f) => (
                  <button key={f} className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#F8F7F4] border border-[#E6E3DC] text-[#5A6B84] hover:bg-[#EAF0FA]">{f}</button>
                ))}
              </div>
            </div>
            <LiveMap height="420px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} className="rounded-xl" />
            <div className="mt-3 flex gap-4 flex-wrap">
              {[{l:"Critical",c:"#C0392B"},{l:"High",c:"#C6A55C"},{l:"Medium",c:"#E0A400"},{l:"Resolved",c:"#0E8A5F"}].map((leg)=>(
                <div key={leg.l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: leg.c }} />
                  <span className="text-xs text-[#5A6B84]">{leg.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ HOTSPOTS ══════════════ */}
        {activeNav === "hotspots" && (
          <div className="p-6 space-y-4">
            <h2 className="text-base font-bold text-[#16233A] font-display">Incident Hotspots</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                {stats.hotspots.map((h, i) => (
                  <div
                    key={h.area}
                    className="bg-white rounded-xl border border-[#E6E3DC] p-4 shadow-sm"
                    style={{ borderLeft: `4px solid ${i === 0 || i === 3 ? "#C0392B" : i === 1 ? "#C6A55C" : "#E0A400"}` }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-[#16233A] font-display">#{i + 1}</span>
                          <p className="text-sm font-bold text-[#16233A]">{h.area}</p>
                        </div>
                        <p className="text-xs text-[#5A6B84] mt-0.5">Dominant: {h.dominant}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#16233A] font-display">{h.count}</p>
                        <p className="text-[11px] text-[#5A6B84]">incidents</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-3">
                      <div className="flex-1 bg-[#F8F7F4] rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-[#16233A] font-display">{h.avgPriority}</p>
                        <p className="text-[10px] text-[#5A6B84]">avg priority</p>
                      </div>
                      <div className="flex-1 bg-[#FEF0EE] rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-[#C0392B] font-display">{h.critical}</p>
                        <p className="text-[10px] text-[#C0392B]">critical</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <LiveMap height="400px" markers={LAHORE_INCIDENT_MARKERS} zoom={12} />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ DEPARTMENTS ══════════════ */}
        {activeNav === "departments" && (
          <div className="p-6">
            <h2 className="text-base font-bold text-[#16233A] font-display mb-4">Department Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0A1F3C] text-white">
                    {["Department", "Assigned", "In Progress", "Resolved", "Avg Hours", "Reopened %", "Verification %"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold first:rounded-tl-lg last:rounded-tr-lg">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.departmentPerformance.map((dept, i) => (
                    <tr
                      key={dept.name}
                      className={`border-b border-[#E6E3DC] ${i % 2 === 0 ? "bg-white" : "bg-[#F8F7F4]"} hover:bg-[#EAF0FA] transition-colors`}
                    >
                      <td className="px-3 py-2.5 font-semibold text-[#16233A]">{dept.name}</td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{dept.assigned}</td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{dept.inProgress}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#0E8A5F]">{dept.resolved}</td>
                      <td className="px-3 py-2.5 text-[#5A6B84]">{dept.avgHours}h</td>
                      <td className="px-3 py-2.5">
                        <span className={`font-semibold ${dept.reopenedRate > 0.15 ? "text-[#C0392B]" : "text-[#5A6B84]"}`}>
                          {Math.round(dept.reopenedRate * 100)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-[#E6E3DC] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#0E8A5F]"
                              style={{ width: `${dept.verificationRate * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-[#0E8A5F]">
                            {Math.round(dept.verificationRate * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-[#E7F4EF] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#0E8A5F] font-display">87%</p>
                <p className="text-xs text-[#5A6B84]">City-wide verification acceptance</p>
              </div>
              <div className="bg-[#F8F7F4] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#16233A] font-display">17.4h</p>
                <p className="text-xs text-[#5A6B84]">City-wide avg resolution time</p>
              </div>
              <div className="bg-[#FEF0EE] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#C0392B] font-display">11%</p>
                <p className="text-xs text-[#5A6B84]">City-wide reopen rate</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TRENDS ══════════════ */}
        {activeNav === "trends" && (
          <div className="p-6 space-y-6">
            <h2 className="text-base font-bold text-[#16233A] font-display">Resolution Trends</h2>

            {/* Trend chart - larger */}
            <div className="bg-[#F8F7F4] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide">Daily Incidents Created vs Resolved</p>
                <div className="flex gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0A1F3C] inline-block" /> Created</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0E8A5F] inline-block" /> Resolved</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-36">
                {stats.resolutionTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                      <div
                        className="flex-1 rounded-t bg-[#0A1F3C] opacity-80 min-h-[2px]"
                        style={{ height: `${(d.created / maxTrend) * 120}px` }}
                      />
                      <div
                        className="flex-1 rounded-t bg-[#0E8A5F] min-h-[2px]"
                        style={{ height: `${(d.resolved / maxTrend) * 120}px` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#5A6B84]">{d.date}</p>
                    <p className="text-[10px] font-semibold text-[#0E8A5F]">{d.resolved - d.created >= 0 ? `+${d.resolved - d.created}` : d.resolved - d.created}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category trend */}
            <div className="bg-[#F8F7F4] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#5A6B84] uppercase tracking-wide mb-3">Category Breakdown</p>
              <div className="space-y-3">
                {stats.categoryBreakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <CategoryBadge category={cat.category} size="sm" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#16233A] font-medium">{cat.category}</span>
                        <span className="text-[#5A6B84]">{cat.count} incidents ({cat.pct}%)</span>
                      </div>
                      <div className="bg-[#E6E3DC] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0A1F3C]"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-[#EAF0FA] rounded-xl p-3 flex items-center gap-2">
              <span className="text-[#0A1F3C]">🔒</span>
              <p className="text-xs text-[#0A1F3C]">
                <strong>Privacy:</strong> All statistics are city-wide aggregates. No citizen phone, email, or personal information is exposed on this dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
