import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500 } from "@/lib/app-shared";
import { Sparkles } from "lucide-react";
import { RevealPreviewCard } from "@/components/RevealPreviewCard";
import { useIsMobile } from "@/lib/useIsMobile";

interface HeroSectionProps {
  t: ThemeConfig;
  isDark: boolean;
  onStart: () => void;
}

export function HeroSection({ t, isDark, onStart }: HeroSectionProps) {
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  return (
    <section
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: isDesktop ? "96px 32px" : "48px 20px",
      }}
    >
      <div
        style={{
          display: isDesktop ? "grid" : "flex",
          gridTemplateColumns: isDesktop ? "1.1fr 1fr" : undefined,
          gap: isDesktop ? 64 : undefined,
          flexDirection: isDesktop ? undefined : "column",
          alignItems: isDesktop ? "center" : undefined,
        }}
      >
        {/* Left column */}
        <div>
          {/* Badge pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: t.primarySoft,
              border: `1px solid ${isDark ? "rgba(82,183,136,0.2)" : "rgba(27,67,50,0.1)"}`,
              borderRadius: 999,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: t.primary,
              marginBottom: 24,
            }}
          >
            <Sparkles size={14} />
            Financial clarity in 60 seconds
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: isDesktop ? 64 : 40,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: t.text,
              margin: 0,
            }}
          >
            Find out exactly how much you need to{" "}
            <span style={{ color: EV_500 }}>earn.</span>
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.5,
              color: t.muted,
              maxWidth: 460,
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Enter your expenses. Get your number. See what to change.
          </p>

          {/* CTA row */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <button
              onClick={onStart}
              style={{
                background: "linear-gradient(135deg, #1B4332, #40916C)",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "18px 40px",
                fontSize: 17,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(27, 67, 50, 0.25)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Calculate my number →
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("incomecalc-open-auth", {
                    detail: { mode: "signin" },
                  }),
                );
              }}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 14,
                color: t.muted,
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>

        {/* Right column — RevealPreviewCard */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: isDesktop ? 0 : 40,
          }}
        >
          <RevealPreviewCard t={t} isDark={isDark} />
        </div>
      </div>
    </section>
  );
}
