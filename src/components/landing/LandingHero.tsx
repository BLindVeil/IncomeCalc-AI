import { useState, useEffect } from "react";
import { EV_500, EV_800, NEUTRAL_TEXT, NEUTRAL_MUTED } from "@/lib/app-shared";
import { HeroTopNav } from "./hero/HeroTopNav";
import { HeroDashboardMockup } from "./HeroDashboardMockup";
import { HeroAnimatedPills } from "./HeroAnimatedPills";

// ─── Hero-specific constants ─────────────────────────────────────────────────
const CTA_ORANGE = "#EA580C";
const CTA_ORANGE_HOVER = "#C2410C";
const TEXT = NEUTRAL_TEXT;
const MUTED = NEUTRAL_MUTED;

const FONT_STACK = "'Geist', -apple-system, system-ui, 'Segoe UI', sans-serif";

const CHECKLIST_ITEMS = [
  "Your required monthly income, instantly",
  "Financial health score and stability rating",
  'Scenarios — test "what if" in real time against your numbers',
  "Your top move, ranked by actual dollar impact",
  "No bank linking, no credit pull, no 40-question intake",
];

// ─── Breakpoint hook ─────────────────────────────────────────────────────────
type BP = "mobile" | "tablet" | "desktop";

function useHeroBreakpoint(): BP {
  const [bp, setBp] = useState<BP>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const w = window.innerWidth;
        if (w < 768) setBp("mobile");
        else if (w < 1024) setBp("tablet");
        else setBp("desktop");
      }, 150);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return bp;
}

// ─── Check SVG ───────────────────────────────────────────────────────────────
function CheckSVG() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="9" cy="9" r="9" fill={EV_500} />
      <path
        d="M5 9.2 L 7.8 12 L 13 6.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
interface LandingHeroProps {
  onStart: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
  userName?: string;
  onDashboard?: () => void;
  onSignOut?: () => void;
}

export function LandingHero({ onStart, onSignIn, isSignedIn, userName, onDashboard, onSignOut }: LandingHeroProps) {
  const bp = useHeroBreakpoint();
  const isMobile = bp === "mobile";

  const [ctaHover, setCtaHover] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        background: "white",
        padding: isMobile ? "24px 20px 48px" : "32px 48px 72px",
        position: "relative",
        overflow: "hidden",
        color: TEXT,
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Top nav */}
        <HeroTopNav
          isMobile={isMobile}
          onStart={onStart}
          onSignIn={onSignIn}
          isSignedIn={isSignedIn}
          userName={userName}
          onDashboard={onDashboard}
          onSignOut={onSignOut}
        />

        {/* Spacer */}
        <div style={{ height: isMobile ? 40 : 64 }} />

        {/* Headline + subtitle + CTA — centered */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? 32 : bp === "tablet" ? 48 : 56,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              fontWeight: 700,
              color: TEXT,
              margin: 0,
            }}
          >
            Peace of mind starts with{" "}
            <span style={{ color: EV_800 }}>one number.</span>
          </h1>

          {/* Subtitle */}
          <div
            style={{
              fontSize: isMobile ? 15 : 17,
              color: MUTED,
              lineHeight: 1.6,
              maxWidth: 540,
              margin: `${isMobile ? 16 : 20}px auto 0`,
            }}
          >
            Enter your expenses. Get your required income, financial health score,
            and exactly what to change — in 60 seconds.
          </div>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              marginTop: isMobile ? 24 : 28,
            }}
          >
            <button
              type="button"
              onClick={onStart}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: isMobile ? "14px 28px" : "14px 24px",
                background: ctaHover ? CTA_ORANGE_HOVER : CTA_ORANGE,
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                transition: "background 150ms",
                width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
            >
              Calculate my number <span style={{ fontSize: 17 }}>→</span>
            </button>
            <div
              style={{
                fontSize: 12,
                color: MUTED,
                lineHeight: 1.4,
                textAlign: isMobile ? "center" : "left",
              }}
            >
              Free forever. No credit card.
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: isMobile ? 32 : 48 }} />

        {/* Checklist */}
        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: isMobile ? 10 : 14,
            maxWidth: 800,
            margin: "0 auto",
            listStyle: "none",
            padding: 0,
          }}
        >
          {CHECKLIST_ITEMS.map((label) => (
            <li
              key={label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <CheckSVG />
              <span
                style={{
                  fontSize: isMobile ? 13 : 14,
                  color: "#374151",
                  lineHeight: 1.5,
                }}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>

        {/* Spacer */}
        <div style={{ height: isMobile ? 36 : 56 }} />

        {/* Dashboard mockup with animated pills */}
        <div
          style={{
            position: "relative",
            maxWidth: 920,
            margin: "0 auto",
          }}
        >
          <HeroDashboardMockup isMobile={isMobile} />
          {!isMobile && <HeroAnimatedPills />}
        </div>
      </div>
    </div>
  );
}
