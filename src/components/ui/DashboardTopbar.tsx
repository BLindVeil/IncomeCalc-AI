import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800 } from "@/lib/app-shared";

export interface DashboardTopbarProps {
  t: ThemeConfig;
  isDark: boolean;
  isMobile?: boolean;
  userName?: string;
  onSimulator?: () => void;
}

const CalendarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SearchIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const BellIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

export function DashboardTopbar({ t, isDark, isMobile = false, userName = "there", onSimulator }: DashboardTopbarProps) {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  const chipStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    color: t.muted,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: t.muted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: t.text, margin: 0 }}>
          Welcome back, {userName}
        </h1>
        <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>
          Here's your financial assessment for {month} {year}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button style={chipStyle}><CalendarIcon /> This month</button>

        {!isMobile && (
          <button
            style={iconBtnStyle}
            aria-label="Search"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.muted; }}
          >
            <SearchIcon />
          </button>
        )}

        {!isMobile && (
          <button
            style={{ ...iconBtnStyle, position: "relative" as const }}
            aria-label="Notifications"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.muted; }}
          >
            <BellIcon />
            <span
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#EF4444",
                border: `2px solid ${t.cardBg}`,
              }}
            />
          </button>
        )}

        <button
          onClick={onSimulator}
          style={{
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          <PlusIcon /> New scenario
        </button>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${EV_500}, ${EV_800})`,
            color: "#fff", fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {userName !== "there" ? userName.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    </div>
  );
}
