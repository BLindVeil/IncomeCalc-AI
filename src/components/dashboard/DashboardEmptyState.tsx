import { BarChart3 } from "lucide-react";
import { EV_600, EV_800 } from "@/lib/app-shared";

interface DashboardEmptyStateProps {
  onGetStarted: () => void;
}

export function DashboardEmptyState({ onGetStarted }: DashboardEmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <BarChart3 size={48} style={{ opacity: 0.3 }} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Your dashboard is ready
      </div>
      <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
        Enter your monthly expenses to see your required income, health score, and what to change first.
      </div>
      <button
        onClick={onGetStarted}
        style={{
          background: `linear-gradient(135deg, ${EV_800}, ${EV_600})`,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
        }}
      >
        Get started →
      </button>
    </div>
  );
}
