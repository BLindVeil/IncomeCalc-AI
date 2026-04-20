import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { MobileMoreSheet } from "./MobileMoreSheet";

interface MobileNavShellProps {
  t: ThemeConfig;
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onMoreNavigate: (id: string) => void;
  onSignOut: () => void;
}

export function MobileNavShell({
  t,
  activeTab,
  onTabChange,
  onMoreNavigate,
  onSignOut,
}: MobileNavShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <MobileBottomNav
        t={t}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "more") {
            setMoreOpen(true);
          } else {
            onTabChange(tab);
          }
        }}
      />
      <MobileMoreSheet
        t={t}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onNavigate={(id) => {
          setMoreOpen(false);
          onMoreNavigate(id);
        }}
        onSignOut={() => {
          setMoreOpen(false);
          onSignOut();
        }}
      />
    </>
  );
}
