import { useState, useEffect } from "react";
import { HeroTopNav } from "./hero/HeroTopNav";
import { HeroCollageStabilityCard } from "./hero/HeroCollageStabilityCard";
import { HeroCollageIncomeCard } from "./hero/HeroCollageIncomeCard";
import { HeroCollageTopMoveCard } from "./hero/HeroCollageTopMoveCard";

// ─── Hero-specific constants (intentional hardcodes, not theme tokens) ───────
const HERO_BG =
  "radial-gradient(ellipse 1600px 900px at 50% 0%, #2D6A4F 0%, #1B4332 42%, #0A2418 80%, #081C15 100%)";
const CTA_ORANGE = "#EA580C";
const CTA_ORANGE_HOVER = "#C2410C";
const EV_500 = "#52B788";

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
  const isDesktop = bp === "desktop";

  const [ctaHover, setCtaHover] = useState(false);

  return (
    <div
      style={{
        width: "100%",
        background: HERO_BG,
        padding: isMobile ? "24px 20px 48px" : "32px 48px 72px",
        position: "relative",
        overflow: "hidden",
        minHeight: isDesktop ? 820 : undefined,
        color: "white",
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Top nav */}
        <HeroTopNav isMobile={isMobile} onStart={onStart} onSignIn={onSignIn} isSignedIn={isSignedIn} userName={userName} onDashboard={onDashboard} onSignOut={onSignOut} />

        {/* Spacer */}
        <div style={{ height: 48 }} />

        {/* Headline */}
        <div
          style={{
            maxWidth: isDesktop ? 780 : "100%",
            margin: "0 auto",
            textAlign: "center",
            padding: "0 16px",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? 36 : bp === "tablet" ? 54 : 68,
              lineHeight: isMobile ? 1.1 : 1.04,
              letterSpacing: isMobile ? "-0.025em" : "-0.03em",
              fontWeight: 700,
              color: "white",
              margin: 0,
            }}
          >
            Peace of mind starts with one number.
          </h1>
        </div>

        {/* Spacer */}
        <div style={{ height: 32 }} />

        {/* Two-column section */}
        {isDesktop ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.08fr 1fr",
              gap: 40,
              alignItems: "center",
              marginTop: 40,
            }}
          >
            {/* Left — collage */}
            <div style={{ position: "relative", height: 420, width: "100%" }}>
              <HeroCollageStabilityCard />
              <HeroCollageIncomeCard />
              <HeroCollageTopMoveCard />
            </div>

            {/* Right — subtitle + checklist + CTA */}
            <RightColumn
              isMobile={false}
              onStart={onStart}
              ctaHover={ctaHover}
              setCtaHover={setCtaHover}
            />
          </div>
        ) : bp === "tablet" ? (
          <div style={{ marginTop: 40 }}>
            {/* Collage centered, narrower */}
            <div
              style={{
                position: "relative",
                height: 420,
                width: "100%",
                maxWidth: 540,
                margin: "0 auto 40px",
              }}
            >
              <HeroCollageStabilityCard />
              <HeroCollageIncomeCard />
              <HeroCollageTopMoveCard />
            </div>

            {/* Text block below */}
            <RightColumn
              isMobile={false}
              onStart={onStart}
              ctaHover={ctaHover}
              setCtaHover={setCtaHover}
            />
          </div>
        ) : (
          /* Mobile — single card + text */
          <div style={{ marginTop: 32 }}>
            <HeroCollageIncomeCard mobile />
            <div style={{ height: 32 }} />
            <RightColumn
              isMobile
              onStart={onStart}
              ctaHover={ctaHover}
              setCtaHover={setCtaHover}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right column (subtitle + checklist + CTA) ──────────────────────────────
function RightColumn({
  isMobile,
  onStart,
  ctaHover,
  setCtaHover,
}: {
  isMobile: boolean;
  onStart: () => void;
  ctaHover: boolean;
  setCtaHover: (v: boolean) => void;
}) {
  return (
    <div style={{ padding: isMobile ? "12px 0 4px" : "12px 4px 4px" }}>
      {/* Subtitle */}
      <div
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.78)",
          lineHeight: 1.6,
          letterSpacing: "-0.005em",
          marginBottom: 26,
        }}
      >
        Enter your expenses. Get your required income, financial health score, and exactly what to
        change — in 60 seconds.
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 30 }}>
        {CHECKLIST_ITEMS.map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <CheckSVG />
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.5 }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA row */}
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 14,
        }}
      >
        <button
          onClick={onStart}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 24px",
            background: ctaHover ? CTA_ORANGE_HOVER : CTA_ORANGE,
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            transition: "background 150ms",
          }}
        >
          Calculate my number <span style={{ fontSize: 17 }}>→</span>
        </button>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
          Free forever.
          <br />
          No credit card.
        </div>
      </div>
    </div>
  );
}
