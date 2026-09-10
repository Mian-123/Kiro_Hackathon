"use client";

import { useState } from "react";
import { LiveMap } from "@/components/ui/LiveMap";
import { CategoryBadge } from "@/components/ui/Icons";
import {
  LAHORE_INCIDENT_MARKERS,
  MOCK_CITY_KPIS,
  MOCK_DISTRICT_LEAGUE,
  MOCK_URGENT_STREETS,
  MOCK_CONTRACTOR_OVERSIGHT,
  MOCK_BUDGET_ENFORCEMENT,
  MOCK_MINISTRY_STATS,
  MOCK_UC_BREAKDOWN,
} from "@/lib/mock-data";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PAGE_BG = "#F5F3EF";
const BORDER = "#E6E3DC";
const CARD_SHADOW = "0 1px 4px rgba(10,31,60,0.08)";
const HEADING = "#16233A";
const MUTED = "#5A6B84";
const GREEN = "#0E8A5F";
const GOLD = "#C6A55C";
const RED = "#C0392B";
const BLUE = "#0E2A4E";
const TITLE_FONT = "Outfit,sans-serif";

// ── Reusable bits ──────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 ${className}`}
      style={{ border: `1px solid ${BORDER}`, boxShadow: CARD_SHADOW }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-wider mb-3"
      style={{ color: MUTED }}
    >
      {children}
    </p>
  );
}

function scoreColor(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 60) return GOLD;
  return RED;
}

const CATEGORY_BAR_COLORS: Record<string, string> = {
  "Garbage / Waste": "#0E8A5F",
  "Broken Road": "#C0392B",
  "Sewerage / Water": "#2563EB",
  Flooding: "#7C3AED",
  Streetlight: "#E0A400",
};

const LEGEND_STATUS = [
  { l: "Good", c: GREEN },
  { l: "Needs work", c: GOLD },
  { l: "Urgent", c: RED },
];

const LEGEND_TYPE = [
  { l: "Roads", c: "#C0392B" },
  { l: "Water", c: "#2563EB" },
  { l: "Electric", c: "#E0A400" },
  { l: "Waste", c: "#0E8A5F" },
];

export default function MinistryApp() {
  const [datePreset] = useState("30d");
  void datePreset;

  const kpis = MOCK_CITY_KPIS;
  const stats = MOCK_MINISTRY_STATS;
  const budget = MOCK_BUDGET_ENFORCEMENT;
  const oversight = MOCK_CONTRACTOR_OVERSIGHT;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: PAGE_BG }}
    >
      <div className="p-6 space-y-6" style={{ maxWidth: "100%" }}>
        {/* ══════════════ HEADER ══════════════ */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: HEADING, fontFamily: TITLE_FONT }}
            >
              Lahore City Operations Center
            </h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Mayor&apos;s command view · all 7 districts · live
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: GOLD }}
            >
              Announce
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: RED }}
            >
              Activate Emergency Mode
            </button>
          </div>
        </div>

        {/* ══════════════ KPI ROW ══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <SectionLabel>Citywide Street Score</SectionLabel>
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl font-bold"
                style={{ color: HEADING, fontFamily: TITLE_FONT }}
              >
                {kpis.citywideStreetScore}
              </span>
              <span className="text-sm font-semibold" style={{ color: GREEN }}>
                ▲{kpis.scoreTrend}
              </span>
            </div>
          </Card>
          <Card>
            <SectionLabel>Complaints Today</SectionLabel>
            <span
              className="text-3xl font-bold"
              style={{ color: HEADING, fontFamily: TITLE_FONT }}
            >
              {kpis.complaintsToday}
            </span>
          </Card>
          <Card>
            <SectionLabel>Resolved On Time · July</SectionLabel>
            <span
              className="text-3xl font-bold"
              style={{ color: GOLD, fontFamily: TITLE_FONT }}
            >
              {kpis.resolvedOnTimePct}%
            </span>
          </Card>
          <Card>
            <SectionLabel>Streets In Red</SectionLabel>
            <span
              className="text-3xl font-bold"
              style={{ color: RED, fontFamily: TITLE_FONT }}
            >
              {kpis.streetsInRed}
            </span>
          </Card>
        </div>

        {/* ══════════════ MAP + LEAGUE ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map — ≈60% */}
          <div className="lg:col-span-3">
            <Card>
              <SectionLabel>
                City map · {kpis.streetsMapped.toLocaleString()} streets mapped
              </SectionLabel>
              <LiveMap
                height="360px"
                markers={LAHORE_INCIDENT_MARKERS}
                zoom={11}
                className="rounded-xl"
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {LEGEND_STATUS.map((leg) => (
                  <div key={leg.l} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: leg.c }}
                    />
                    <span className="text-xs" style={{ color: MUTED }}>
                      {leg.l}
                    </span>
                  </div>
                ))}
                <span className="w-px h-4" style={{ background: BORDER }} />
                {LEGEND_TYPE.map((leg) => (
                  <div key={leg.l} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ background: leg.c }}
                    />
                    <span className="text-xs" style={{ color: MUTED }}>
                      {leg.l}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* League table — ≈40% */}
          <div className="lg:col-span-2">
            <Card>
              <SectionLabel>District league table · July</SectionLabel>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ color: MUTED }}>
                    <th className="text-left font-semibold pb-2">#</th>
                    <th className="text-left font-semibold pb-2">District</th>
                    <th className="text-right font-semibold pb-2">Score</th>
                    <th className="text-right font-semibold pb-2">On Time</th>
                    <th className="text-right font-semibold pb-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_DISTRICT_LEAGUE.map((d) => (
                    <tr
                      key={d.rank}
                      className="border-t"
                      style={{ borderColor: BORDER }}
                    >
                      <td className="py-2 font-semibold" style={{ color: HEADING }}>
                        {d.rank}
                      </td>
                      <td className="py-2" style={{ color: HEADING }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">{d.name}</span>
                          {d.mostImproved && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#E7F4EF", color: GREEN }}
                            >
                              Most improved
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="py-2 text-right font-bold"
                        style={{ color: scoreColor(d.score) }}
                      >
                        {d.score}
                      </td>
                      <td className="py-2 text-right" style={{ color: MUTED }}>
                        {d.onTimePct}%
                      </td>
                      <td
                        className="py-2 text-right font-semibold"
                        style={{ color: d.trend >= 0 ? GREEN : RED }}
                      >
                        {d.trend >= 0 ? "▲" : "▼"}
                        {Math.abs(d.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>

        {/* ══════════════ URGENT / CONTRACTOR / BUDGET ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent streets */}
          <Card>
            <SectionLabel>Urgent streets board</SectionLabel>
            <div className="space-y-3">
              {MOCK_URGENT_STREETS.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                  style={{ borderColor: BORDER }}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                      style={{ background: RED }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: HEADING }}
                      >
                        {s.name}{" "}
                        <span style={{ color: MUTED }}>· {s.score}/100</span>
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                        Red for {s.redForDays} days · Officer: {s.officer},{" "}
                        {s.uc} · {s.note}
                      </p>
                    </div>
                  </div>
                  {s.action === "escalate" && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white flex-shrink-0"
                      style={{ background: RED }}
                    >
                      Escalate
                    </button>
                  )}
                  {s.action === "plan_filed" && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white flex-shrink-0"
                      style={{ background: BLUE }}
                    >
                      Plan filed
                    </button>
                  )}
                  {s.action === "in_enforcement" && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0"
                      style={{ border: `1px solid ${BLUE}`, color: BLUE }}
                    >
                      In enforcement
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Contractor oversight */}
          <Card>
            <SectionLabel>Contractor oversight</SectionLabel>
            <div className="space-y-3">
              <div
                className="rounded-xl p-3"
                style={{ background: "#E7F4EF" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: GREEN }}>
                  Top performer
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: HEADING }}>
                  {oversight.topPerformer.name}{" "}
                  <span style={{ color: GOLD }}>★{oversight.topPerformer.rating}</span>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {oversight.topPerformer.onTimePct}% on time · {oversight.topPerformer.note}
                </p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "#FEF0EE" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: RED }}>
                  Blacklisted
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: HEADING }}>
                  {oversight.blacklisted.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {oversight.blacklisted.reason} · {oversight.blacklisted.detail}
                </p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "#FBF6EC" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
                  Under review
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: HEADING }}>
                  {oversight.underReview.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {oversight.underReview.note}
                </p>
              </div>
            </div>
          </Card>

          {/* Budget and enforcement */}
          <Card>
            <SectionLabel>Budget and enforcement</SectionLabel>
            <div className="space-y-4">
              <div>
                <span
                  className="text-3xl font-bold"
                  style={{ color: HEADING, fontFamily: TITLE_FONT }}
                >
                  {budget.monthlySpend}
                </span>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  {budget.period}
                </p>
                <div
                  className="mt-2 rounded-full h-1.5 overflow-hidden"
                  style={{ background: BORDER }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: "72%", background: BLUE }}
                  />
                </div>
              </div>

              <div className="border-t pt-3" style={{ borderColor: BORDER }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    Fines issued · July
                  </span>
                  <span className="text-sm font-bold" style={{ color: HEADING }}>
                    {budget.finesIssued}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {budget.finesDetail}
                </p>
              </div>

              <div className="border-t pt-3" style={{ borderColor: BORDER }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    Community service
                  </span>
                  <span className="text-sm font-bold" style={{ color: HEADING }}>
                    {budget.communityService}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {budget.communityServiceNote}
                </p>
              </div>

              <div className="border-t pt-3" style={{ borderColor: BORDER }}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    Cost anomaly flags
                  </span>
                  <span className="text-sm font-bold" style={{ color: RED }}>
                    {budget.costAnomalyFlags}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {budget.costAnomalyNote}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ══════════════ DEPARTMENT PERFORMANCE ══════════════ */}
        <Card>
          <SectionLabel>Department Performance</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white" style={{ background: "#0A1F3C" }}>
                  {[
                    "Department",
                    "Assigned",
                    "In Progress",
                    "Resolved",
                    "Avg Hours",
                    "Reopened %",
                    "Verification %",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left font-semibold first:rounded-tl-lg last:rounded-tr-lg"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.departmentPerformance.map((dept, i) => (
                  <tr
                    key={dept.name}
                    className="border-b"
                    style={{
                      borderColor: BORDER,
                      background: i % 2 === 0 ? "white" : PAGE_BG,
                    }}
                  >
                    <td className="px-3 py-2.5 font-semibold" style={{ color: HEADING }}>
                      {dept.name}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>
                      {dept.assigned}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>
                      {dept.inProgress}
                    </td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: GREEN }}>
                      {dept.resolved}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: MUTED }}>
                      {dept.avgHours}h
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="font-semibold"
                        style={{ color: dept.reopenedRate > 0.15 ? RED : MUTED }}
                      >
                        {Math.round(dept.reopenedRate * 100)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-16 rounded-full h-1.5 overflow-hidden"
                          style={{ background: BORDER }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${dept.verificationRate * 100}%`,
                              background: GREEN,
                            }}
                          />
                        </div>
                        <span className="font-semibold" style={{ color: GREEN }}>
                          {Math.round(dept.verificationRate * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl p-4 text-center" style={{ background: "#E7F4EF" }}>
              <p className="text-2xl font-bold" style={{ color: GREEN, fontFamily: TITLE_FONT }}>
                87%
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                City-wide verification acceptance
              </p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: PAGE_BG }}>
              <p className="text-2xl font-bold" style={{ color: HEADING, fontFamily: TITLE_FONT }}>
                17.4h
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                City-wide avg resolution time
              </p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "#FEF0EE" }}>
              <p className="text-2xl font-bold" style={{ color: RED, fontFamily: TITLE_FONT }}>
                11%
              </p>
              <p className="text-xs" style={{ color: MUTED }}>
                City-wide reopen rate
              </p>
            </div>
          </div>
        </Card>

        {/* ══════════════ CATEGORY DISTRIBUTION ══════════════ */}
        <Card>
          <SectionLabel>Category Distribution</SectionLabel>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <CategoryBadge category={cat.category} size="sm" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: HEADING }}>
                      {cat.category}
                    </span>
                    <span style={{ color: MUTED }}>
                      {cat.count} ({cat.pct}%)
                    </span>
                  </div>
                  <div
                    className="rounded-full h-2 overflow-hidden"
                    style={{ background: BORDER }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.pct}%`,
                        background: CATEGORY_BAR_COLORS[cat.category] || MUTED,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════════════ UC BREAKDOWN ══════════════ */}
        <Card>
          <SectionLabel>Union Council (UC) Issue Breakdown</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: MUTED }}>
                  <th className="text-left font-semibold pb-2">Union Council</th>
                  <th className="text-right font-semibold pb-2">Total Solved</th>
                  <th className="text-right font-semibold pb-2">Pending</th>
                  <th className="text-right font-semibold pb-2">In Process</th>
                  <th className="text-right font-semibold pb-2">
                    Completed (Awaiting Verify)
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_UC_BREAKDOWN.map((uc) => (
                  <tr
                    key={uc.uc}
                    className="border-t"
                    style={{ borderColor: BORDER }}
                  >
                    <td className="py-2.5 font-semibold" style={{ color: HEADING }}>
                      {uc.uc}
                    </td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: GREEN }}>
                      {uc.totalSolved}
                    </td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: RED }}>
                      {uc.pending}
                    </td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: "#E0A400" }}>
                      {uc.inProcess}
                    </td>
                    <td className="py-2.5 text-right font-semibold" style={{ color: "#2563EB" }}>
                      {uc.completed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
