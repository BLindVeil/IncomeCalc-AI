import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <Link to="/" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "2rem" }}>
          ← Back to IncomeCalc
        </Link>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Refund Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2rem" }}>Last updated: February 2026</p>

        <div style={{ lineHeight: 1.8, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)" }}>
          <p style={{ background: "rgba(94,92,230,0.1)", border: "1px solid rgba(94,92,230,0.25)", borderRadius: "8px", padding: "1rem", fontWeight: 500 }}>
            <strong>IncomeCalc is not financial, tax, or legal advice.</strong> This refund policy applies to IncomeCalc Pro and Premium subscription plans.
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>7-Day Money-Back Guarantee</h2>
          <p>We offer a <strong>7-day money-back guarantee</strong> on all IncomeCalc paid plans (Pro and Premium). If you are not satisfied with the Service for any reason, you may request a full refund within 7 days of your initial purchase date.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>How to Request a Refund</h2>
          <ol style={{ paddingLeft: "1.5rem" }}>
            <li>Email us at <a href="mailto:support@yourdomain.com" style={{ color: "#8E8AFF" }}>support@yourdomain.com</a> within 7 days of your purchase.</li>
            <li>Include your account email address and the approximate date of purchase.</li>
            <li>We will process your refund within 5–10 business days.</li>
          </ol>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>Eligibility</h2>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>Refunds are available within <strong>7 calendar days</strong> from the date of your first payment.</li>
            <li>This guarantee applies to both monthly and yearly plans.</li>
            <li>Refunds for renewal payments (after the initial billing period) are handled on a case-by-case basis.</li>
            <li>Refunds are issued to the original payment method via Stripe.</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>After a Refund</h2>
          <p>Once a refund is issued, your account will be downgraded to the Free plan. You will retain access to all free features. Your saved scenarios and data will not be deleted.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>Cancellations</h2>
          <p>You can cancel your subscription at any time. After cancellation:</p>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>You retain access to paid features until the end of your current billing period.</li>
            <li>No further charges will be made.</li>
            <li>You can resubscribe at any time.</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>Contact</h2>
          <p>For refund requests or billing questions, email <a href="mailto:support@yourdomain.com" style={{ color: "#8E8AFF" }}>support@yourdomain.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
