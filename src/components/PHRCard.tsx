import type { ThemeConfig } from "@/lib/app-shared";
import { EV_50, EV_500, EV_800 } from "@/lib/app-shared";

export type PHRCardKind = "problem" | "hypothesis" | "result";

interface PHRCardProps {
  t: ThemeConfig;
  isDark: boolean;
  kind: PHRCardKind;
  body: string;
}

const ExclamationIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="3" x2="7" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="7" cy="11" r="1" fill={color} />
  </svg>
);

const LightbulbIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2 C 4.8 2, 3 3.8, 3 6 C 3 7.5, 3.8 8.5, 4.5 9 L 9.5 9 C 10.2 8.5, 11 7.5, 11 6 C 11 3.8, 9.2 2, 7 2 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="5" y1="11" x2="9" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="5.5" y1="13" x2="8.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckmarkIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <polyline points="3 7 6 10 11 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function getConfig(kind: PHRCardKind, isDark: boolean, t: ThemeConfig) {
  if (kind === "problem") {
    return {
      barColor: isDark ? "#FCA5A5" : "#F87171",
      pillBg: isDark ? "rgba(248,113,113,0.15)" : "#FDECEA",
      pillColor: isDark ? "#FCA5A5" : "#8B2C1E",
      circleBg: isDark ? "rgba(248,113,113,0.15)" : "#FEE2E2",
      iconColor: isDark ? "#FCA5A5" : "#DC2626",
      Icon: ExclamationIcon,
      label: "PROBLEM",
    };
  }
  if (kind === "hypothesis") {
    return {
      barColor: isDark ? "#FDE68A" : "#FBBF24",
      pillBg: isDark ? "rgba(251,191,36,0.15)" : "#FFF4D6",
      pillColor: isDark ? "#FDE68A" : "#7A5210",
      circleBg: isDark ? "rgba(251,191,36,0.15)" : "#FEF3C7",
      iconColor: isDark ? "#FDE68A" : "#D97706",
      Icon: LightbulbIcon,
      label: "HYPOTHESIS",
    };
  }
  // result
  return {
    barColor: EV_500,
    pillBg: isDark ? "rgba(82,183,136,0.15)" : EV_50,
    pillColor: isDark ? "#95D5B2" : EV_800,
    circleBg: isDark ? "rgba(82,183,136,0.15)" : EV_50,
    iconColor: isDark ? EV_500 : EV_800,
    Icon: CheckmarkIcon,
    label: "RESULT",
  };
}

function renderBody(kind: PHRCardKind, body: string, isDark: boolean, t: ThemeConfig) {
  if (kind === "hypothesis") {
    const leadColor = isDark ? "#FDE68A" : "#D97706";
    const idx = body.indexOf(" ", body.indexOf(" ") + 1);
    if (idx > 0) {
      return (
        <>
          <span style={{ color: leadColor, fontWeight: 600 }}>{body.slice(0, idx)}</span>
          {body.slice(idx)}
        </>
      );
    }
  }
  if (kind === "result") {
    const leadColor = isDark ? EV_500 : EV_800;
    const idx = body.indexOf(" ", body.indexOf(" ") + 1);
    if (idx > 0) {
      return (
        <>
          <span style={{ color: leadColor, fontWeight: 600 }}>{body.slice(0, idx)}</span>
          {body.slice(idx)}
        </>
      );
    }
  }
  return body;
}

export function PHRCard({ t, isDark, kind, body }: PHRCardProps) {
  const cfg = getConfig(kind, isDark, t);

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, width: "100%", background: cfg.barColor, flexShrink: 0 }} />

      {/* Content */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Pill */}
          <div
            style={{
              display: "inline-block",
              textTransform: "uppercase",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              padding: "4px 10px",
              borderRadius: 999,
              background: cfg.pillBg,
              color: cfg.pillColor,
            }}
          >
            {cfg.label}
          </div>
          {/* Icon circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: cfg.circleBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <cfg.Icon color={cfg.iconColor} />
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: 16, fontWeight: 400, color: t.text, lineHeight: 1.55 }}>
          {renderBody(kind, body, isDark, t)}
        </div>
      </div>
    </div>
  );
}
