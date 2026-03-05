// src/index.tsx
// NOTE: This file is intentionally written to be drop-in compatible with the
// "single-file router" pattern you've been using (page state + sharedProps).
// The key fix for the runtime crash is: define openAuth() here and pass it through sharedProps.

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

// --- Your existing component imports (keep the same paths you already have) ---
// If your paths differ, adjust them to match your repo.
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import SharePage from "./pages/SharePage";
import ShareModal from "./components/ShareModal";
import AuthModal from "./components/AuthModal";

// Optional: if you have these utilities already, keep your imports.
// If not, remove and inline as needed.
import { applyDark } from "./theme/applyDark";
import { getCurrentUser, getSession } from "./lib/auth";

// --- Types (align with your existing types if they differ) ---
type PageId = "landing" | "calculator" | "results" | "checkout" | "dashboard" | "share";
type AuthMode = "signin" | "signup";

// If you already have these types elsewhere, replace with your imports.
type PlanId = "starter" | "pro" | "premium";
type Scenario = any;

function App() {
  // --- URL state (deep link for share pages) ---
  const [page, setPage] = useState<PageId>("landing");
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  // --- Auth state ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("signin");

  // --- User/session state ---
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // --- Scenario state used across calculator/results/share/dashboard ---
  const [scenario, setScenario] = useState<Scenario | null>(null);

  // --- Theme (keep your existing logic if different) ---
  const [currentTheme, setCurrentTheme] = useState<any>({}); // replace with your theme type
  const [isDark, setIsDark] = useState<boolean>(false);

  // --- Share modal state (from Dashboard) ---
  const [shareModalScenario, setShareModalScenario] = useState<Scenario | null>(null);

  // ✅ FIX: define openAuth and keep it stable
  const openAuth = useCallback((mode: AuthMode = "signin") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuth = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  // Example: you likely already have a "backToResults"
  const backToResults = useCallback(() => {
    setPage("results");
  }, []);

  // Example: dashboard scenario loader
  const handleLoadScenario = useCallback((loaded: Scenario) => {
    setScenario(loaded);
    setPage("results");
  }, []);

  const handleShareFromDashboard = useCallback((s: Scenario) => {
    setShareModalScenario(s);
  }, []);

  // Example: parse /share/:slug deep links
  useEffect(() => {
    const path = window.location.pathname || "/";
    const match = path.match(/^\/share\/([^/]+)$/);
    if (match?.[1]) {
      setShareSlug(match[1]);
      setPage("share");
      return;
    }
    // Default route
    setPage("landing");
  }, []);

  // Example: refresh current user from your auth utilities
  useEffect(() => {
    const u = getCurrentUser?.();
    setCurrentUser(u ?? null);
  }, []);

  // --- Stripe checkout redirect (keep your existing version if you already have one) ---
  async function redirectToCheckout(plan: PlanId, billingPeriod: "monthly" | "yearly") {
    const user = getCurrentUser?.();
    const session = getSession?.();

    if (!user || !session) {
      openAuth("signin");
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    };

    // ✅ Only allow X-User-Id in local/dev (NOT production)
    if (import.meta.env.DEV) {
      headers["X-User-Id"] = user.id;
    }

    try {
      const resp = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          planTier: plan,
          billingPeriod,
          userId: user.id,
        }),
      });

      if (!resp.ok) {
        console.error("[checkout] Failed to create session:", await resp.text());
        return;
      }

      const data = await resp.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.sessionId) {
        // If you use Stripe.js elsewhere, keep your original logic.
        console.warn("[checkout] sessionId returned but no url; ensure Stripe.js redirect is implemented.");
        return;
      }

      console.error("[checkout] Unexpected response:", data);
    } catch (e) {
      console.error("[checkout] Error:", e);
    }
  }

  // --- Shared props passed into pages/components ---
  const sharedProps = useMemo(() => {
    return {
      // navigation helpers
      setPage,
      setShareSlug,

      // auth helpers (✅ critical)
      openAuth,
      closeAuth,
      showAuthModal,
      authModalMode,

      // user/session
      currentUser,

      // scenario
      scenario,
      setScenario,

      // theme
      currentTheme,
      setCurrentTheme,
      isDark,
      setIsDark,

      // payments
      redirectToCheckout,

      // translation/theming helper you used earlier
      t: applyDark?.(currentTheme, isDark),
    };
  }, [
    openAuth,
    closeAuth,
    showAuthModal,
    authModalMode,
    currentUser,
    scenario,
    currentTheme,
    isDark,
  ]);

  // --- Render routes ---
  // ── Share Page (deep link) ──
  if (page === "share" && shareSlug) {
    return (
      <>
        <SharePage
          slug={shareSlug}
          onTryYourOwn={() => {
            setShareSlug(null);
            window.history.pushState({}, "", "/");
            setPage("landing");
          }}
          {...sharedProps}
        />
        {showAuthModal && (
          <AuthModal mode={authModalMode} onClose={closeAuth} {...sharedProps} />
        )}
      </>
    );
  }

  // ── Dashboard ──
  if (page === "dashboard" && currentUser) {
    return (
      <>
        <DashboardPage
          user={currentUser}
          onBack={backToResults}
          onLoadScenario={handleLoadScenario}
          onShare={handleShareFromDashboard}
          {...sharedProps}
        />
        {shareModalScenario && (
          <ShareModal
            scenario={shareModalScenario}
            userId={currentUser.id}
            onClose={() => setShareModalScenario(null)}
            onRefresh={() => {}}
            t={applyDark?.(currentTheme, isDark)}
            isDark={isDark}
          />
        )}
        {showAuthModal && (
          <AuthModal mode={authModalMode} onClose={closeAuth} {...sharedProps} />
        )}
      </>
    );
  }

  // ── Landing (default) ──
  return (
    <>
      <Suspense fallback={null}>
        <LandingPage {...sharedProps} />
      </Suspense>

      {showAuthModal && <AuthModal mode={authModalMode} onClose={closeAuth} {...sharedProps} />}
    </>
  );
}

// --- Bootstrap ---
const el = document.getElementById("root");
if (!el) throw new Error("Missing #root element");
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
