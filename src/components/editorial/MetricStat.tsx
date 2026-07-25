import type { ThemeConfig } from "@/lib/app-shared";
import { Reveal } from "./Reveal";
import { EditorialCard } from "./EditorialCard";
import { CountUpNumber } from "./CountUpNumber";
import { eyebrow as eyebrowStyle } from "./tokens";

interface MetricStatProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Small caption above the figure. */
  sub?: string;
  t: ThemeConfig;
  /** Override the figure colour — default ink/text. Green is reserved for signal. */
  valueColor?: string;
  /** Scroll-reveal stagger delay (ms). */
  delay?: number;
}

/**
 * A single dashboard figure: hairline card, small grey caption, big mono value
 * that counts up when it scrolls into view. Drop-in replacement for the old
 * static MetricCard, now with editorial motion.
 */
export function MetricStat({ label, value, prefix, suffix, decimals = 0, sub, t, valueColor, delay = 0 }: MetricStatProps) {
  return (
    <Reveal delay={delay} style={{ height: "100%" }}>
      <EditorialCard t={t} padding="1.25rem" style={{ height: "100%" }}>
        {sub && <div style={{ ...eyebrowStyle, color: t.subtle, marginBottom: 8 }}>{sub}</div>}
        <CountUpNumber
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          style={{ fontSize: "1.6rem", fontWeight: 700, color: valueColor ?? t.text, letterSpacing: "-0.02em", display: "block" }}
        />
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: t.text, marginTop: 4 }}>{label}</div>
      </EditorialCard>
    </Reveal>
  );
}
