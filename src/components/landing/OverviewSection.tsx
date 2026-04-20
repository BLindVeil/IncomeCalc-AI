import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800 } from "@/lib/app-shared";
import { MetricCard } from "@/components/ui/MetricCard";
import { IncomeBarChart } from "@/components/dashboard/IncomeBarChart";

interface OverviewSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  isMobile: boolean;
  onStart: () => void;
}

export function OverviewSection({ t, isDark, isMobile, onStart }: OverviewSectionProps) {
  const isDesktop = !isMobile && typeof window !== "undefined" && window.innerWidth >= 1024;

  return (
    <section id="overview">
      <div
        style={{
          display: isDesktop ? "flex" : "block",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Left column — Welcome card */}
        <div style={{ flex: isDesktop ? "1.1" : undefined, marginBottom: isDesktop ? 0 : 24 }}>
          <div
            style={{
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: 28,
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                fontWeight: 500,
                color: t.muted,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              ASCENTRA · PREVIEW MODE
            </div>
            <div
              style={{
                fontSize: isMobile ? 20 : 22,
                fontWeight: 600,
                color: t.text,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
              }}
            >
              Find out exactly how much you need to earn.
            </div>
            <p
              style={{
                fontSize: 14,
                color: t.muted,
                lineHeight: 1.55,
                marginTop: 12,
                marginBottom: 0,
              }}
            >
              Enter your monthly expenses. Get your required income, financial health score, and
              exactly what to change. Everything below is sample data — replace it with yours in
              60 seconds.
            </p>
            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <button
                onClick={onStart}
                style={{
                  background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
                }}
              >
                Calculate my number →
              </button>
              <div style={{ marginTop: 12 }}>
                <span
                  style={{
                    fontSize: 13,
                    color: t.muted,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  Already have an account? Sign in →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Metric grid + bar chart */}
        <div style={{ flex: isDesktop ? "1" : undefined }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: isMobile ? 8 : 12,
              marginBottom: 12,
            }}
          >
            <MetricCard t={t} label="REQUIRED INCOME" value={6840} suffix="/mo" />
            <MetricCard t={t} label="INCOME GAP" value={1440} suffix="/mo" color={t.danger} sub="+$1,440 needed" />
            <MetricCard t={t} label="STABILITY" value={82} color={EV_500} />
            <MetricCard t={t} label="RUNWAY" value={3.2} suffix=" mo" />
          </div>
          <IncomeBarChart t={t} isDark={isDark} currentIncome={5400} requiredIncome={6840} />
        </div>
      </div>
    </section>
  );
}
