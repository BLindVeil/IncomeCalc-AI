export type StatusPillVariant = "good" | "warning" | "danger";

export interface StatusPillProps {
  label: string;
  variant: StatusPillVariant;
}

const VARIANT_STYLES: Record<StatusPillVariant, { color: string; bg: string; border: string }> = {
  good:    { color: "#22c55e", bg: "#22c55e15", border: "#22c55e40" },
  warning: { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b40" },
  danger:  { color: "#ef4444", bg: "#ef444415", border: "#ef444440" },
};

export function StatusPill({ label, variant }: StatusPillProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "6px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {label}
    </span>
  );
}
