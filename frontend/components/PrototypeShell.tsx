"use client";

import { useState } from "react";
import { type Role } from "@/lib/utils";
import CitizenApp from "./roles/CitizenApp";
import StreetRepApp from "./roles/StreetRepApp";
import DepartmentApp from "./roles/DepartmentApp";
import MinistryApp from "./roles/MinistryApp";
import AdminApp from "./roles/AdminApp";

const ROLES: { id: Role; label: string; icon: string; desc: string; color: string }[] = [
  { id: "citizen",    label: "Citizen",    icon: "👤", desc: "Mobile app",     color: "#0E8A5F" },
  { id: "street-rep", label: "Street Rep", icon: "🏘️", desc: "Field mobile",   color: "#C6A55C" },
  { id: "department", label: "Department", icon: "🏛️", desc: "Dashboard",      color: "#0E2A4E" },
  { id: "ministry",   label: "Ministry",   icon: "🗺️", desc: "Command center", color: "#12345E" },
  { id: "admin",      label: "Admin",      icon: "⚙️", desc: "Governance",     color: "#5B2D8E" },
];

/** Phone bezel wrapper — renders children inside a realistic phone shape */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: 390,
        /* phone body */
        background: "#16233A",
        borderRadius: 50,
        padding: "14px 6px",
        boxShadow:
          "0 0 0 2px #2a3a52, 0 0 0 4px #0A1F3C, 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Side buttons */}
      <div className="absolute left-0 top-24 w-1 h-10 rounded-l" style={{ background: "#2a3a52", marginLeft: -4 }} />
      <div className="absolute left-0 top-40 w-1 h-10 rounded-l" style={{ background: "#2a3a52", marginLeft: -4 }} />
      <div className="absolute right-0 top-32 w-1 h-14 rounded-r" style={{ background: "#2a3a52", marginRight: -4 }} />

      {/* Screen area */}
      <div
        className="overflow-hidden"
        style={{
          borderRadius: 40,
          background: "#F8F7F4",
          minHeight: 780,
          maxHeight: 820,
          overflowY: "hidden",
        }}
      >
        {children}
      </div>

      {/* Home indicator */}
      <div className="flex justify-center mt-3">
        <div className="w-28 h-1 rounded-full" style={{ background: "#2a3a52" }} />
      </div>
    </div>
  );
}

export default function PrototypeShell() {
  const [activeRole, setActiveRole] = useState<Role>("citizen");
  const isMobile = activeRole === "citizen" || activeRole === "street-rep";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#081426" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-50 border-b border-[#12345E] px-4 py-3 flex items-center justify-between flex-wrap gap-3"
        style={{ background: "#0A1F3C" }}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#0E8A5F,#12A874)" }}>
            <span className="text-white font-bold text-sm" style={{ fontFamily: "Outfit,sans-serif" }}>CP</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm" style={{ fontFamily: "Outfit,sans-serif" }}>CivicPulse Lahore</h1>
            <p className="text-[11px]" style={{ color: "#5A6B84" }}>See it · Report it · Verify it · Resolve it</p>
          </div>
        </div>

        {/* Role switcher */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "#081426" }}>
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              aria-pressed={activeRole === role.id}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5"
              style={{
                background: activeRole === role.id ? role.color : "transparent",
                color: activeRole === role.id ? "#fff" : "#5A6B84",
              }}
              onMouseEnter={(e) => { if (activeRole !== role.id) { const b = e.currentTarget as HTMLElement; b.style.color="#fff"; b.style.background="#12345E"; }}}
              onMouseLeave={(e) => { if (activeRole !== role.id) { const b = e.currentTarget as HTMLElement; b.style.color="#5A6B84"; b.style.background="transparent"; }}}
            >
              <span aria-hidden>{role.icon}</span>
              <span className="hidden sm:inline">{role.label}</span>
              <span className="hidden xl:inline text-[10px] opacity-60" style={{ marginLeft: 2 }}>· {role.desc}</span>
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="px-2 py-1 rounded-md text-[10px] font-semibold" style={{ background: "#12345E", color: "#C6A55C" }}>PROTOTYPE</span>
          <span className="text-[10px]" style={{ color: "#5A6B84" }}>Lahore, Pakistan</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className={`flex-1 flex items-start justify-center ${isMobile ? "py-8 px-4" : "py-6 px-4"}`}>
        {activeRole === "citizen" && (
          <PhoneFrame><CitizenApp /></PhoneFrame>
        )}
        {activeRole === "street-rep" && (
          <PhoneFrame><StreetRepApp /></PhoneFrame>
        )}
        {activeRole === "department" && (
          <div className="w-full max-w-5xl"><DepartmentApp /></div>
        )}
        {activeRole === "ministry" && (
          <div className="w-full max-w-6xl"><MinistryApp /></div>
        )}
        {activeRole === "admin" && (
          <div className="w-full max-w-5xl"><AdminApp /></div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-3 text-[11px] border-t border-[#12345E]" style={{ color: "#5A6B84" }}>
        CivicPulse Lahore · Interactive Prototype · Next.js 16 + TypeScript + Tailwind CSS
        <span className="mx-2">·</span>
        <span style={{ color: "#C6A55C" }}>Hackathon Build</span>
        <span className="mx-2">·</span>
        5 roles · Full civic lifecycle
      </div>
    </div>
  );
}
