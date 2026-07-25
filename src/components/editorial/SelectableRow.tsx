import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EASE_OUT, RADIUS } from "./tokens";

interface SelectableRowProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  t: ThemeConfig;
  /** "radio" shows a circular indicator, "check" a rounded square. Default radio. */
  indicator?: "radio" | "check";
}

/**
 * Editorial single-select row: hairline card that firms to an ink border with a
 * filled indicator when chosen. Only colour/opacity transitions (no layout), so
 * it stays crisp and reduced-motion friendly.
 */
export function SelectableRow({
  selected,
  onSelect,
  title,
  description,
  icon,
  t,
  indicator = "radio",
}: SelectableRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="lp-press"
      style={{
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        gap: 16,
        width: "100%",
        textAlign: "left",
        background: selected ? t.primarySoft : t.cardBg,
        border: `1px solid ${selected ? t.text : t.border}`,
        borderRadius: RADIUS.card,
        padding: "18px 20px",
        cursor: "pointer",
        fontFamily: "inherit",
        color: t.text,
        transition: `border-color 180ms ${EASE_OUT}, background 180ms ${EASE_OUT}`,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = t.borderStrong;
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = t.border;
      }}
    >
      {icon && (
        <span style={{ flexShrink: 0, marginTop: description ? 1 : 0, color: selected ? t.text : t.muted, display: "inline-flex" }}>
          {icon}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600, color: t.text, letterSpacing: "-0.01em" }}>
          {title}
        </span>
        {description && (
          <span style={{ display: "block", fontSize: 13, color: t.muted, lineHeight: 1.5, marginTop: 3 }}>
            {description}
          </span>
        )}
      </span>
      <span
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          marginTop: description ? 1 : 0,
          borderRadius: indicator === "radio" ? "50%" : 7,
          border: `2px solid ${selected ? t.text : t.borderStrong}`,
          background: selected ? t.text : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: `border-color 180ms ${EASE_OUT}, background 180ms ${EASE_OUT}`,
        }}
      >
        {selected &&
          (indicator === "radio" ? (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.cardBg }} />
          ) : (
            <Check size={13} strokeWidth={3} color={t.cardBg} />
          ))}
      </span>
    </button>
  );
}
