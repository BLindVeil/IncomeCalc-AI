import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";

interface SignupPromptCardProps {
  t: ThemeConfig;
  isDark: boolean;
  variant: "inline" | "sticky";
  onSignup: () => void;
  onDismiss: () => void;
}

// ─── Inline variant ───────────────────────────────────────────────────────────

function InlinePrompt({ t, isDark, onSignup, onDismiss }: Omit<SignupPromptCardProps, "variant">) {
  const [hoverCta, setHoverCta] = useState(false);
  const [hoverX, setHoverX] = useState(false);

  return (
    <div
      style={{
        background: isDark ? "rgba(82,183,136,0.08)" : (t as any).ev50 || "#F1FAF4",
        border: `1px solid ${isDark ? "rgba(82,183,136,0.2)" : "rgba(82,183,136,0.3)"}`,
        borderRadius: 16,
        padding: "24px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
        margin: "24px 0",
      }}
    >
      {/* Dismiss X */}
      <button
        onClick={onDismiss}
        onMouseEnter={() => setHoverX(true)}
        onMouseLeave={() => setHoverX(false)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 24,
          height: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} style={{ color: hoverX ? t.text : t.muted, transition: "color 150ms" }} />
      </button>

      {/* Label */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          fontWeight: 500,
          color: isDark ? "#52B788" : "#1B4332",
          textTransform: "uppercase",
        }}
      >
        SAVE YOUR NUMBER
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: t.text,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          paddingRight: 28,
        }}
      >
        Track how this changes as your life does.
      </div>

      {/* Description */}
      <div style={{ fontSize: 14, color: t.muted, lineHeight: 1.55 }}>
        Your required income shifts every time you move, switch jobs, or change a subscription. Save
        this number so you can watch it move with you — free forever.
      </div>

      {/* CTA */}
      <div style={{ marginTop: 4 }}>
        <button
          onClick={() => onSignup()}
          onMouseEnter={() => setHoverCta(true)}
          onMouseLeave={() => setHoverCta(false)}
          style={{
            padding: "11px 20px",
            background: t.text,
            color: t.cardBg,
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            transition: "opacity 150ms",
            opacity: hoverCta ? 0.9 : 1,
          }}
        >
          Sign up — free forever
        </button>
      </div>

      {/* Skip */}
      <span
        onClick={onDismiss}
        style={{
          fontSize: 12,
          color: t.muted,
          textDecoration: "underline",
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        Skip for now
      </span>
    </div>
  );
}

// ─── Sticky variant ───────────────────────────────────────────────────────────

function StickyPrompt({ t, onSignup, onDismiss }: Omit<SignupPromptCardProps, "variant" | "isDark">) {
  const [hoverCta, setHoverCta] = useState(false);
  const [hoverX, setHoverX] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#1B4332",
        color: "white",
        padding: "14px 24px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Message */}
      <div style={{ fontSize: 14, color: "white", fontWeight: 500, minWidth: 0 }}>
        <span className="signup-sticky-full">Save your number. Track how it changes as your life does.</span>
        <span className="signup-sticky-short" style={{ display: "none" }}>Save your number — free forever.</span>
        <style>{`
          @media (max-width: 640px) {
            .signup-sticky-full { display: none !important; }
            .signup-sticky-short { display: inline !important; }
          }
        `}</style>
      </div>

      {/* Right */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <button
          onClick={() => onSignup()}
          onMouseEnter={() => setHoverCta(true)}
          onMouseLeave={() => setHoverCta(false)}
          style={{
            padding: "8px 16px",
            background: hoverCta ? "#C2410C" : "#EA580C",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            transition: "background 150ms",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          Sign up <ArrowRight size={13} />
        </button>

        <button
          onClick={onDismiss}
          onMouseEnter={() => setHoverX(true)}
          onMouseLeave={() => setHoverX(false)}
          style={{
            width: 28,
            height: 28,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} style={{ color: hoverX ? "white" : "rgba(255,255,255,0.7)", transition: "color 150ms" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function SignupPromptCard(props: SignupPromptCardProps) {
  if (props.variant === "inline") {
    return <InlinePrompt t={props.t} isDark={props.isDark} onSignup={props.onSignup} onDismiss={props.onDismiss} />;
  }
  return <StickyPrompt t={props.t} onSignup={props.onSignup} onDismiss={props.onDismiss} />;
}
