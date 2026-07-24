import { useState } from "react";
import type { ThemeConfig } from "@/lib/app-shared";
import { INK, GREY, HAIRLINE, WHITE, RADIUS_CARD } from "./landing-theme";

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
    a: "Your required income can be computed directly from what you spend and your tax situation. No bank linking, no credit pull, no lengthy onboarding, just the inputs that matter.",
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
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="faq" style={{ marginTop: 48 }}>
      <h2
        style={{
          fontSize: 40,
          lineHeight: 1.1,
          letterSpacing: "-0.032em",
          fontWeight: 600,
          color: INK,
          margin: "0 0 40px",
        }}
      >
        Questions, answered
      </h2>

      <div
        style={{
          background: WHITE,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: RADIUS_CARD,
          overflow: "hidden",
        }}
      >
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: HAIRLINE, margin: "0 1.5rem" }} />}
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  padding: "16px 1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  background: hovered === i ? "#FAFAFA" : "transparent",
                  border: "none",
                  textAlign: "left",
                  transition: "background 180ms ease",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 500, color: INK, lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={GREY}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    transition: "transform 240ms cubic-bezier(0.23, 1, 0.32, 1)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="lp-acc-body" data-open={isOpen}>
                <div className="lp-acc-inner">
                  <div
                    style={{
                      padding: "0 1.5rem 16px",
                      fontSize: 13,
                      color: GREY,
                      lineHeight: 1.6,
                      opacity: isOpen ? 1 : 0,
                      transition: "opacity 220ms ease",
                    }}
                  >
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
