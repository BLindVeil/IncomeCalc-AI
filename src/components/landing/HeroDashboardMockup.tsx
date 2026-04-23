import { MONO_FONT_STACK, EV_50, EV_200, EV_500, EV_700, EV_800, EV_900, NEUTRAL_TEXT, NEUTRAL_MUTED, NEUTRAL_BORDER } from "@/lib/app-shared";

const BORDER = NEUTRAL_BORDER;
const CARD_BG = "#FFFFFF";
const TEXT = NEUTRAL_TEXT;
const MUTED = NEUTRAL_MUTED;

function MockMetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 8, color: MUTED, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color ?? TEXT, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum','zero'", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 7, color: MUTED, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function MockBarGroup({ h1, h2, label }: { h1: number; h2: number; label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 60 }}>
        <div style={{ width: 7, height: h1, borderRadius: "2px 2px 0 0", background: EV_500 }} />
        <div style={{ width: 7, height: h2, borderRadius: "2px 2px 0 0", background: EV_200 }} />
      </div>
      <span style={{ fontSize: 6, color: MUTED, fontFamily: MONO_FONT_STACK }}>{label}</span>
    </div>
  );
}

export function HeroDashboardMockup({ isMobile }: { isMobile: boolean }) {
  const scale = isMobile ? 0.82 : 1;
  const mockupWidth = 880;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: mockupWidth * scale,
        margin: "0 auto",
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          background: "#F3F4F6",
          borderRadius: "12px 12px 0 0",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
        <div
          style={{
            flex: 1,
            marginLeft: 8,
            background: "#E5E7EB",
            borderRadius: 6,
            height: 18,
            display: "flex",
            alignItems: "center",
            paddingLeft: 8,
            fontSize: 8,
            color: MUTED,
          }}
        >
          ascentra.finance
        </div>
      </div>

      {/* App content */}
      <div
        style={{
          display: "flex",
          background: "#F9FAFB",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
          border: `1px solid ${BORDER}`,
          borderTop: "none",
          height: isMobile ? 280 : 380,
        }}
      >
        {/* Sidebar */}
        {!isMobile && (
          <div
            style={{
              width: 160,
              background: `linear-gradient(180deg, ${EV_900} 0%, ${EV_800} 100%)`,
              padding: "14px 10px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, paddingLeft: 4 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: `linear-gradient(135deg, ${EV_800}, ${EV_500})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                  <path d="M10 3L17 15H13L10 9.5L7 15H3L10 3Z" fill="white" />
                  <line x1="6" y1="13" x2="14" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Ascentra</span>
            </div>
            {/* Nav items */}
            {["Dashboard", "Calculator", "Diagnosis", "Scenarios", "Budget", "Analytics"].map((item, i) => (
              <div
                key={item}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 9,
                  fontWeight: 500,
                  color: i === 0 ? "white" : "rgba(255,255,255,0.55)",
                  background: i === 0 ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, padding: isMobile ? "10px 12px" : "16px 20px", overflow: "hidden" }}>
          {/* Greeting */}
          <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 600, color: TEXT, marginBottom: 2 }}>Welcome back, Alex</div>
          <div style={{ fontSize: isMobile ? 7 : 9, color: MUTED, marginBottom: isMobile ? 8 : 14 }}>Here's your financial assessment for {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>

          {/* 4 Metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: isMobile ? 4 : 8, marginBottom: isMobile ? 8 : 14 }}>
            <MockMetricCard label="Annual Gross" value="$82,080" sub="Required income" color={EV_700} />
            <MockMetricCard label="Monthly Gross" value="$6,840" sub="Before taxes" />
            {!isMobile && <MockMetricCard label="Monthly Net" value="$5,472" sub="After taxes" color={EV_500} />}
            {!isMobile && <MockMetricCard label="Hourly Rate" value="$39.46" sub="40hrs/week" />}
          </div>

          {/* Chart row */}
          <div style={{ display: "flex", gap: isMobile ? 4 : 8 }}>
            {/* Bar chart card */}
            <div style={{ flex: 1, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: isMobile ? "8px 6px" : "10px 12px" }}>
              <div style={{ fontSize: isMobile ? 8 : 10, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Income vs Required</div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                <MockBarGroup h1={32} h2={52} label="Oct" />
                <MockBarGroup h1={36} h2={52} label="Nov" />
                <MockBarGroup h1={34} h2={52} label="Dec" />
                <MockBarGroup h1={38} h2={52} label="Jan" />
                <MockBarGroup h1={42} h2={52} label="Feb" />
                <MockBarGroup h1={44} h2={52} label="Mar" />
                <MockBarGroup h1={48} h2={52} label="Apr" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ fontSize: 6, color: MUTED }}>Current Income</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, fontFamily: MONO_FONT_STACK }}>$5,400</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 6, color: MUTED }}>Required</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, fontFamily: MONO_FONT_STACK }}>$6,840</div>
                </div>
              </div>
            </div>

            {/* Donut card */}
            {!isMobile && (
              <div style={{ flex: 1, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Expense Breakdown</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width={80} height={80} viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
                    <circle cx={40} cy={40} r={28} fill="none" stroke={BORDER} strokeWidth={10} />
                    <circle cx={40} cy={40} r={28} fill="none" stroke={EV_800} strokeWidth={10} strokeDasharray="60 176" strokeDashoffset="0" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                    <circle cx={40} cy={40} r={28} fill="none" stroke={EV_700} strokeWidth={10} strokeDasharray="35 176" strokeDashoffset="-60" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                    <circle cx={40} cy={40} r={28} fill="none" stroke={EV_500} strokeWidth={10} strokeDasharray="30 176" strokeDashoffset="-95" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                    <circle cx={40} cy={40} r={28} fill="none" stroke={EV_200} strokeWidth={10} strokeDasharray="25 176" strokeDashoffset="-125" style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {[
                      { label: "Housing", color: EV_800, pct: "34%" },
                      { label: "Food", color: EV_700, pct: "20%" },
                      { label: "Transport", color: EV_500, pct: "17%" },
                      { label: "Other", color: EV_200, pct: "14%" },
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 7, color: TEXT }}>{s.label}</span>
                        <span style={{ fontSize: 7, color: MUTED, marginLeft: "auto" }}>{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
