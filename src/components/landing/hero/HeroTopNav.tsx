import { useState } from "react";

interface HeroTopNavProps {
  isMobile: boolean;
  onStart: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
}

export function HeroTopNav({ isMobile, onStart, onSignIn, isSignedIn }: HeroTopNavProps) {
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
        {!isMobile && !isSignedIn && (
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
