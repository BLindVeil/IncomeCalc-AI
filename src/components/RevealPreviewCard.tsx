import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, MONO_FONT_STACK } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";
import { useIsMobile } from "@/lib/useIsMobile";

interface RevealPreviewCardProps {
  t: ThemeConfig;
  isDark: boolean;
}

export function RevealPreviewCard({ t }: RevealPreviewCardProps) {
  const isMobile = useIsMobile();
  const cardWidth = isMobile ? 280 : 320;

  const cardStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: 28,
    width: cardWidth,
    position: "relative",
    zIndex: 1,
  };

  const shadowCardStyle: React.CSSProperties = {
    ...cardStyle,
    position: "absolute",
    top: 8,
    left: 8,
    opacity: 0.4,
    zIndex: 0,
    pointerEvents: "none",
  };

  return (
    <div style={{ position: "relative", width: cardWidth + 8, height: "fit-content" }}>
      {/* Shadow card */}
      <div style={shadowCardStyle} aria-hidden />

      {/* Main card */}
      <div style={cardStyle}>
        <div
          style={{
            textTransform: "uppercase",
            fontSize: 11,
            letterSpacing: "0.08em",
            fontWeight: 500,
            color: t.muted,
            marginBottom: 8,
          }}
        >
          YOUR REQUIRED INCOME
        </div>

        <FormattedNumber
          value={6840}
          fontSize={isMobile ? 40 : 52}
          fontWeight={700}
          color={t.text}
          centsColor={t.muted}
        />

        <div
          style={{
            height: 1,
            background: t.border,
            marginTop: 20,
            marginBottom: 20,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: EV_500,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
            Financial health: Strong
          </span>
        </div>
      </div>
    </div>
  );
}
