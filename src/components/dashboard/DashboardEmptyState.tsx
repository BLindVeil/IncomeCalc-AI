import { BarChart3 } from "lucide-react";
import type { User } from "@/lib/auth-store";
import { getFirstName } from "@/lib/user-display";

interface DashboardEmptyStateProps {
  currentUser?: User | null;
  onGetStarted: () => void;
}

export function DashboardEmptyState({ currentUser, onGetStarted }: DashboardEmptyStateProps) {
  const firstName = getFirstName(currentUser);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "96px 24px",
      textAlign: "center",
      minHeight: "60vh",
    }}>
      <div style={{ marginBottom: 24, color: "#6B7280" }}>
        <BarChart3 size={48} style={{ opacity: 0.3 }} />
      </div>

      <h2 style={{
        fontSize: 24,
        fontWeight: 600,
        color: "#111827",
        marginBottom: 12,
        letterSpacing: "-0.01em",
        margin: "0 0 12px",
      }}>
        {firstName ? `Welcome, ${firstName}.` : "Welcome to Ascentra."}
      </h2>

      <p style={{
        fontSize: 15,
        color: "#6B7280",
        marginBottom: 32,
        maxWidth: 440,
        lineHeight: 1.55,
        margin: "0 auto 32px",
      }}>
        Your dashboard comes alive once you enter your monthly expenses.
        Takes about 60 seconds — we'll show you your required income, health score,
        and the one thing to change first.
      </p>

      <button
        onClick={onGetStarted}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 28px",
          background: "#EA580C",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 150ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#C2410C"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#EA580C"; }}
      >
        Get started →
      </button>

      <p style={{
        fontSize: 13,
        color: "#9CA3AF",
        marginTop: 16,
      }}>
        Takes 60 seconds. No credit card.
      </p>
    </div>
  );
}
