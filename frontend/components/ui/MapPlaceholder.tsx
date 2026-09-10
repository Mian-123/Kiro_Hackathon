"use client";

interface MapPlaceholderProps {
  height?: string;
  label?: string;
  pins?: { label: string; color: string; x: number; y: number }[];
  className?: string;
}

export function MapPlaceholder({
  height = "200px",
  label = "Lahore, Pakistan",
  pins = [],
  className = "",
}: MapPlaceholderProps) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height, background: "linear-gradient(160deg, #0A1F3C 0%, #0E2A4E 50%, #0E3A2E 100%)" }}
      role="img"
      aria-label={`Map of ${label}`}
    >
      {/* Fine grid */}
      <svg width="100%" height="100%" className="absolute inset-0 opacity-15">
        <defs>
          <pattern id={`grid-main`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#4A7B9D" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-main)`} />
      </svg>

      {/* Road network simulation */}
      <svg width="100%" height="100%" className="absolute inset-0 opacity-25">
        {/* Main horizontal roads */}
        <line x1="0" y1="40%" x2="100%" y2="38%" stroke="#6B9BB8" strokeWidth="2" />
        <line x1="0" y1="65%" x2="100%" y2="63%" stroke="#6B9BB8" strokeWidth="1.5" />
        {/* Main vertical roads */}
        <line x1="32%" y1="0" x2="34%" y2="100%" stroke="#6B9BB8" strokeWidth="1.5" />
        <line x1="65%" y1="0" x2="63%" y2="100%" stroke="#6B9BB8" strokeWidth="1.5" />
        {/* Secondary roads */}
        <line x1="0" y1="22%" x2="100%" y2="24%" stroke="#3A6B80" strokeWidth="1" />
        <line x1="0" y1="80%" x2="100%" y2="78%" stroke="#3A6B80" strokeWidth="1" />
        <line x1="50%" y1="0" x2="52%" y2="100%" stroke="#3A6B80" strokeWidth="1" />
        <line x1="18%" y1="0" x2="20%" y2="100%" stroke="#3A6B80" strokeWidth="0.8" />
        <line x1="80%" y1="0" x2="78%" y2="100%" stroke="#3A6B80" strokeWidth="0.8" />
        {/* Diagonal connector */}
        <line x1="32%" y1="38%" x2="65%" y2="63%" stroke="#3A6B80" strokeWidth="0.8" />
        {/* Block shapes (buildings) */}
        <rect x="36%" y="26%" width="8%" height="10%" fill="#0E3A5E" rx="1" opacity="0.6" />
        <rect x="55%" y="28%" width="7%" height="8%" fill="#0E3A5E" rx="1" opacity="0.6" />
        <rect x="20%" y="44%" width="10%" height="12%" fill="#0E3A5E" rx="1" opacity="0.6" />
        <rect x="68%" y="43%" width="9%" height="11%" fill="#0E3A5E" rx="1" opacity="0.5" />
        <rect x="37%" y="67%" width="8%" height="9%" fill="#0E3A5E" rx="1" opacity="0.6" />
      </svg>

      {/* Location label */}
      <div className="absolute bottom-3 left-3">
        <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {label}
        </span>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 right-2 text-[9px] text-white/40">
        © OpenStreetMap contributors
      </div>

      {/* Incident pins */}
      {pins.map((pin, i) => (
        <div
          key={i}
          className="absolute transform -translate-x-1/2 -translate-y-full"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white/80"
            style={{ background: pin.color }}
            title={pin.label}
          />
          <div className="w-0 h-0 mx-auto" style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: `5px solid ${pin.color}`,
          }} />
        </div>
      ))}

      {/* Default pins if none provided */}
      {pins.length === 0 && (
        <>
          {[
            { x: 35, y: 42, color: "#C0392B" },
            { x: 56, y: 50, color: "#E0A400" },
            { x: 66, y: 37, color: "#0E8A5F" },
            { x: 44, y: 62, color: "#E0A400" },
            { x: 72, y: 57, color: "#C0392B" },
          ].map((pin, i) => (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-md"
                style={{ background: pin.color }}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
