import type { ThemeConfig } from "@/lib/app-shared";
import { FormattedNumber } from "@/components/FormattedNumber";

export interface MetricCardProps {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  suffix?: string;
  t: ThemeConfig;
}

export function MetricCard({ label, value, sub, color, suffix, t }: MetricCardProps) {
  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.border}`,
        borderRadius: "16px",
        padding: "1.25rem",
      }}
    >
      {sub && (
        <div style={{ fontSize: "0.8rem", color: t.muted, marginBottom: "0.35rem" }}>
          {sub}
        </div>
      )}
      <div>
        <FormattedNumber
          value={value}
          suffix={suffix}
          fontSize="1.5rem"
          fontWeight={800}
          color={color ?? t.text}
          centsColor={t.muted}
        />
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: t.text }}>
        {label}
      </div>
    </div>
  );
}
