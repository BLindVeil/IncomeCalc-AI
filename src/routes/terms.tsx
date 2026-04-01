import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      {/* Minimal nav header */}
      <div style={{ borderBottom: "1px solid var(--muted)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "720px", margin: "0 auto" }}>
        <Link to="/" style={{ color: "var(--foreground)", fontSize: "1rem", fontWeight: 700, textDecoration: "none", letterSpacing: "-0.02em" }}>
          IncomeCalc
        </Link>
        <Link to="/" style={{ color: "var(--muted-foreground)", fontSize: "0.85rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
          ← Back
        </Link>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Terms of Service</h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.9rem", marginBottom: "2rem" }}>Last updated: February 2026</p>

        <div style={{ lineHeight: 1.8, fontSize: "0.95rem", color: "color-mix(in srgb, var(--foreground) 75%, transparent)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--foreground)", marginTop: "2rem" }}>1. Acceptance of Terms</h2>
          <p>By accessing or using IncomeCalc ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>2. Description of Service</h2>
          <p>IncomeCalc is an online financial calculator and planning tool. The Service provides income estimation, expense analysis, financial health scoring, and related features.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>3. Important Disclaimer</h2>
          <p style={{ background: "color-mix(in srgb, var(--foreground) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)", borderRadius: "8px", padding: "1rem", fontWeight: 500, color: "var(--foreground)" }}>
            <strong>IncomeCalc is not financial, tax, or legal advice.</strong> All calculations, scores, projections, and recommendations are for informational and educational purposes only. You are solely responsible for your financial decisions. Always consult a qualified financial advisor, tax professional, or attorney for advice specific to your situation.
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>4. User Responsibility</h2>
          <p>You acknowledge that:</p>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>The accuracy of results depends on the accuracy of the data you provide.</li>
            <li>IncomeCalc does not guarantee any particular financial outcome.</li>
            <li>You are responsible for verifying all calculations independently.</li>
            <li>The Service should not be used as a substitute for professional financial advice.</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>5. Accounts and Subscriptions</h2>
          <p>Some features require a paid subscription (Pro or Premium). Subscriptions are billed through Stripe. By subscribing, you authorize recurring charges according to your selected billing cycle (monthly or yearly). You may cancel at any time.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>6. Refund Policy</h2>
          <p>We offer a <strong>7-day money-back guarantee</strong>. If you are not satisfied, contact us within 7 days of purchase for a full refund. See our <Link to="/refund-policy" style={{ color: "color-mix(in srgb, var(--foreground) 65%, #5E5CE6)", textDecoration: "underline" }}>Refund Policy</Link> for details.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>7. Intellectual Property</h2>
          <p>All content, design, code, and features of IncomeCalc are the property of IncomeCalc and are protected by applicable intellectual property laws.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, IncomeCalc and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>9. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--foreground)", marginTop: "2rem" }}>10. Contact</h2>
          <p>Questions about these terms? Contact us at <a href="mailto:incomecalcai@proton.me" style={{ color: "color-mix(in srgb, var(--foreground) 65%, #5E5CE6)" }}>incomecalcai@proton.me</a>.</p>
        </div>
      </div>
    </div>
  );
}
