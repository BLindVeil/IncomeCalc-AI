import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { getCurrentUser, getSession } from "@/lib/auth-store";

export const Route = createFileRoute("/billing/success")({
  component: BillingSuccessPage,
});

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function BillingSuccessPage() {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function verify() {
      try {
        const user = getCurrentUser();
        const session = getSession();

        if (!user || !session) {
          // No logged-in user — show success anyway (webhook will persist server-side)
          setStatus("success");
          return;
        }

        // Poll /api/entitlement until the webhook has fired and written the plan,
        // or until we exhaust our attempts.
        let confirmedPlan: string | null = null;
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
          await sleep(POLL_INTERVAL_MS);

          try {
            const resp = await fetch("/api/entitlement", {
              headers: {
                Authorization: `Bearer ${session.token}`,
                "X-User-Id": user.id,
              },
            });

            if (resp.ok) {
              const data = (await resp.json()) as { plan?: string; status?: string };
              if (data.plan && data.plan !== "free" && data.status !== "expired") {
                confirmedPlan = data.plan;
                break;
              }
            }
          } catch {
            // Network error — keep polling
          }
        }

        if (confirmedPlan) {
          // Mirror the server-verified plan into localStorage for getPlan()
          localStorage.setItem("incomecalc-tier", confirmedPlan);

          trackEvent("purchase_success", {
            plan: confirmedPlan as "pro" | "premium",
            source_page: "/billing/success",
          });
        }

        // Show success regardless — webhook may simply be delayed
        setStatus("success");
      } catch (err) {
        console.error("[BillingSuccess] Verification error:", err);
        setStatus("success"); // Show success rather than leaving user stuck
      }
    }

    verify();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        {status === "verifying" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Loader2 size={48} style={{ color: "#5E5CE6", animation: "spin 1s linear infinite" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)" }}>Verifying your payment...</h1>
            <p style={{ color: "var(--muted-foreground)" }}>Please wait while we confirm your subscription.</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === "success" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={36} style={{ color: "#34D399" }} />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Payment Successful!</h1>
            <p style={{ color: "var(--muted-foreground)", fontSize: "1rem", lineHeight: 1.6 }}>
              Your plan has been activated. You now have full access to all premium features.
            </p>
            <Link
              to="/"
              className="atv-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 2rem",
                fontSize: "1rem",
                textDecoration: "none",
                marginTop: "0.5rem",
              }}
            >
              Go to IncomeCalc
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>Something went wrong</h1>
            <p style={{ color: "var(--muted-foreground)" }}>We couldn't verify your payment. Please contact support at support@yourdomain.com.</p>
            <Link to="/" style={{ color: "color-mix(in srgb, var(--foreground) 65%, #5E5CE6)", textDecoration: "underline", fontSize: "0.95rem" }}>
              Return to IncomeCalc
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
