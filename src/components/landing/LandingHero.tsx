import { useState, useEffect } from "react";
import { WHITE, INK, GREY, GREY_LIGHT, eyebrow, FONT_STACK } from "./landing-theme";
import { PillButton } from "./PillButton";
import { HeroTopNav } from "./hero/HeroTopNav";
import { HeroDashboardMockup } from "./HeroDashboardMockup";

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

  return (
    <header
      style={{
        width: "100%",
        // Light falls from above: the canvas lifts to pure white behind the headline
        // and settles into a faint warm grey where the product preview sits.
        background: `linear-gradient(180deg, ${WHITE} 0%, ${WHITE} 46%, #F4F4F2 100%)`,
        padding: isMobile ? "18px 20px 0" : "22px 40px 0",
        color: INK,
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
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

        <div style={{ height: isMobile ? 52 : 88 }} />

        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <div style={eyebrow}>Personal finance, clarified</div>

          <h1
            style={{
              fontSize: isMobile ? 38 : bp === "tablet" ? 56 : 72,
              lineHeight: 1.04,
              letterSpacing: "-0.038em",
              fontWeight: 600,
              margin: `${isMobile ? 16 : 22}px 0 0`,
            }}
          >
            <span style={{ display: "block", color: GREY_LIGHT }}>Peace of mind starts</span>
            <span style={{ display: "block", color: INK }}>with one number</span>
          </h1>

          <p
            style={{
              fontSize: isMobile ? 15 : 16.5,
              color: GREY,
              lineHeight: 1.6,
              maxWidth: 500,
              margin: `${isMobile ? 18 : 24}px auto 0`,
            }}
          >
            Enter your expenses and get the income you actually need, your financial
            health score, and the one move that changes the most.
          </p>

          <div style={{ marginTop: isMobile ? 26 : 34 }}>
            <PillButton size="lg" onClick={onStart}>
              Calculate my number
            </PillButton>
            <div style={{ fontSize: 12.5, color: GREY_LIGHT, marginTop: 14 }}>
              Free forever. No bank linking, no credit pull.
            </div>
          </div>
        </div>

        <div style={{ height: isMobile ? 44 : 72 }} />

        {/* Product preview, lifted off the canvas */}
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            borderRadius: 14,
            padding: 7,
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(10,10,10,0.06)",
            boxShadow: "0 32px 80px -24px rgba(10,10,10,0.22)",
            boxSizing: "border-box",
          }}
        >
          <HeroDashboardMockup isMobile={isMobile} />
        </div>
      </div>
    </header>
  );
}
