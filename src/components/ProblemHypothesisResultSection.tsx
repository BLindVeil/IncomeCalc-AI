import type { ThemeConfig } from "@/lib/app-shared";
import { PHRRow } from "@/components/PHRRow";
import { useIsMobile } from "@/lib/useIsMobile";

interface ProblemHypothesisResultSectionProps {
  t: ThemeConfig;
  isDark: boolean;
}

const ROWS = [
  {
    accentKind: "reveal" as const,
    accentSide: "right" as const,
    problem: "You don't actually know how much you need to earn to be okay.",
    hypothesis:
      "If we calculate your required income instantly from your expenses — no spreadsheet, no guessing.",
    result:
      "Then you'll finally have a concrete target to aim at instead of a vibe.",
  },
  {
    accentKind: "topMove" as const,
    accentSide: "left" as const,
    problem: "Budgeting apps dump forty charts on you and say good luck.",
    hypothesis:
      "If we give you one number and one next move — no dashboard overload.",
    result: "Then you'll know what to do in under a minute.",
  },
  {
    accentKind: "stability" as const,
    accentSide: "right" as const,
    problem:
      "You can't tell if you're actually okay or one bad month away from trouble.",
    hypothesis:
      "If we turn your finances into a single stability score built on your runway, debt, and savings.",
    result:
      "Then you'll stop refreshing your bank app looking for reassurance.",
  },
  {
    accentKind: "scenario" as const,
    accentSide: "left" as const,
    problem:
      "You can't see what moving, switching jobs, or cutting rent would actually change.",
    hypothesis:
      "If you can test scenarios in real time against your real numbers.",
    result:
      "Then you'll make decisions with data instead of dread.",
  },
];

export function ProblemHypothesisResultSection({
  t,
  isDark,
}: ProblemHypothesisResultSectionProps) {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: t.bg,
        padding: isMobile ? "48px 0" : "96px 0",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "0 20px" : "0 32px",
        }}
      >
        {/* Header */}
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            marginBottom: 56,
          }}
        >
          <div
            style={{
              textTransform: "uppercase",
              fontSize: 12,
              letterSpacing: "0.12em",
              color: t.muted,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            HOW WE THOUGHT ABOUT THIS
          </div>
          <h2
            style={{
              fontSize: isMobile ? 30 : 40,
              fontWeight: 700,
              color: t.text,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            We thought about this a lot.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: t.muted,
              lineHeight: 1.5,
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Here's the problem we saw, the bet we made, and what changes for
            you.
          </p>
        </div>

        {/* Rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {ROWS.map((row) => (
            <PHRRow
              key={row.accentKind}
              t={t}
              isDark={isDark}
              problem={row.problem}
              hypothesis={row.hypothesis}
              result={row.result}
              accentKind={row.accentKind}
              accentSide={row.accentSide}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
