import { useState, useEffect, useRef } from "react";

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
  onDashboard?: () => void;
  onSignOut?: () => void;
}

const EV_800 = "#1B4332";
const TEXT = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export function HeroTopNav({ isMobile, onStart, onSignIn, isSignedIn, userName, onDashboard, onSignOut }: HeroTopNavProps) {
  const [hoverSignIn, setHoverSignIn] = useState(false);
  const [hoverGetStarted, setHoverGetStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
            color: TEXT,
          }}
        >
          Ascentra
        </span>
      </div>

      {/* Right — Sign in + Get started */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {!isMobile && (
          isSignedIn ? (
            <div ref={menuRef} style={{ position: "relative" }}>
              <div
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: EV_800,
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

              {/* Dropdown */}
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    right: 0,
                    minWidth: 160,
                    background: "white",
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: "6px 0",
                    zIndex: 200,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onDashboard?.(); }}
                    onMouseEnter={() => setHoverItem("dashboard")}
                    onMouseLeave={() => setHoverItem(null)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      background: hoverItem === "dashboard" ? "#F3F4F6" : "transparent",
                      border: "none",
                      color: TEXT,
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 150ms",
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onSignOut?.(); }}
                    onMouseEnter={() => setHoverItem("signout")}
                    onMouseLeave={() => setHoverItem(null)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      background: hoverItem === "signout" ? "#F3F4F6" : "transparent",
                      border: "none",
                      color: MUTED,
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "background 150ms",
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span
              onClick={onSignIn}
              onMouseEnter={() => setHoverSignIn(true)}
              onMouseLeave={() => setHoverSignIn(false)}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: hoverSignIn ? TEXT : MUTED,
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
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            color: TEXT,
            background: hoverGetStarted ? "#F9FAFB" : "transparent",
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
