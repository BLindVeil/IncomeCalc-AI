import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";

interface SignupPromptCardProps {
  t: ThemeConfig;
  isDark: boolean;
  variant: "inline" | "sticky";
  onSignup: (intent?: "google" | "email") => void;
  onDismiss: () => void;
}

// ─── Google "G" icon ──────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.68 8.18c0-.57-.05-1.12-.15-1.64H8v3.1h4.3c-.19 1-.75 1.85-1.6 2.42v2.01h2.58c1.51-1.39 2.4-3.44 2.4-5.89Z" fill="#4285F4"/>
      <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2.01c-.72.48-1.63.77-2.71.77-2.08 0-3.85-1.4-4.48-3.3H.85v2.07A7.996 7.996 0 0 0 8 16Z" fill="#34A853"/>
      <path d="M3.52 9.52A4.8 4.8 0 0 1 3.27 8c0-.53.09-1.04.25-1.52V4.41H.85A7.996 7.996 0 0 0 0 8c0 1.29.31 2.51.85 3.59l2.67-2.07Z" fill="#FBBC05"/>
      <path d="M8 3.18c1.17 0 2.22.4 3.05 1.19l2.29-2.29C11.97.79 10.16 0 8 0A7.996 7.996 0 0 0 .85 4.41l2.67 2.07C4.15 4.58 5.92 3.18 8 3.18Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Inline variant ───────────────────────────────────────────────────────────

function InlinePrompt({ t, isDark, onSignup, onDismiss }: Omit<SignupPromptCardProps, "variant">) {
  const [hoverGoogle, setHoverGoogle] = useState(false);
  const [hoverEmail, setHoverEmail] = useState(false);
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

      {/* CTA row */}
      <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
        <button
          onClick={() => onSignup("google")}
          onMouseEnter={() => setHoverGoogle(true)}
          onMouseLeave={() => setHoverGoogle(false)}
          style={{
            padding: "11px 18px",
            background: t.text,
            color: t.cardBg,
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: 999,
            cursor: "pointer",
            transition: "opacity 150ms",
            opacity: hoverGoogle ? 0.9 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          onClick={() => onSignup("email")}
          onMouseEnter={() => setHoverEmail(true)}
          onMouseLeave={() => setHoverEmail(false)}
          style={{
            padding: "11px 18px",
            background: hoverEmail ? (isDark ? "rgba(82,183,136,0.08)" : "#F1FAF4") : "transparent",
            border: `1px solid ${t.border}`,
            color: t.text,
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 999,
            cursor: "pointer",
            transition: "background 150ms",
          }}
        >
          Sign up with email
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
