import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>
        <Link to="/" style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "2rem" }}>
          ← Back to IncomeCalc
        </Link>

        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Terms of Service</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "2rem" }}>Last updated: February 2026</p>

        <div style={{ lineHeight: 1.8, fontSize: "0.95rem", color: "rgba(255,255,255,0.65)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#FFFFFF", marginTop: "2rem" }}>1. Acceptance of Terms</h2>
          <p>By accessing or using IncomeCalc ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>2. Description of Service</h2>
          <p>IncomeCalc is an online financial calculator and planning tool. The Service provides income estimation, expense analysis, financial health scoring, and related features.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>3. Important Disclaimer</h2>
          <p style={{ background: "rgba(94,92,230,0.1)", border: "1px solid rgba(94,92,230,0.25)", borderRadius: "8px", padding: "1rem", fontWeight: 500 }}>
            <strong>IncomeCalc is not financial, tax, or legal advice.</strong> All calculations, scores, projections, and recommendations are for informational and educational purposes only. You are solely responsible for your financial decisions. Always consult a qualified financial advisor, tax professional, or attorney for advice specific to your situation.
          </p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>4. User Responsibility</h2>
          <p>You acknowledge that:</p>
          <ul style={{ paddingLeft: "1.5rem" }}>
            <li>The accuracy of results depends on the accuracy of the data you provide.</li>
            <li>IncomeCalc does not guarantee any particular financial outcome.</li>
            <li>You are responsible for verifying all calculations independently.</li>
            <li>The Service should not be used as a substitute for professional financial advice.</li>
          </ul>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>5. Accounts and Subscriptions</h2>
          <p>Some features require a paid subscription (Pro or Premium). Subscriptions are billed through Stripe. By subscribing, you authorize recurring charges according to your selected billing cycle (monthly or yearly). You may cancel at any time.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>6. Refund Policy</h2>
          <p>We offer a <strong>7-day money-back guarantee</strong>. If you are not satisfied, contact us within 7 days of purchase for a full refund. See our <Link to="/refund-policy" style={{ color: "#8E8AFF", textDecoration: "underline" }}>Refund Policy</Link> for details.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>7. Intellectual Property</h2>
          <p>All content, design, code, and features of IncomeCalc are the property of IncomeCalc and are protected by applicable intellectual property laws.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, IncomeCalc and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>9. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginTop: "2rem" }}>10. Contact</h2>
          <p>Questions about these terms? Contact us at <a href="mailto:support@yourdomain.com" style={{ color: "#8E8AFF" }}>support@yourdomain.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
