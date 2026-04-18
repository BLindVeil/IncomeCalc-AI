import type { ThemeConfig } from "@/lib/app-shared";

interface PHRArrowProps {
  t: ThemeConfig;
  isDark: boolean;
}

export function PHRArrow({ t }: PHRArrowProps) {
  return (
    <svg width="40" height="80" viewBox="0 0 40 80" fill="none" style={{ display: "block" }}>
      <path
        d="M 5 55 Q 20 15, 33 42"
        stroke={t.muted}
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <polygon points="28,38 36,44 31,46" fill={t.muted} fillOpacity="0.5" />
    </svg>
  );
}
