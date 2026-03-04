import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0F1115", color: "#FFFFFF" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <Link to="/" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "2rem" }}>
          ← Back to IncomeCalc
        </Link>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Privacy Policy</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2rem" }}>Last updated: February 2026</p>

        <div style={{ lineHeight: 1.8, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>1. Overview</h2>
          <p>IncomeCalc ("we", "our", "the Service") respects your privacy. This policy explains what information we collect, how we use it, and your rights.</p>

          <p style={{ background: "rgba(94,92,230,0.1)", border: "1px solid rgba(94,92,230,0.25)", borderRadius: "8px", padding: "1rem", fontWeight: 500 }}>
            <strong>IncomeCalc is not financial, tax, or legal advice.</strong> All data you enter is used solely to provide calculations and features. We do not sell your personal data to third parties.
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>2. Information We Collect</h2>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#FFFFFF", marginTop: "1.25rem" }}>a) Email Address</h3>
          <p>When you create an account or subscribe to a plan, we collect your email address. This is used for account identification, subscription management, and optional weekly digest emails.</p>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#FFFFFF", marginTop: "1.25rem" }}>b) Analytics Events</h3>
          <p>We use PostHog (or a similar analytics service) to collect anonymous usage data, including:</p>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>Pages viewed (e.g., calculator, results, pricing)</li>
            <li>Feature usage events (e.g., calculation started, results viewed)</li>
            <li>Device type and browser information</li>
            <li>Approximate geographic location (country/region level)</li>
          </ul>
          <p>This data helps us understand how the Service is used and improve it. No personally identifiable financial data is sent to analytics.</p>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#FFFFFF", marginTop: "1.25rem" }}>c) Payment Processing</h3>
          <p>All payment processing is handled by <strong>Stripe</strong>. We do not store your credit card number, CVV, or full payment details. Stripe processes and stores your payment information securely in compliance with PCI-DSS Level 1 standards. We may receive from Stripe: your email, subscription status, and transaction identifiers.</p>

          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#FFFFFF", marginTop: "1.25rem" }}>d) Financial Data You Enter</h3>
          <p>Expense data, income figures, and other financial information you enter into the calculator are processed locally in your browser and may be stored in your browser's local storage. This data is not sent to our servers unless you explicitly use a cloud-sync or sharing feature.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>3. How We Use Your Information</h2>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>To provide and improve the Service</li>
            <li>To process subscriptions and payments via Stripe</li>
            <li>To send weekly digest emails (if you opt in)</li>
            <li>To analyze usage patterns and improve features</li>
            <li>To provide customer support</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>4. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with:</p>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li><strong>Stripe</strong> — for payment processing</li>
            <li><strong>PostHog</strong> — for anonymous analytics</li>
            <li><strong>Sentry</strong> — for error tracking (no personal financial data is included)</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>5. Data Retention</h2>
          <p>Account data is retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You may unsubscribe from emails at any time using the link in any email we send.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>7. Cookies and Local Storage</h2>
          <p>We use browser local storage to save your preferences, calculation data, and session information. Analytics services may use cookies for tracking purposes.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>8. Contact</h2>
          <p>For privacy-related questions or data deletion requests, contact us at <a href="mailto:support@yourdomain.com" style={{ color: "#8E8AFF" }}>support@yourdomain.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
