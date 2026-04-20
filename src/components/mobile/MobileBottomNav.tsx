import { LayoutDashboard, Calculator, Activity, Flag, MoreHorizontal } from "lucide-react";
import type { ThemeConfig } from "@/lib/app-shared";

export type MobileTab = "dashboard" | "calculator" | "diagnosis" | "scenarios" | "more";

interface MobileBottomNavProps {
  t: ThemeConfig;
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "diagnosis", label: "Diagnosis", icon: Activity },
  { id: "scenarios", label: "Scenarios", icon: Flag },
  { id: "more", label: "More", icon: MoreHorizontal },
];

export function MobileBottomNav({ t, activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: t.cardBg,
        borderTop: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 200,
      }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: "6px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isActive ? t.primary : t.muted,
              transition: "color 150ms ease",
            }}
          >
            <Icon size={20} />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1,
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
