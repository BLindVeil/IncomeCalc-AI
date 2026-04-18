import { useState } from "react";

function getInitial(name: string | undefined): string {
  if (!name || name.trim().length === 0) return "U";
  return name.trim()[0].toUpperCase();
}

interface HeroTopNavProps {
  isMobile: boolean;
  onStart: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
  userName?: string;
  onAvatarClick?: () => void;
}

export function HeroTopNav({ isMobile, onStart, onSignIn, isSignedIn, userName, onAvatarClick }: HeroTopNavProps) {
  const [hoverSignIn, setHoverSignIn] = useState(false);
  const [hoverGetStarted, setHoverGetStarted] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Left — logo + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo-mark.svg"
          alt="Ascentra"
          width={30}
          height={30}
          style={{ borderRadius: 8 }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "white",
          }}
        >
          Ascentra
        </span>
      </div>

      {/* Right — Sign in + Get started */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {!isMobile && (
          isSignedIn ? (
            <div
              onClick={onAvatarClick}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: "pointer",
              }}
              aria-label="Open user menu"
            >
              {getInitial(userName)}
            </div>
          ) : (
            <span
              onClick={onSignIn}
              onMouseEnter={() => setHoverSignIn(true)}
              onMouseLeave={() => setHoverSignIn(false)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: hoverSignIn ? "white" : "rgba(255,255,255,0.78)",
                cursor: "pointer",
                transition: "color 150ms",
              }}
            >
              Sign in
            </span>
          )
        )}
        <button
          onClick={onStart}
          onMouseEnter={() => setHoverGetStarted(true)}
          onMouseLeave={() => setHoverGetStarted(false)}
          style={{
            padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            color: "white",
            background: hoverGetStarted ? "rgba(255,255,255,0.08)" : "transparent",
            cursor: "pointer",
            transition: "background 150ms",
          }}
        >
          Get started →
        </button>
      </div>
    </div>
  );
}
