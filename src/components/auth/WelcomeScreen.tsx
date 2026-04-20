import { useEffect, useState } from "react";

import { MONO_FONT_STACK } from "@/lib/app-shared";
import { getFirstName } from "@/lib/user-display";
import { getCurrentUser, getSession } from "@/lib/auth-store";
import {
  markWelcomeSeen,
  markWelcomeSeenServer,
  type PendingSignupData,
} from "@/lib/pending-signup-data";
import { stashResumeFlow } from "@/lib/resume-flow";

const HERO_BG =
  "radial-gradient(ellipse 1600px 900px at 50% 0%, #2D6A4F 0%, #1B4332 42%, #0A2418 80%, #081C15 100%)";
const CTA_ORANGE = "#EA580C";
const CTA_ORANGE_HOVER = "#C2410C";
const FONT_STACK = "'Geist', -apple-system, system-ui, 'Segoe UI', sans-serif";

export function WelcomeScreen() {
  const [pendingData, setPendingData] = useState<PendingSignupData | null>(null);
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const session = getSession();

  useEffect(() => {
    async function loadPendingData() {
      if (!user || !session) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/pending-data", {
          headers: {
            Authorization: `Bearer ${session.token}`,
            "X-User-Id": user.id,
          },
        });
        if (res.ok) {
          const json = await res.json();
          setPendingData(json.pending_data ?? null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadPendingData();
  }, []);

  const handleMarkSeen = async () => {
    if (!user || !session) return;
    markWelcomeSeen(user.id);
    await markWelcomeSeenServer(user.id, session.token);
  };

  const handleContinue = async () => {
    if (pendingData) {
      stashResumeFlow({
        expenseData: pendingData.expenseData,
        taxRate: pendingData.taxRate,
        currentGrossIncome: pendingData.currentGrossIncome,
      });
    }
    await handleMarkSeen();
    try { sessionStorage.setItem("ascentra-last-page", "guided"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const handleSkipToDashboard = async () => {
    await handleMarkSeen();
    try { sessionStorage.setItem("ascentra-last-page", "results"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  if (!user) return null;

  const firstName = getFirstName(user) || "there";
  const requiredIncome = pendingData?.grossMonthlyRequired;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: HERO_BG,
        color: "white",
        fontFamily: FONT_STACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
        {/* Label */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            fontWeight: 500,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 24,
            textTransform: "uppercase",
          }}
        >
          YOU'RE IN
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "white",
            margin: "0 0 20px",
          }}
        >
          Welcome, {firstName}.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.55,
            marginBottom: 40,
          }}
        >
          {pendingData
            ? "Your required income is saved to your account. It's yours to track as your life changes."
            : "Your account is ready."}
        </p>

        {/* Number card */}
        {pendingData && !loading && requiredIncome != null && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: "32px 28px",
              marginBottom: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                fontWeight: 500,
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
              }}
            >
              YOUR REQUIRED INCOME
            </div>
            <div
              style={{
                fontFamily: MONO_FONT_STACK,
                fontFeatureSettings: "'tnum', 'zero'",
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "white",
                lineHeight: 1,
              }}
            >
              ${Math.round(requiredIncome).toLocaleString()}
              <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>/mo</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(82,183,136,0.2)",
                color: "#52B788",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Saved to your account
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleContinue}
            style={{
              padding: "14px 24px",
              background: CTA_ORANGE,
              color: "white",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              letterSpacing: "-0.005em",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = CTA_ORANGE_HOVER; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = CTA_ORANGE; }}
          >
            Continue where I left off →
          </button>

          <button
            onClick={handleSkipToDashboard}
            style={{
              padding: "14px 20px",
              background: "transparent",
              color: "rgba(255,255,255,0.78)",
              fontSize: 14,
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 999,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Skip to my dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
