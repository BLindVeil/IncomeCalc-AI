import { useEffect, useRef } from "react";
import {
  Play,
  DollarSign,
  BarChart3,
  TrendingUp,
  Flame,
  Target,
  CreditCard,
  Settings,
  MessageCircle,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";

interface MoreItem {
  id: string;
  label: string;
  icon: typeof Play;
}

// Top section — additional product surfaces
const PRODUCT_ITEMS: MoreItem[] = [
  { id: "simulator", label: "Simulator", icon: Play },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "forecast", label: "12-Month Forecast", icon: TrendingUp },
  { id: "fire", label: "FIRE Estimator", icon: Flame },
  { id: "fi", label: "FI Date", icon: Target },
  { id: "debt", label: "Debt Payoff", icon: CreditCard },
];

// Bottom section — account/support
const ACCOUNT_ITEMS: MoreItem[] = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "ask-ai", label: "Ask AI Advisor", icon: MessageCircle },
  { id: "help", label: "Help", icon: HelpCircle },
];

interface MobileMoreSheetProps {
  t: ThemeConfig;
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onSignOut: () => void;
}

export function MobileMoreSheet({ t, open, onClose, onNavigate, onSignOut }: MobileMoreSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const itemStyle = (danger?: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 12px",
    background: "none",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    color: danger ? "#DC2626" : t.text,
    fontSize: 15,
    fontWeight: 400,
    textAlign: "left",
    transition: "background 150ms ease",
  });

  const divider = (
    <div style={{ height: 1, background: t.border, margin: "8px 12px" }} />
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 299,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: t.cardBg,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          zIndex: 300,
          maxHeight: "70vh",
          overflow: "auto",
        }}
      >
        {/* Handle + close */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 8px",
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>More</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.muted,
              padding: 4,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: t.border,
          }} />
        </div>

        {/* Product items */}
        <div style={{ padding: "0 8px" }}>
          {PRODUCT_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose(); }}
              style={itemStyle()}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.border; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <Icon size={20} style={{ opacity: 0.7 }} />
              {label}
            </button>
          ))}
        </div>

        {divider}

        {/* Account items */}
        <div style={{ padding: "0 8px" }}>
          {ACCOUNT_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose(); }}
              style={itemStyle()}
              onMouseEnter={(e) => { e.currentTarget.style.background = t.border; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <Icon size={20} style={{ opacity: 0.7 }} />
              {label}
            </button>
          ))}
        </div>

        {divider}

        {/* Sign Out */}
        <div style={{ padding: "0 8px 16px" }}>
          <button
            onClick={() => { onSignOut(); onClose(); }}
            style={itemStyle(true)}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.border; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <LogOut size={20} style={{ opacity: 0.7 }} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
