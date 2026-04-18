import type { ThemeConfig } from "@/lib/app-shared";
import { PHRAccentCard, type PHRAccentKind } from "@/components/PHRAccentCard";
import { useIsMobile } from "@/lib/useIsMobile";

interface PHRRowProps {
  t: ThemeConfig;
  isDark: boolean;
  problem: string;
  hypothesis: string;
  result: string;
  accentKind: PHRAccentKind;
  accentSide: "left" | "right";
}

function TextCard({
  t,
  isDark,
  label,
  body,
  variant,
}: {
  t: ThemeConfig;
  isDark: boolean;
  label: string;
  body: string;
  variant: "problem" | "hypothesis" | "result";
}) {
  const pillColors = {
    problem: {
      bg: isDark ? "rgba(239,68,68,0.15)" : "#FDECEA",
      color: isDark ? "#FCA5A5" : "#8B2C1E",
    },
    hypothesis: {
      bg: isDark ? "rgba(234,179,8,0.15)" : "#FFF4D6",
      color: isDark ? "#FDE68A" : "#7A5210",
    },
    result: {
      bg: isDark ? "rgba(82,183,136,0.15)" : "#F1FAF4",
      color: isDark ? "#95D5B2" : "#1B4332",
    },
  };

  const pc = pillColors[variant];

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "inline-block",
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          padding: "4px 10px",
          borderRadius: 999,
          background: pc.bg,
          color: pc.color,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          color: t.text,
          marginTop: 16,
        }}
      >
        {body}
      </div>
    </div>
  );
}

export function PHRRow({
  t,
  isDark,
  problem,
  hypothesis,
  result,
  accentKind,
  accentSide,
}: PHRRowProps) {
  const isMobile = useIsMobile();
  const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;

  const textCards = (
    <>
      <TextCard t={t} isDark={isDark} label="Problem" body={problem} variant="problem" />
      <TextCard t={t} isDark={isDark} label="Hypothesis" body={hypothesis} variant="hypothesis" />
      <TextCard t={t} isDark={isDark} label="Result" body={result} variant="result" />
    </>
  );

  const accentCard = <PHRAccentCard t={t} isDark={isDark} kind={accentKind} />;

  // Mobile: single column, accent last
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {textCards}
        {accentCard}
      </div>
    );
  }

  // Tablet: 2×2 grid, accent spans bottom
  if (isTablet) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
        }}
      >
        {textCards}
        <div style={{ gridColumn: "1 / -1" }}>{accentCard}</div>
      </div>
    );
  }

  // Desktop: 4-column grid
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 20,
      }}
    >
      {accentSide === "left" ? (
        <>
          {accentCard}
          {textCards}
        </>
      ) : (
        <>
          {textCards}
          {accentCard}
        </>
      )}
    </div>
  );
}
