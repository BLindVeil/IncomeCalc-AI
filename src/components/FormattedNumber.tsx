import { MONO_FONT_STACK } from "@/lib/app-shared";

interface FormattedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  showCents?: boolean;
  fontSize?: number | string;
  fontWeight?: number;
  centsWeight?: number;
  color?: string;
  centsColor?: string;
  style?: React.CSSProperties;
}

export function FormattedNumber({
  value,
  prefix = "$",
  suffix = "",
  showCents = true,
  fontSize = 28,
  fontWeight = 600,
  centsWeight = 400,
  color,
  centsColor,
  style = {},
}: FormattedNumberProps) {
  const whole = Math.round(value).toLocaleString();
  return (
    <span
      style={{
        fontFamily: MONO_FONT_STACK,
        fontFeatureSettings: "'tnum', 'zero'",
        fontSize,
        letterSpacing: "-0.02em",
        ...style,
      }}
    >
      <span style={{ fontWeight, color }}>
        {prefix}
        {whole}
      </span>
      {showCents && (
        <span style={{ fontWeight: centsWeight, color: centsColor }}>
          .00
        </span>
      )}
      {suffix && (
        <span style={{ fontWeight: centsWeight, color: centsColor }}>
          {suffix}
        </span>
      )}
    </span>
  );
}
