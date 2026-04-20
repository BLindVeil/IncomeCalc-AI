import { useState, useRef, useEffect } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_600, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";
import type { User } from "@/lib/auth-store";
import { getInitials } from "@/lib/user-display";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AlertItem {
  id: string;
  title: string;
  severity: "warning" | "critical";
  explanation: string;
}

export interface QuickNavItem {
  label: string;
  view: string;
}

export interface DashboardTopbarProps {
  t: ThemeConfig;
  isDark: boolean;
  isMobile?: boolean;
  userName?: string;
  onSimulator?: () => void;
  alerts?: AlertItem[];
  onNavigate?: (view: string) => void;
  leftContent?: React.ReactNode;
  ctaLabel?: string;
  ctaOnClick?: () => void;
  rightExtra?: React.ReactNode;
  onDashboard?: () => void;
  onSignOut?: () => void;
  userEmail?: string;
  subtitle?: string;
  currentUser?: User | null;
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PlusIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SearchIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const BellIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const XIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Quick nav links ────────────────────────────────────────────────────────

const QUICK_NAV: QuickNavItem[] = [
  { label: "Dashboard", view: "dashboard" },
  { label: "Budget", view: "budget" },
  { label: "Analytics", view: "analytics" },
  { label: "Scenarios", view: "scenarios" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function DashboardTopbar({
  t,
  isDark,
  isMobile = false,
  userName = "there",
  onSimulator,
  alerts = [],
  onNavigate,
  leftContent,
  ctaLabel,
  ctaOnClick,
  rightExtra,
  onDashboard,
  onSignOut,
  userEmail,
  subtitle,
  currentUser,
}: DashboardTopbarProps) {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();

  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Click-outside handlers
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    requestAnimationFrame(() => searchInputRef.current?.focus());
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarMenuOpen]);

  const filteredNav = searchQuery.trim()
    ? QUICK_NAV.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : QUICK_NAV;

  const chipStyle: React.CSSProperties = {
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    color: t.muted,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 500,
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: t.muted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    flexShrink: 0,
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: t.cardBg,
    border: `1px solid ${t.border}`,
    borderRadius: 16,
    padding: 16,
    zIndex: 30,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    minWidth: 300,
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      {leftContent ?? (
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: t.text, margin: 0 }}>
            Welcome back, {userName}
          </h1>
          <p style={{ fontSize: 14, color: t.muted, margin: "4px 0 0" }}>
            {subtitle ?? `Here's your financial assessment for ${month} ${year}`}
          </p>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span
          style={{
            ...chipStyle,
            background: t.primarySoft ?? "rgba(82,183,136,0.1)",
            color: t.primary,
            border: "none",
            cursor: "default",
          }}
        >
          <CalendarIcon /> {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>

        {/* ─── Search ────────────────────────────────────────────── */}
        {!isMobile && (
          <div ref={searchRef} style={{ position: "relative" }}>
            <button
              style={iconBtnStyle}
              aria-label="Search"
              onClick={() => { setSearchOpen(!searchOpen); setBellOpen(false); }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.muted; }}
            >
              <SearchIcon />
            </button>
            {searchOpen && (
              <div style={dropdownStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ color: t.muted, flexShrink: 0 }}><SearchIcon /></span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: t.text,
                      padding: 0,
                    }}
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", padding: 0 }}
                  >
                    <XIcon />
                  </button>
                </div>
                <div style={{ height: 1, background: t.border, marginBottom: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: t.muted, marginBottom: 8 }}>
                  Quick navigation
                </div>
                {filteredNav.length === 0 && (
                  <div style={{ fontSize: 13, color: t.muted, padding: "8px 0" }}>No results</div>
                )}
                {filteredNav.map((nav) => (
                  <div
                    key={nav.view}
                    onClick={() => { onNavigate?.(nav.view); setSearchOpen(false); setSearchQuery(""); }}
                    style={{
                      padding: "8px 12px",
                      fontSize: 14,
                      color: t.text,
                      cursor: "pointer",
                      borderRadius: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.primarySoft ?? "rgba(82,183,136,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {nav.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Notifications bell ────────────────────────────────── */}
        {!isMobile && (
          <div ref={bellRef} style={{ position: "relative" }}>
            <button
              style={{ ...iconBtnStyle, position: "relative" as const }}
              aria-label="Notifications"
              onClick={() => { setBellOpen(!bellOpen); setSearchOpen(false); }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.muted; }}
            >
              <BellIcon />
              {alerts.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#EF4444",
                    border: `2px solid ${t.cardBg}`,
                  }}
                />
              )}
            </button>
            {bellOpen && (
              <div style={dropdownStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Notifications</span>
                  <span style={{ fontSize: 12, color: t.muted }}>
                    {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {alerts.length === 0 ? (
                  <div style={{ fontSize: 13, color: t.muted, textAlign: "center", padding: "20px 0" }}>
                    No alerts — you're all clear
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: alert.severity === "critical"
                            ? (isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)")
                            : (isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.05)"),
                          border: `1px solid ${alert.severity === "critical" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: alert.severity === "critical" ? "#ef4444" : "#f59e0b",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{alert.title}</span>
                        </div>
                        <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.4 }}>
                          {alert.explanation.length > 120 ? alert.explanation.slice(0, 120) + "..." : alert.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {rightExtra}
        <button
          onClick={ctaOnClick ?? onSimulator}
          style={{
            background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
          }}
        >
          {ctaLabel ? ctaLabel : <><PlusIcon /> New scenario</>}
        </button>
        {!rightExtra && (
          <div ref={avatarRef} style={{ position: "relative" }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${EV_500}, ${EV_800})`,
                color: "#fff", fontWeight: 600, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                cursor: (onDashboard || onSignOut) ? "pointer" : "default",
                transition: "opacity 150ms",
              }}
              onClick={() => {
                if (onDashboard || onSignOut) {
                  setAvatarMenuOpen(!avatarMenuOpen);
                  setBellOpen(false);
                  setSearchOpen(false);
                }
              }}
              aria-label="Open user menu"
              aria-expanded={avatarMenuOpen}
            >
              {getInitials(currentUser) || (userName !== "there" ? userName.charAt(0).toUpperCase() : "U")}
            </div>
            {avatarMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: t.cardBg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 12,
                  padding: 6,
                  minWidth: 220,
                  zIndex: 100,
                  boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.08)",
                }}
              >
                {userEmail && (
                  <>
                    <div
                      style={{
                        padding: "10px 12px",
                        color: t.muted,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        fontWeight: 500,
                        whiteSpace: "nowrap" as const,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {userEmail}
                    </div>
                    <div style={{ height: 1, background: t.border, margin: "4px 0" }} />
                  </>
                )}
                {onDashboard && (
                  <div
                    style={{ padding: "10px 12px", fontSize: 14, color: t.text, cursor: "pointer", borderRadius: 8, fontWeight: 500 }}
                    onClick={() => { setAvatarMenuOpen(false); onDashboard(); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Dashboard
                  </div>
                )}
                {onSignOut && (
                  <div
                    style={{ padding: "10px 12px", fontSize: 14, color: t.text, cursor: "pointer", borderRadius: 8, fontWeight: 500 }}
                    onClick={() => { setAvatarMenuOpen(false); onSignOut(); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Sign out
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
