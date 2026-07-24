import { WHITE, INK, GREY, GREY_LIGHT, HAIRLINE, MONO, pillLabel, RADIUS_IMG } from "./landing-theme";
import { Reveal } from "./Reveal";

interface CapabilitiesSectionProps {
  isMobile: boolean;
}

const COLUMNS = [
  {
    title: "Your required income",
    body: "Rent, debt, food, savings target and tax rate resolve into a single gross figure. No guessing at what enough means.",
  },
  {
    title: "Health and stability",
    body: "Runway, debt ratio and savings rate combine into one score you can watch move as your situation changes.",
  },
  {
    title: "The move that matters",
    body: "Every possible change ranked by real dollar impact, so you spend effort where it actually shifts the number.",
  },
];

const CARDS = [
  { src: "/img/card-moss.jpg", stat: "$6,840", label: "Required monthly income" },
  { src: "/img/card-field.jpg", stat: "82", label: "Stability score" },
  { src: "/img/card-mist.jpg", stat: "-$400", label: "Tested in scenarios" },
];

export function CapabilitiesSection({ isMobile }: CapabilitiesSectionProps) {
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

        {/* Numbered columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 30 : 40,
            marginTop: isMobile ? 44 : 72,
            paddingTop: 28,
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          {COLUMNS.map((col, i) => (
            <Reveal key={col.title} delay={i * 90}>
              <div style={{ fontFamily: MONO, fontSize: 11.5, color: GREY_LIGHT, marginBottom: 12 }}>
                [{i + 1}]
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: INK, margin: 0, letterSpacing: "-0.012em" }}>
                {col.title}
              </h3>
              <p style={{ fontSize: 13.5, color: GREY, lineHeight: 1.65, marginTop: 8, marginBottom: 0 }}>
                {col.body}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Photographic cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 14 : 20,
            marginTop: isMobile ? 32 : 48,
          }}
        >
          {CARDS.map((card, i) => (
            <Reveal key={card.label} delay={i * 110}>
              <div
                className="lp-card lp-zoom"
                style={{
                  position: "relative",
                  borderRadius: RADIUS_IMG,
                  overflow: "hidden",
                  aspectRatio: isMobile ? "16 / 10" : "4 / 5",
                }}
              >
                <img
                  src={card.src}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Floating readout, echoing the product surface over photography */}
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 16,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.82)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.7)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      color: INK,
                      fontFamily: MONO,
                      fontFeatureSettings: "'tnum','zero'",
                    }}
                  >
                    {card.stat}
                  </div>
                  <div style={{ fontSize: 11.5, color: GREY, marginTop: 2 }}>{card.label}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
