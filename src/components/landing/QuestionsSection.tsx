import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";

interface QuestionsSectionProps {
  t: ThemeConfig;
}

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: "What if I don't know my exact expenses?",
    a: "Estimate. You can refine any number later and your results update instantly. Most people get their required income within $100 on their first pass.",
  },
  {
    q: "How do you calculate the required income?",
    a: "We start from your expenses, debt payments, and savings target, then factor in your tax rate to find the gross income you actually need. You can toggle between pre-tax and post-tax views.",
  },
  {
    q: "Why only 60 seconds?",
    a: "Your required income can be computed directly from what you spend and your tax situation. No bank linking, no credit pull, no lengthy onboarding — just the inputs that matter.",
  },
  {
    q: "What data do you store?",
    a: "Your expense categories, your number, and your saved scenarios. No account numbers, no transactions, no credentials. We never link to your bank.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Pro and Premium are month-to-month or yearly with no lock-in. Your free-tier number and scenarios stay yours forever.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Ascentra is a calculator and diagnostic tool. We show you numbers; decisions are yours. Nothing here is legal, tax, or investment advice.",
  },
];

export function QuestionsSection({ t }: QuestionsSectionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" style={{ marginTop: 48 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: t.muted,
          marginBottom: 20,
        }}
      >
        QUESTIONS
      </div>

      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: t.border, margin: "0 1.5rem" }} />}
              <div
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  padding: "16px 1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.muted}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    transition: "transform 200ms",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {isOpen && (
                <div style={{ padding: "0 1.5rem 16px", fontSize: 13, color: t.muted, lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
