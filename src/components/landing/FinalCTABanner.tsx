import type { ThemeConfig } from "@/lib/app-shared";
import { EV_600, EV_800 } from "@/lib/app-shared";

interface FinalCTABannerProps {
  t: ThemeConfig;
  isMobile: boolean;
  onStart: () => void;
}

export function FinalCTABanner({ t, isMobile, onStart }: FinalCTABannerProps) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
        borderRadius: 16,
        padding: isMobile ? "32px 24px" : "40px 32px",
        marginTop: 32,
        marginBottom: 48,
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
      }}
    >
      <div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
          Know your number in 60 seconds.
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
          Free forever. No bank linking. No credit pull.
        </div>
      </div>
      <button
        onClick={onStart}
        style={{
          background: "#fff",
          color: EV_800,
          border: "none",
          borderRadius: 999,
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        Calculate my number →
      </button>
    </div>
  );
}
