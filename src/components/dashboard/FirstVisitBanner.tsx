import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FormattedNumber } from "@/components/FormattedNumber";
import type { ThemeConfig } from "@/lib/app-shared";
import { EV_50, EV_500, MONO_FONT_STACK } from "@/lib/app-shared";
import {
  hasSeenDashboardWelcome,
  hasSeenDashboardWelcomeServer,
  markDashboardWelcomeSeen,
  markDashboardWelcomeSeenServer,
} from "@/lib/pending-signup-data";

export interface FirstVisitBannerProps {
  t: ThemeConfig;
  isDark: boolean;
  userId: string;
  sessionToken: string;
  requiredIncomeMonthly: number | null;
}

export function FirstVisitBanner({
  t,
  isDark,
  userId,
  sessionToken,
  requiredIncomeMonthly,
}: FirstVisitBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Fast path: localStorage says already seen
      if (hasSeenDashboardWelcome(userId)) return;

      // Slow path: check server
      const serverSeen = await hasSeenDashboardWelcomeServer(userId, sessionToken);
      if (!cancelled && !serverSeen) {
        setShouldShow(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [userId, sessionToken]);

  function handleDismiss() {
    setDismissing(true);
    markDashboardWelcomeSeen(userId);
    markDashboardWelcomeSeenServer(userId, sessionToken);
    setTimeout(() => {
      setShouldShow(false);
      setDismissing(false);
    }, 200);
  }

  if (!shouldShow) return null;

  const tintBg = isDark ? "rgba(82,183,136,0.08)" : EV_50;
  const accentColor = EV_500;
  const hasNumber = requiredIncomeMonthly != null && requiredIncomeMonthly > 0;

  return (
    <div
      style={{
        background: tintBg,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 16,
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        transition: "opacity 200ms, transform 200ms",
        opacity: dismissing ? 0 : 1,
        transform: dismissing ? "translateY(-8px)" : "translateY(0)",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.5, color: t.text, flex: 1 }}>
        {hasNumber ? (
          <>
            Your{" "}
            <span style={{ fontWeight: 700, fontFamily: MONO_FONT_STACK, fontFeatureSettings: "'tnum', 'zero'" }}>
              $<FormattedNumber value={requiredIncomeMonthly!} />/mo
            </span>{" "}
            required income is saved. This is your dashboard — it updates as your life changes.
          </>
        ) : (
          <>
            Welcome to Ascentra. This is your dashboard — it'll come alive once you enter your expenses.
          </>
        )}
      </p>

      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: t.muted,
          cursor: "pointer",
          padding: 6,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-label="Dismiss welcome message"
      >
        <X size={16} />
      </button>
    </div>
  );
}
