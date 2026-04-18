import type { ReactNode } from "react";
import type { ThemeConfig } from "@/lib/app-shared";

export interface SectionHeaderProps {
  icon?: ReactNode;
  label: string;
  right?: ReactNode;
  t: ThemeConfig;
}

export function SectionHeader({ icon, label, right, t }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: t.muted,
          }}
        >
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}
