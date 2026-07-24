import type { ThemeConfig } from "@/lib/app-shared";
import { INK, WHITE, RADIUS_CARD } from "./landing-theme";
import { PillButton } from "./PillButton";

interface FinalCTABannerProps {
  t: ThemeConfig;
  isMobile: boolean;
  onStart: () => void;
}

export function FinalCTABanner({ isMobile, onStart }: FinalCTABannerProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: INK,
        borderRadius: RADIUS_CARD,
        padding: isMobile ? "40px 24px" : "56px 44px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 24,
        color: WHITE,
      }}
    >
      {/* Photography anchors the closing block to the rest of the page */}
      <img
        src="/img/footer-forest.jpg"
        alt=""
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.32,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.45) 100%)",
        }}
      />

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: isMobile ? 24 : 30,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.028em",
          }}
        >
          Stop guessing. Start planning.
        </div>
        <div style={{ fontSize: 14.5, color: "rgba(255,255,255,0.62)", marginTop: 8 }}>
          Your number in 60 seconds. Free forever, no bank linking.
        </div>
      </div>

      <div style={{ position: "relative", flexShrink: 0 }}>
        <PillButton tone="light" size="lg" onClick={onStart}>
          Calculate my number
        </PillButton>
      </div>
    </div>
  );
}
