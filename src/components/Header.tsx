import { useState } from "react";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  Moon, Sun, Zap, ChevronDown, LogIn, LogOut, LayoutDashboard, Mail,
} from "lucide-react";
import { isDevOverrideActive } from "@/lib/dev-override";
import { getDevBadgeLabel } from "@/lib/entitlements";
import { applyDark, THEMES } from "@/lib/app-shared";
import type { ThemeConfig, Theme } from "@/lib/app-shared";
import { getCurrentUser, type User as AuthUser } from "@/lib/auth-store";

/** Custom event name used when Header needs to open the auth modal but has no onSignIn prop. */
export const AUTH_EVENT = "incomecalc-open-auth";

// ─── Account Menu ────────────────────────────────────────────────────────────

interface AccountMenuProps {
  user: AuthUser | null;
  onSignIn: () => void;
  onDashboard: () => void;
  onDigestPreview: () => void;
  onSignOut: () => void;
  t: ThemeConfig;
}

function AccountMenu({ user, onSignIn, onDashboard, onDigestPreview, onSignOut, t }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onSignIn}
        style={{
          background: "transparent",
          border: `1.5px solid ${t.border}`,
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          height: "38px",
          whiteSpace: "nowrap",
        }}
      >
        <LogIn size={14} />
        Sign In
      </button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: `1.5px solid ${t.border}`,
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          height: "38px",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: t.primary,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 700,
        }}>
          {user.email[0].toUpperCase()}
        </div>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "44px",
            right: 0,
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: "10px",
            padding: "0.35rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            zIndex: 200,
            minWidth: "180px",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          <div style={{ padding: "0.5rem 0.65rem", fontSize: "0.78rem", color: t.muted, borderBottom: `1px solid ${t.border}`, marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email}
          </div>
          {[
            { label: "Dashboard", icon: <LayoutDashboard size={14} />, action: onDashboard },
            { label: "Email Digest Preview", icon: <Mail size={14} />, action: onDigestPreview },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); action(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.65rem",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: t.text,
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <span style={{ color: t.muted }}>{icon}</span>
              {label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "0.25rem", paddingTop: "0.25rem" }}>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.65rem",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#ef4444",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export interface HeaderProps {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  currentTheme: ThemeConfig;
  baseTheme: Theme;
  setTheme: (t: Theme) => void;
  onLogoClick?: () => void;
  devOverride?: boolean;
  onDevAccess?: () => void;
  accountUser?: AuthUser | null;
  onSignIn?: () => void;
  onDashboard?: () => void;
  onDigestPreview?: () => void;
  onSignOut?: () => void;
}

export function Header({
  isDark,
  setIsDark,
  currentTheme,
  baseTheme,
  setTheme,
  onLogoClick,
  devOverride: devOverrideProp,
  onDevAccess,
  accountUser,
  onSignIn,
  onDashboard,
  onDigestPreview,
  onSignOut,
}: HeaderProps) {
  const t = applyDark(currentTheme, isDark);
  const isMobile = useIsMobile();
  const hdrBtnBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const hdrBtnBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const hdrIconColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)";
  const [themeOpen, setThemeOpen] = useState(false);
  const showDevBadge = devOverrideProp ?? isDevOverrideActive();
  const badgeLabel = getDevBadgeLabel() ?? (showDevBadge ? "DEV: PREMIUM UNLOCKED" : null);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: t.headerBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
        padding: isMobile ? "0 0.75rem" : "0 1.25rem",
        gap: isMobile ? "0.5rem" : "1rem",
      }}
    >
      <button
        onClick={onLogoClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "transparent",
          border: "none",
          cursor: onLogoClick ? "pointer" : "default",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.75rem",
            flexShrink: 0,
            boxShadow: `0 0 12px ${t.primary}4D`,
          }}
        >
          IC
        </div>
        {!isMobile && <span style={{ fontWeight: 600, fontSize: "1rem", color: t.text, letterSpacing: "-0.01em" }}>IncomeCalc</span>}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.35rem" : "0.5rem", flexShrink: 0, position: "relative", flexWrap: "wrap" }}>
        {import.meta.env.DEV && badgeLabel && (
          <span
            style={{
              background: "#dc2626",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
              letterSpacing: "0.03em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {badgeLabel}
          </span>
        )}
        {/* Dev Access — only in development builds */}
        {import.meta.env.DEV && onDevAccess && (
          <button
            onClick={onDevAccess}
            style={{
              background: hdrBtnBg,
              border: `1px solid ${hdrBtnBorder}`,
              borderRadius: "10px",
              padding: "0.35rem 0.65rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
              color: hdrIconColor,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              height: "36px",
              whiteSpace: "nowrap",
              transition: "background 0.2s ease",
            }}
            title="Developer Access"
          >
            <Zap size={12} />
            Dev
          </button>
        )}
        {/* Theme picker */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            style={{
              background: hdrBtnBg,
              border: `1px solid ${hdrBtnBorder}`,
              borderRadius: "10px",
              padding: "0.35rem 0.65rem",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              height: "36px",
              minWidth: "36px",
              color: t.text,
              transition: "background 0.2s ease",
            }}
            title="Change theme"
          >
            {currentTheme.icon}
          </button>
          {themeOpen && (
            <div
              style={{
                position: "absolute",
                top: "44px",
                right: 0,
                background: isDark ? "rgba(20,20,30,0.95)" : "rgba(255,255,255,0.98)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: "14px",
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.12)",
                zIndex: 200,
                minWidth: "150px",
                maxWidth: "calc(100vw - 2rem)",
              }}
            >
              {(Object.entries(THEMES) as [Theme, ThemeConfig][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setThemeOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "10px",
                    background: baseTheme === key ? `${t.primary}33` : "transparent",
                    border: baseTheme === key ? `1px solid ${t.primary}66` : "1px solid transparent",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    color: t.text,
                    fontWeight: baseTheme === key ? 600 : 400,
                    transition: "background 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: "0.75rem" }}>{cfg.icon}</span>
                  <span>{cfg.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode */}
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            background: hdrBtnBg,
            border: `1px solid ${hdrBtnBorder}`,
            borderRadius: "10px",
            padding: "0.35rem 0.65rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "36px",
            minWidth: "36px",
            color: hdrIconColor,
            transition: "background 0.2s ease",
          }}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Account Menu — always shown; reads auth state from localStorage when props aren't provided */}
        <AccountMenu
          user={accountUser ?? getCurrentUser()}
          onSignIn={onSignIn ?? (() => {
            window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { mode: "signin" } }));
          })}
          onDashboard={onDashboard ?? (() => {})}
          onDigestPreview={onDigestPreview ?? (() => {})}
          onSignOut={onSignOut ?? (() => {
            window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { mode: "signout" } }));
          })}
          t={t}
        />
      </div>
    </div>
  );
}
