import { useEffect, useRef } from "react";
import { WHITE, INK, MINT, MONO, GLASS_DARK, GLASS_DARK_BORDER } from "./landing-theme";
import { Reveal } from "./Reveal";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface ComparisonSectionProps {
  isMobile: boolean;
}

/** Shared geometry for the backdrop, over-sized so parallax has room to drift. */
const BACKDROP: React.CSSProperties = {
  position: "absolute",
  top: "-14%",
  left: 0,
  width: "100%",
  height: "128%",
  objectFit: "cover",
  zIndex: 0,
  ["--lp-par-from" as string]: "-56px",
  ["--lp-par-to" as string]: "56px",
} as React.CSSProperties;

/**
 * The ambient loop is the same frame as `section-dark.jpg` - it was generated
 * from it - so the poster and the first video frame are identical and the swap
 * is invisible. Nothing downloads until the band is nearly in view.
 */
function AmbientBackdrop() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = () => {
      if (el.dataset.started) return;
      el.dataset.started = "true";
      // React sets `muted` as a property and never as an attribute, which some
      // autoplay policies read before allowing playback. Set it again here.
      el.muted = true;
      el.src = "/img/section-dark-loop.mp4";
      // Autoplay can still be refused (data saver, battery saver); the poster
      // stays up if it is, which is the correct fallback either way.
      el.play().catch(() => {});
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            start();
            io.disconnect();
          }
        }
      },
      { rootMargin: "200px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="lp-parallax"
      poster="/img/section-dark.jpg"
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      style={BACKDROP}
    />
  );
}

const ROWS = [
  "Required income, calculated from your real costs",
  "Financial health and stability score",
  "Scenarios tested before you commit",
  "Top move ranked by dollar impact",
  "Works without linking a bank account",
];

/** Which rows the alternative actually covers. */
const ALT_HAS = [false, false, true, false, false];

export function ComparisonSection({ isMobile }: ComparisonSectionProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="why"
      style={{
        position: "relative",
        padding: isMobile ? "80px 20px" : "128px 40px",
        overflow: "hidden",
        color: WHITE,
      }}
    >
      {/* Full-bleed backdrop, over-sized and drifting for parallax depth. Drops
          to the still frame when the user has asked for less motion. */}
      {reducedMotion ? (
        <img
          src="/img/section-dark.jpg"
          alt=""
          loading="lazy"
          className="lp-parallax"
          style={BACKDROP}
        />
      ) : (
        <AmbientBackdrop />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(180deg, rgba(8,14,11,0.86) 0%, rgba(8,14,11,0.72) 50%, rgba(8,14,11,0.90) 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <h2
            style={{
              fontSize: isMobile ? 30 : 46,
              lineHeight: 1.12,
              letterSpacing: "-0.032em",
              fontWeight: 600,
              textAlign: "center",
              margin: 0,
            }}
          >
            Built for real budgets.
            <br />
            Not another spreadsheet
          </h2>
          <p
            style={{
              fontSize: isMobile ? 14 : 15.5,
              color: "rgba(255,255,255,0.66)",
              lineHeight: 1.65,
              textAlign: "center",
              maxWidth: 520,
              margin: "18px auto 0",
            }}
          >
            Budgeting apps show you twelve dashboards and call it insight. Ascentra
            returns one number and one next move.
          </p>
        </Reveal>

        {/* Comparison: capability rows, us, them */}
        <Reveal
          delay={80}
          style={{
            marginTop: isMobile ? 40 : 64,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.7fr 0.62fr 0.62fr",
            gap: isMobile ? 12 : 0,
            alignItems: "stretch",
          }}
        >
          {/* Capability list */}
          <div
            style={{
              background: GLASS_DARK,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${GLASS_DARK_BORDER}`,
              borderRadius: isMobile ? 14 : "14px 0 0 14px",
              padding: isMobile ? "18px 18px" : "26px 28px",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.5)",
                marginBottom: 6,
              }}
            >
              Core capabilities
            </div>
            {ROWS.map((row) => (
              <div
                key={row}
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  fontSize: isMobile ? 13 : 14,
                  color: "rgba(255,255,255,0.9)",
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {row}
              </div>
            ))}
          </div>

          {/* Ascentra column - the single bright surface on the page */}
          <div
            style={{
              background: MINT,
              color: INK,
              borderRadius: isMobile ? 14 : 14,
              padding: isMobile ? "18px" : "26px 16px",
              textAlign: "center",
              boxShadow: "0 30px 70px -20px rgba(0,0,0,0.55)",
              transform: isMobile ? "none" : "scale(1.045)",
              zIndex: 3,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginBottom: 6,
                height: 21,
              }}
            >
              <img src="/logo-mark.svg" alt="" width={17} height={17} style={{ borderRadius: 4 }} />
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Ascentra</span>
            </div>
            {ROWS.map((row) => (
              <div
                key={row}
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(10,10,10,0.10)",
                }}
              >
                <svg width={17} height={17} viewBox="0 0 20 20" fill="none" aria-label="Included">
                  <path
                    d="M4 10.5 L 8 14.5 L 16 6"
                    stroke={INK}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* Alternative */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${GLASS_DARK_BORDER}`,
              borderRadius: isMobile ? 14 : "0 14px 14px 0",
              padding: isMobile ? "18px" : "26px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.62)",
                marginBottom: 6,
                height: 21,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Spreadsheet
            </div>
            {ROWS.map((row, i) => (
              <div
                key={row}
                style={{
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {ALT_HAS[i] ? (
                  <svg width={16} height={16} viewBox="0 0 20 20" fill="none" aria-label="Included">
                    <path
                      d="M4 10.5 L 8 14.5 L 16 6"
                      stroke="rgba(255,255,255,0.75)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  "Manual"
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* Cost line */}
        <Reveal
          delay={160}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Time to your first answer</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
              Measured from a blank start, no account required.
            </div>
          </div>
          <div style={{ display: "flex", gap: 36, fontFamily: MONO }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 19, fontWeight: 600 }}>60 sec</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Ascentra</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>An evening</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Spreadsheet</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
