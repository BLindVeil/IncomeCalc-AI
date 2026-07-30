import type { ThemeConfig } from "@/lib/app-shared";
import { EV_500, EV_800, MONO_FONT_STACK } from "@/lib/app-shared";
import { WHITE, INK, GREY, GREY_LIGHT, HAIRLINE, MONO, pillLabel, CANVAS } from "./landing-theme";
import { Reveal } from "./Reveal";
import { useInViewOnce } from "./useInViewOnce";
import { IncomeBarChart } from "@/components/dashboard/IncomeBarChart";
import { TopMoveCard } from "@/components/dashboard/TopMoveCard";

interface CapabilitiesSectionProps {
  isMobile: boolean;
  t: ThemeConfig;
}

/**
 * Illustrative product output, not a real user's result — the same worked
 * example the hero preview uses, so the whole page reads as one session.
 */
const EXAMPLE = {
  requiredMonthly: 6840,
  currentMonthly: 5400,
  score: 82,
  topCategory: "Housing / Rent",
  topAmount: 1800,
  topPercent: 31,
};

const SCORE_BARS = [
  { label: "Cashflow stability", value: 74 },
  { label: "Savings strength", value: 68 },
  { label: "Debt risk", value: 88 },
  { label: "Income fragility", value: 61 },
];

/** The panel chrome every capability card shares: one product surface, one caption. */
function CapabilityCard({
  index,
  title,
  body,
  children,
  isMobile,
}: {
  index: number;
  title: string;
  body: string;
  children: React.ReactNode;
  isMobile: boolean;
}) {
  return (
    <Reveal delay={index * 110}>
      <div
        style={{
          background: WHITE,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 20,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Product surface, inset on the canvas tone so it reads as a screen
            rather than as more page. */}
        <div
          style={{
            background: CANVAS,
            borderBottom: `1px solid ${HAIRLINE}`,
            padding: isMobile ? 16 : 18,
            // Fixed, not min: the three product surfaces have different natural
            // heights, and the captions below them must sit on one line.
            height: isMobile ? 300 : 324,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {children}
        </div>

        <div style={{ padding: isMobile ? "18px 18px 20px" : "20px 22px 24px" }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: GREY_LIGHT, marginBottom: 10 }}>
            [{index + 1}]
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.012em" }}>
            {title}
          </h3>
          <p style={{ fontSize: 13.5, color: GREY, lineHeight: 1.65, margin: "8px 0 0" }}>
            {body}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/** Compact stability read, in the results page's own vocabulary. */
function StabilityPanel({ t, score }: { t: ThemeConfig; score: number }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: GREY,
          }}
        >
          Financial health
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: EV_800 }}>Strong</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 18 }}>
        <span
          style={{
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: INK,
            fontFamily: MONO_FONT_STACK,
            fontFeatureSettings: "'tnum','zero'",
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 15, color: GREY_LIGHT, fontFamily: MONO_FONT_STACK }}>/100</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {SCORE_BARS.map((bar, i) => (
          <div key={bar.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: t.text }}>{bar.label}</span>
              <span
                style={{
                  fontSize: 11.5,
                  color: GREY,
                  fontFamily: MONO_FONT_STACK,
                  fontFeatureSettings: "'tnum','zero'",
                }}
              >
                {bar.value}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: HAIRLINE, overflow: "hidden" }}>
              {/* Fills sweep in on the same curve the dashboard bars use. */}
              <div
                className="lp-bar-fill"
                style={{
                  height: "100%",
                  width: `${bar.value}%`,
                  borderRadius: 3,
                  background: [EV_800, EV_500, "#74C69D", "#95D5B2"][i],
                  ["--lp-delay" as string]: `${140 + i * 90}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilitiesSection({ isMobile, t }: CapabilitiesSectionProps) {
  const [chartsRef, chartsInView] = useInViewOnce<HTMLDivElement>();

  return (
    <section
      id="overview"
      style={{
        background: WHITE,
        padding: isMobile ? "72px 20px" : "120px 40px",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <Reveal>
          <div style={pillLabel}>What you get</div>

          <div
            style={{
              display: isMobile ? "block" : "grid",
              gridTemplateColumns: "1.35fr 1fr",
              gap: 56,
              alignItems: "end",
              marginTop: 28,
            }}
          >
            <h2
              style={{
                fontSize: isMobile ? 30 : 46,
                lineHeight: 1.1,
                letterSpacing: "-0.032em",
                fontWeight: 600,
                color: INK,
                margin: 0,
              }}
            >
              Clarity and control over
              <br />
              every part of your money
            </h2>
            <p
              style={{
                fontSize: 14.5,
                color: GREY,
                lineHeight: 1.65,
                margin: isMobile ? "16px 0 0" : 0,
                maxWidth: 380,
              }}
            >
              One calculation turns scattered expenses into a structured view: what you
              need to earn, how stable you are, and what to change first.
            </p>
          </div>
        </Reveal>

        {/* The three capabilities, each shown as the surface it actually is */}
        <div
          ref={chartsRef}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 16 : 20,
            marginTop: isMobile ? 44 : 64,
            alignItems: "stretch",
          }}
        >
          <CapabilityCard
            index={0}
            isMobile={isMobile}
            title="Your required income"
            body="Rent, debt, food, savings target and tax rate resolve into a single gross figure. No guessing at what enough means."
          >
            {chartsInView && (
              <IncomeBarChart
                t={t}
                isDark={false}
                currentIncome={EXAMPLE.currentMonthly}
                requiredIncome={EXAMPLE.requiredMonthly}
                isMobile
              />
            )}
          </CapabilityCard>

          <CapabilityCard
            index={1}
            isMobile={isMobile}
            title="Health and stability"
            body="Runway, debt ratio and savings rate combine into one score you can watch move as your situation changes."
          >
            {chartsInView && <StabilityPanel t={t} score={EXAMPLE.score} />}
          </CapabilityCard>

          <CapabilityCard
            index={2}
            isMobile={isMobile}
            title="The move that matters"
            body="Every possible change ranked by real dollar impact, so you spend effort where it actually shifts the number."
          >
            {chartsInView && (
              <TopMoveCard
                t={t}
                category={EXAMPLE.topCategory}
                amount={EXAMPLE.topAmount}
                percentOfTotal={EXAMPLE.topPercent}
                suggestion={`${EXAMPLE.topCategory} is your largest expense at ${EXAMPLE.topPercent}% of budget. Trimming it moves the number most.`}
              />
            )}
          </CapabilityCard>
        </div>

        <Reveal>
          <p style={{ fontSize: 12, color: GREY_LIGHT, margin: "20px 0 0" }}>
            Figures shown are an illustrative example, not a real user's result.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
