import { useState, useRef, useEffect } from "react";
import { User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";
import type { User } from "@/lib/auth-store";
import type { ThemeConfig } from "@/lib/app-shared";
import { getInitials, getDisplayName } from "@/lib/user-display";

interface MobileTopBarProps {
  t: ThemeConfig;
  currentUser: User | null;
  title?: string;
  subtitle?: string;
  onDashboard?: () => void;
  onSignOut: () => void;
  rightExtra?: React.ReactNode;
}

export function MobileTopBar({
  t, currentUser, title, subtitle, onDashboard, onSignOut, rightExtra,
}: MobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: t.cardBg,
        borderBottom: `1px solid ${t.border}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          minHeight: 52,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${t.primary}dd 0%, ${t.primary} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            A
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: t.text,
              letterSpacing: "-0.01em",
            }}
          >
            Ascentra
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {rightExtra}

          {currentUser && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: t.primary,
                  color: "#FFFFFF",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={`Account menu for ${getDisplayName(currentUser)}`}
              >
                {getInitials(currentUser) || <UserIcon size={16} />}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    minWidth: 180,
                    background: t.cardBg,
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    border: `1px solid ${t.border}`,
                    padding: 6,
                    zIndex: 40,
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      color: t.muted,
                      borderBottom: `1px solid ${t.border}`,
                      marginBottom: 4,
                    }}
                  >
                    {getDisplayName(currentUser)}
                  </div>
                  {onDashboard && (
                    <button
                      onClick={() => { setMenuOpen(false); onDashboard(); }}
                      style={menuItemStyle(t, false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onSignOut(); }}
                    style={menuItemStyle(t, true)}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional title/subtitle below header */}
      {title && (
        <div style={{ padding: "8px 16px 14px" }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: t.text,
              margin: 0,
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 13,
                color: t.muted,
                margin: "2px 0 0",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}

function menuItemStyle(t: ThemeConfig, danger: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    color: danger ? "#DC2626" : t.text,
    textAlign: "left",
  };
}
