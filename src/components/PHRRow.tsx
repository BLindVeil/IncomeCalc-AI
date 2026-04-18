import { useState, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { PHRAccentCard, type PHRAccentKind } from "@/components/PHRAccentCard";
import { PHRCard } from "@/components/PHRCard";
import { PHRArrow } from "@/components/PHRArrow";

interface PHRRowProps {
  t: ThemeConfig;
  isDark: boolean;
  problem: string;
  hypothesis: string;
  result: string;
  accentKind: PHRAccentKind;
  accentSide: "left" | "right";
}

function useBreakpoint() {
  const [bp, setBp] = useState<"mobile" | "tablet" | "desktop">(() => {
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

export function PHRRow({
  t,
  isDark,
  problem,
  hypothesis,
  result,
  accentKind,
  accentSide,
}: PHRRowProps) {
  const bp = useBreakpoint();

  const accentCard = <PHRAccentCard t={t} isDark={isDark} kind={accentKind} />;

  // Mobile + Tablet: single-column stack, no arrows
  if (bp === "mobile" || bp === "tablet") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <PHRCard t={t} isDark={isDark} kind="problem" body={problem} />
        <PHRCard t={t} isDark={isDark} kind="hypothesis" body={hypothesis} />
        <PHRCard t={t} isDark={isDark} kind="result" body={result} />
        {accentCard}
      </div>
    );
  }

  // Desktop: argument cluster + accent card
  const argumentCluster = (
    <div
      style={{
        display: "flex",
        gap: 0,
        alignItems: "start",
        flex: 3,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <PHRCard t={t} isDark={isDark} kind="problem" body={problem} />
      </div>
      <div style={{ flexShrink: 0, width: 40, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "stretch" }}>
        <PHRArrow t={t} isDark={isDark} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <PHRCard t={t} isDark={isDark} kind="hypothesis" body={hypothesis} />
      </div>
      <div style={{ flexShrink: 0, width: 40, display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "stretch" }}>
        <PHRArrow t={t} isDark={isDark} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <PHRCard t={t} isDark={isDark} kind="result" body={result} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
      {accentSide === "left" ? (
        <>
          <div style={{ flex: 1, minWidth: 240 }}>{accentCard}</div>
          {argumentCluster}
        </>
      ) : (
        <>
          {argumentCluster}
          <div style={{ flex: 1, minWidth: 240 }}>{accentCard}</div>
        </>
      )}
    </div>
  );
}
