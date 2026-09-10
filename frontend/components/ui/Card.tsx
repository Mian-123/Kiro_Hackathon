"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  accent?: "emerald" | "gold" | "red" | "amber" | "navy";
}

export function Card({ children, className, onClick, hoverable = false, accent }: CardProps) {
  const accentClass = accent
    ? {
        emerald: "border-l-4 border-l-[#0E8A5F]",
        gold: "border-l-4 border-l-[#C6A55C]",
        red: "border-l-4 border-l-[#C0392B]",
        amber: "border-l-4 border-l-[#E0A400]",
        navy: "border-l-4 border-l-[#0A1F3C]",
      }[accent]
    : "";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg shadow-card border border-[#E6E3DC] p-4",
        hoverable && "transition-shadow duration-150 cursor-pointer hover:shadow-card-hover",
        accentClass,
        className
      )}
    >
      {children}
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
  accent?: "emerald" | "amber" | "red" | "navy" | "gold";
}

export function KPICard({ label, value, trend, trendUp, icon, accent }: KPICardProps) {
  const borderColor = accent
    ? {
        emerald: "#0E8A5F",
        amber: "#E0A400",
        red: "#C0392B",
        navy: "#0A1F3C",
        gold: "#C6A55C",
      }[accent]
    : "#0A1F3C";

  return (
    <div
      className="bg-white rounded-lg shadow-card border border-[#E6E3DC] p-4"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#5A6B84] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-[#16233A] mt-0.5 font-display">{value}</p>
        </div>
        {icon && <span className="text-2xl opacity-70">{icon}</span>}
      </div>
      {trend && (
        <p className={`text-xs mt-1 font-medium ${trendUp ? "text-[#0E8A5F]" : "text-[#C0392B]"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </p>
      )}
    </div>
  );
}
