import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800 } from "@/lib/app-shared";

export interface DashboardTopbarProps {
  t: ThemeConfig;
  isDark: boolean;
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

export function DashboardTopbar({ t, isDark, userName = "there", onSimulator }: DashboardTopbarProps) {
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button style={chipStyle}><CalendarIcon /> This month</button>
        <button
          onClick={onSimulator}
          style={{
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          <PlusIcon /> Run new scenario
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
