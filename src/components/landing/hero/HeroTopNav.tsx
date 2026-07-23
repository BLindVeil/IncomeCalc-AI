import { useState, useEffect, useRef } from "react";
import { EV_800 } from "@/lib/app-shared";
import { INK, INK_SOFT, SAGE, PAPER, GLASS_BORDER } from "../landing-theme";

function getInitial(name: string | undefined): string {
  if (!name || name.trim().length === 0) return "U";
  return name.trim()[0].toUpperCase();
}

const NAV_LINKS: { label: string; target: string }[] = [
  { label: "Overview", target: "overview" },
  { label: "How it works", target: "how" },
  { label: "Pricing", target: "pricing" },
  { label: "FAQ", target: "faq" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface HeroTopNavProps {
  isMobile: boolean;
  /** Center anchor links need full desktop width to avoid colliding with the controls */
  showLinks?: boolean;
  onStart: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
  userName?: string;
  onDashboard?: () => void;
  onSignOut?: () => void;
}

export function HeroTopNav({ isMobile, showLinks, onStart, onSignIn, isSignedIn, userName, onDashboard, onSignOut }: HeroTopNavProps) {
  const [hoverSignIn, setHoverSignIn] = useState(false);
  const [hoverCta, setHoverCta] = useState(false);
  const [hoverLink, setHoverLink] = useState<string | null>(null);
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
        position: "relative",
        height: 56,
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
            color: INK,
          }}
        >
          Ascentra
        </span>
      </div>

      {/* Center — section links (desktop only) */}
      {showLinks && (
        <nav
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => scrollToSection(link.target)}
              onMouseEnter={() => setHoverLink(link.target)}
              onMouseLeave={() => setHoverLink(null)}
              style={{
                background: hoverLink === link.target ? "rgba(12,26,18,0.06)" : "transparent",
                border: "none",
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 13.5,
                fontWeight: 500,
                color: hoverLink === link.target ? INK : SAGE,
                cursor: "pointer",
                transition: "color 150ms ease, background 150ms ease",
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}

      {/* Right — Sign in + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 18 }}>
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
                    border: `1px solid ${GLASS_BORDER}`,
                    borderRadius: 12,
                    padding: "6px 0",
                    zIndex: 200,
                    boxShadow: "0 4px 16px rgba(27,67,50,0.12)",
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
                      background: hoverItem === "dashboard" ? "rgba(12,26,18,0.05)" : "transparent",
                      border: "none",
                      color: INK,
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
                      background: hoverItem === "signout" ? "rgba(12,26,18,0.05)" : "transparent",
                      border: "none",
                      color: INK_SOFT,
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
            <button
              type="button"
              onClick={onSignIn}
              onMouseEnter={() => setHoverSignIn(true)}
              onMouseLeave={() => setHoverSignIn(false)}
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: hoverSignIn ? INK : SAGE,
                cursor: "pointer",
                transition: "color 150ms",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              Sign in
            </button>
          )
        )}
        <button
          type="button"
          className="lp-press"
          onClick={onStart}
          onMouseEnter={() => setHoverCta(true)}
          onMouseLeave={() => setHoverCta(false)}
          style={{
            padding: isMobile ? "8px 14px" : "9px 18px",
            border: "none",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            color: PAPER,
            background: hoverCta ? "#1E3025" : INK,
            cursor: "pointer",
          }}
        >
          Calculate my number →
        </button>
      </div>
    </div>
  );
}
