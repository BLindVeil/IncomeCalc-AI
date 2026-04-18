import { MONO_FONT_STACK } from "@/lib/app-shared";
import type { ThemeConfig } from "@/lib/app-shared";

export type PHRAccentKind = "reveal" | "topMove" | "stability" | "scenario";

interface PHRAccentCardProps {
  t: ThemeConfig;
  isDark: boolean;
  kind: PHRAccentKind;
}

const base: React.CSSProperties = {
  background: "linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)",
  borderRadius: 16,
  padding: 24,
  minHeight: 280,
  color: "#fff",
  display: "flex",
  flexDirection: "column",
};

const caption: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  opacity: 0.7,
  fontWeight: 500,
  marginBottom: 16,
};

const mono: React.CSSProperties = {
  fontFamily: MONO_FONT_STACK,
  fontFeatureSettings: "'tnum', 'zero'",
};

const pill: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  padding: "4px 10px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 500,
  alignSelf: "flex-start",
  marginTop: "auto",
};

function BarRow({ label, fillPct, value, solid }: { label: string; fillPct: string; value: string; solid?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#fff", opacity: 0.7, width: 64, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: fillPct, height: "100%", background: solid ? "#fff" : "rgba(255,255,255,0.5)", borderRadius: 4 }} />
      </div>
      <span style={{ ...mono, fontSize: 11, fontWeight: 500, color: "#fff", width: 52, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function MiniBar({ label, fillPct, value }: { label: string; fillPct: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#fff", opacity: 0.7, width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
        <div style={{ width: fillPct, height: "100%", background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: "#fff", fontWeight: 500, width: 32, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function RevealVariant() {
  return (
    <div style={base}>
      <div style={caption}>REQUIRED INCOME</div>
      <div style={{ ...mono, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>$6,840</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2, marginBottom: 24 }}>per month</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <BarRow label="Current" fillPct="78%" value="$5,400" />
        <BarRow label="Required" fillPct="100%" value="$6,840" solid />
      </div>
      <div style={pill}>Gap: +$1,440/mo</div>
    </div>
  );
}

function TopMoveVariant() {
  const rows = [
    { rank: "1", desc: "Cut rent by $200/mo", impact: "+$2,400/yr" },
    { rank: "2", desc: "Refi student loans", impact: "+$1,440/yr" },
    { rank: "3", desc: "Cut subscriptions", impact: "+$960/yr" },
  ];

  return (
    <div style={base}>
      <div style={caption}>TOP MOVES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        {rows.map((r) => (
          <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...mono, width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
              {r.rank}
            </div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{r.desc}</span>
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 500, flexShrink: 0 }}>
              <span style={mono}>{r.impact}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StabilityVariant() {
  return (
    <div style={base}>
      <div style={caption}>STABILITY SCORE</div>
      <div style={{ ...mono, fontSize: 44, fontWeight: 700, lineHeight: 1 }}>82</div>
      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, marginBottom: 16 }}>Strong</div>
      {/* Half-donut */}
      <svg width={120} height={60} viewBox="0 0 120 60" fill="none" style={{ alignSelf: "flex-start" }}>
        <path d="M8 56 A52 52 0 0 1 112 56" stroke="rgba(255,255,255,0.2)" strokeWidth={8} strokeLinecap="round" fill="none" />
        <path d="M8 56 A52 52 0 0 1 112 56" stroke="white" strokeWidth={8} strokeLinecap="round" fill="none" strokeDasharray={`${0.82 * 163} ${163}`} />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        <MiniBar label="Housing" fillPct="72%" value="28%" />
        <MiniBar label="Savings" fillPct="60%" value="18%" />
        <MiniBar label="Debt" fillPct="85%" value="15%" />
      </div>
    </div>
  );
}

function ScenarioVariant() {
  return (
    <div style={base}>
      <div style={caption}>SCENARIO</div>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, marginBottom: 24 }}>Moving to $1,800 apt</div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>Current</div>
        <div style={{ ...mono, fontSize: 22, fontWeight: 500, opacity: 0.5, textDecoration: "line-through" }}>$6,840</div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 500, marginBottom: 2 }}>With scenario</div>
        <div style={{ ...mono, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>$6,440</div>
      </div>
      <div style={pill}>−$400/mo required</div>
    </div>
  );
}

export function PHRAccentCard({ kind }: PHRAccentCardProps) {
  if (kind === "reveal") return <RevealVariant />;
  if (kind === "topMove") return <TopMoveVariant />;
  if (kind === "stability") return <StabilityVariant />;
  return <ScenarioVariant />;
}
