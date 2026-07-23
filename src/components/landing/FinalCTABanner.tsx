import type { ThemeConfig } from "@/lib/app-shared";
import { EV_800, EV_900 } from "@/lib/app-shared";
import { GRAIN_URI } from "./landing-theme";

interface FinalCTABannerProps {
  t: ThemeConfig;
  isMobile: boolean;
  onStart: () => void;
}

export function FinalCTABanner({ t, isMobile, onStart }: FinalCTABannerProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(160deg, ${EV_800} 0%, ${EV_900} 100%)`,
        borderRadius: 20,
        padding: isMobile ? "36px 24px" : "44px 36px",
        marginTop: 48,
        marginBottom: 48,
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
      }}
    >
      {/* Organic moss glows, echoing the hero backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: [
            "radial-gradient(55% 90% at 88% 110%, rgba(116,198,157,0.28) 0%, transparent 70%)",
            "radial-gradient(45% 80% at 8% 120%, rgba(82,183,136,0.20) 0%, transparent 70%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: GRAIN_URI,
          mixBlendMode: "overlay",
          opacity: 0.7,
        }}
      />

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: isMobile ? 22 : 24, fontWeight: 600, color: "#fff", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          Stop guessing. Start planning.
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", marginTop: 6 }}>
          Free forever. No bank linking required.
        </div>
      </div>
      <button
        onClick={onStart}
        className="lp-press"
        style={{
          position: "relative",
          background: "#fff",
          color: EV_800,
          border: "none",
          borderRadius: 999,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          boxShadow: "0 2px 12px rgba(8,28,21,0.35)",
        }}
      >
        Calculate my number →
      </button>
    </div>
  );
}
