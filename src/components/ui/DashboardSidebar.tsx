import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800 } from "@/lib/app-shared";

export interface DashboardSidebarProps {
  t: ThemeConfig;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
  onSignOut?: () => void;
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────
const GridIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const DocIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const PulseIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const ChartUpIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const ClockIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const GearIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const HelpIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const SunIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ─── Nav config ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: GridIcon },
  { id: "calculator", label: "Calculator", icon: DocIcon },
  { id: "diagnosis", label: "Diagnosis", icon: PulseIcon },
  { id: "simulator", label: "Simulator", icon: ClockIcon },
  { id: "plan", label: "Plan", icon: ChartUpIcon },
  { id: "settings", label: "Settings", icon: GearIcon },
];

const BOTTOM_ITEMS = [
  { id: "help", label: "Help", icon: HelpIcon },
  { id: "logout", label: "Logout", icon: LogoutIcon },
];

export function DashboardSidebar({ t, isDark, setIsDark, activeItem = "dashboard", onNavigate, onSignOut }: DashboardSidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const itemStyle = (id: string): React.CSSProperties => {
    const isActive = id === activeItem;
    const isHover = id === hovered;
    return {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: isActive ? 600 : 500,
      cursor: "pointer",
      transition: "background 150ms, color 150ms",
      background: isActive
        ? `linear-gradient(135deg, ${EV_800}, ${EV_600})`
        : isHover
          ? t.border
          : "transparent",
      color: isActive ? "#fff" : t.muted,
      boxShadow: isActive ? "0 2px 8px rgba(27,67,50,0.18)" : "none",
    };
  };

  return (
    <div
      style={{
        width: 240,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: t.cardBg,
        borderRight: `1px solid ${t.border}`,
        padding: "24px 16px 16px",
        boxSizing: "border-box",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${EV_500}, ${EV_800})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          IC
        </div>
        <span style={{ fontWeight: 700, fontSize: 16, color: t.text, letterSpacing: "-0.02em" }}>
          IncomeCalc
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            style={itemStyle(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNavigate?.(item.id)}
          >
            <item.icon />
            {item.label}
          </div>
        ))}
      </nav>

      {/* Theme toggle */}
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          border: `1px solid ${t.border}`,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <button
          onClick={() => setIsDark(false)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: !isDark ? t.primary : "transparent",
            color: !isDark ? "#fff" : t.muted,
          }}
        >
          <SunIcon /> Light
        </button>
        <button
          onClick={() => setIsDark(true)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: isDark ? t.primary : "transparent",
            color: isDark ? "#fff" : t.muted,
          }}
        >
          <MoonIcon /> Dark
        </button>
      </div>

      {/* Bottom items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {BOTTOM_ITEMS.map((item) => (
          <div
            key={item.id}
            style={itemStyle(item.id)}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (item.id === "logout") onSignOut?.();
              else onNavigate?.(item.id);
            }}
          >
            <item.icon />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
