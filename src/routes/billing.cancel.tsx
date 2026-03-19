import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/billing/cancel")({
  component: BillingCancelPage,
});

function BillingCancelPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255,184,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <XCircle size={36} style={{ color: "#FFB800" }} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Payment Cancelled</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", lineHeight: 1.6 }}>
            No worries — you haven't been charged. Your free plan is still active, and you can upgrade anytime.
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
            Back to IncomeCalc
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
