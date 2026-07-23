import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EV_500 } from "@/lib/app-shared";
import {
  PAPER,
  INK,
  INK_SOFT,
  SAGE,
  GLASS_BG,
  GLASS_BORDER,
  CTA_ORANGE,
  CTA_ORANGE_HOVER,
  EASE_OUT,
  SHADOW_FLOAT,
  SHADOW_CHIP,
  FONT_STACK,
  GRAIN_URI,
} from "./landing-theme";
import { HeroTopNav } from "./hero/HeroTopNav";
import { HeroDashboardMockup } from "./HeroDashboardMockup";
import { HeroAnimatedPills } from "./HeroAnimatedPills";

const CHECKLIST_ITEMS = [
  "Your required monthly income, instantly",
  "Financial health score and stability rating",
  'Test "what if" scenarios against your real numbers',
  "Your top move, ranked by actual dollar impact",
  "No bank linking, no credit pull",
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
    <svg width={16} height={16} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
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

// ─── Organic backdrop (CSS-built rolling moss hills) ─────────────────────────
function OrganicBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "clamp(320px, 46vw, 560px)",
        pointerEvents: "none",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 30%)",
        maskImage: "linear-gradient(180deg, transparent 0%, black 30%)",
        overflow: "hidden",
      }}
    >
      {/* Soft atmospheric mounds, slow drift */}
      <div
        className={reduce ? undefined : "lp-drift"}
        style={{
          position: "absolute",
          inset: "-15%",
          filter: "blur(56px)",
          background: [
            "radial-gradient(42% 55% at 18% 96%, rgba(45,106,79,0.55) 0%, transparent 70%)",
            "radial-gradient(50% 60% at 85% 100%, rgba(64,145,108,0.50) 0%, transparent 72%)",
            "radial-gradient(36% 46% at 52% 108%, rgba(116,198,157,0.55) 0%, transparent 70%)",
            "radial-gradient(60% 45% at 40% 118%, rgba(27,67,50,0.42) 0%, transparent 75%)",
          ].join(", "),
        }}
      />
      {/* Foreground hill silhouettes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(58% 42% at 8% 118%, rgba(27,67,50,0.50) 58%, transparent 60%)",
            "radial-gradient(55% 38% at 92% 120%, rgba(45,106,79,0.48) 58%, transparent 60%)",
            "radial-gradient(70% 30% at 50% 128%, rgba(8,28,21,0.45) 60%, transparent 62%)",
          ].join(", "),
        }}
      />
      {/* Grain, for tactility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GRAIN_URI,
          mixBlendMode: "overlay",
          opacity: 0.8,
        }}
      />
    </div>
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
  const reduce = useReducedMotion() ?? false;

  const [ctaHover, setCtaHover] = useState(false);

  const rise = {
    hidden: reduce ? {} : { opacity: 0, y: 28, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: EASE_OUT },
    },
  };

  return (
    <div
      style={{
        width: "100%",
        background: `radial-gradient(90% 60% at 50% 0%, #FDFEF8 0%, ${PAPER} 65%)`,
        padding: isMobile ? "20px 20px 0" : "24px 48px 0",
        position: "relative",
        overflow: "hidden",
        color: INK,
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
      }}
    >
      <OrganicBackdrop reduce={reduce} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
        {/* Top nav */}
        <HeroTopNav
          isMobile={isMobile}
          showLinks={bp === "desktop"}
          onStart={onStart}
          onSignIn={onSignIn}
          isSignedIn={isSignedIn}
          userName={userName}
          onDashboard={onDashboard}
          onSignOut={onSignOut}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
        >
          {/* Spacer */}
          <div style={{ height: isMobile ? 44 : 72 }} />

          {/* Headline + subtitle + CTA — centered */}
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <motion.h1
              variants={rise}
              style={{
                fontSize: isMobile ? 36 : bp === "tablet" ? 52 : 64,
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                fontWeight: 700,
                margin: 0,
              }}
            >
              <span style={{ display: "block", color: SAGE, fontWeight: 600 }}>
                Peace of mind starts with
              </span>
              <span style={{ display: "block", color: INK }}>one number.</span>
            </motion.h1>

            <motion.p
              variants={rise}
              style={{
                fontSize: isMobile ? 15 : 17,
                color: INK_SOFT,
                lineHeight: 1.6,
                maxWidth: 520,
                margin: `${isMobile ? 16 : 22}px auto 0`,
              }}
            >
              Enter your expenses. Get your required income, health score, and next
              move in 60 seconds. Free, no credit card.
            </motion.p>

            <motion.div variants={rise} style={{ marginTop: isMobile ? 24 : 30 }}>
              <button
                type="button"
                className="lp-press"
                onClick={onStart}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: isMobile ? "15px 30px" : "16px 32px",
                  background: ctaHover ? CTA_ORANGE_HOVER : CTA_ORANGE,
                  color: "white",
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                  boxShadow: ctaHover
                    ? "0 8px 24px -8px rgba(234,88,12,0.55)"
                    : "0 4px 16px -6px rgba(234,88,12,0.45)",
                }}
              >
                Calculate my number <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
              </button>
            </motion.div>
          </div>

          {/* Spacer */}
          <div style={{ height: isMobile ? 40 : 64 }} />

          {/* Dashboard mockup floating over the organic backdrop */}
          <motion.div
            variants={{
              hidden: reduce ? {} : { opacity: 0, y: 56, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.9, ease: EASE_OUT },
              },
            }}
            style={{ position: "relative", maxWidth: 920, margin: "0 auto" }}
          >
            <div
              style={{
                borderRadius: 14,
                boxShadow: SHADOW_FLOAT,
                outline: "1px solid rgba(255,255,255,0.55)",
                outlineOffset: -1,
              }}
            >
              <HeroDashboardMockup isMobile={isMobile} />
            </div>
            {!isMobile && <HeroAnimatedPills />}
          </motion.div>

          {/* Feature chips resting on the hills */}
          <motion.ul
            variants={rise}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              maxWidth: 860,
              margin: `${isMobile ? 24 : 32}px auto 0`,
              listStyle: "none",
              padding: `0 0 ${isMobile ? 44 : 64}px`,
            }}
          >
            {CHECKLIST_ITEMS.map((label) => (
              <li
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px 8px 10px",
                  background: GLASS_BG,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: `1px solid ${GLASS_BORDER}`,
                  borderRadius: 999,
                  boxShadow: SHADOW_CHIP,
                }}
              >
                <CheckSVG />
                <span style={{ fontSize: 13, fontWeight: 500, color: INK_SOFT, lineHeight: 1.4 }}>
                  {label}
                </span>
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </div>
  );
}
