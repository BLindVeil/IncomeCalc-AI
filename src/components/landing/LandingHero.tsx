import { useState, useEffect, useRef, type CSSProperties } from "react";
import { WHITE, INK, eyebrow, FONT_STACK } from "./landing-theme";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Per-element entrance delay as the shared --lp-delay custom property. */
const delay = (ms: number) => ({ ["--lp-delay" as string]: `${ms}ms` }) as CSSProperties;
import { PillButton } from "./PillButton";
import { HeroTopNav } from "./hero/HeroTopNav";
import { HeroDashboardMockup } from "./HeroDashboardMockup";

type BP = "mobile" | "tablet" | "desktop";

function useHeroBreakpoint(): BP {
  const [bp, setBp] = useState<BP>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const w = window.innerWidth;
        if (w < 768) setBp("mobile");
        else if (w < 1024) setBp("tablet");
        else setBp("desktop");
      }, 150);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return bp;
}

/**
 * The scrim is a legibility device, not decoration: it holds white type above
 * 4.5:1 across the headline band while leaving the summit and the mist below it
 * at full luminance. Built from EV_900, the palette's own darkest green, so the
 * darkening reads as deeper forest rather than as grey wash.
 */
const SCRIM_TOP =
  "linear-gradient(180deg," +
  " rgba(8,28,21,0.74) 0%," +
  " rgba(8,28,21,0.68) 28%," +
  " rgba(8,28,21,0.52) 46%," +
  " rgba(8,28,21,0.22) 62%," +
  " rgba(8,28,21,0.04) 78%," +
  " rgba(8,28,21,0) 88%)";

/**
 * A second, side-weighted pass. Text lives on the left two thirds, so the
 * darkening leans that way and lets the lit right flank of the range keep its
 * dawn highlight instead of washing the whole frame down.
 */
const SCRIM_SIDE =
  "linear-gradient(100deg," +
  " rgba(8,28,21,0.42) 0%," +
  " rgba(8,28,21,0.20) 44%," +
  " rgba(8,28,21,0) 74%)";

/**
 * The cloud loop, layered over the still on the exact same geometry.
 *
 * The still stays mounted underneath and remains the LCP element — the video is
 * never given a `src` until the browser is idle, so it cannot compete for
 * bandwidth with the image or the bundle. Its first frame is the still, so the
 * short fade covers only encoder colour drift, not a change of picture. If
 * autoplay is refused (data saver, battery saver) the still simply stays.
 */
function HeroCloudLayer({ style }: { style: CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = () => {
      el.muted = true; // React sets muted as a property; autoplay policies read the attribute
      // Sources carry their URL in data-src so nothing is fetched until here.
      let attached = false;
      el.querySelectorAll("source").forEach((s) => {
        const url = s.dataset.src;
        if (url) {
          s.src = url;
          attached = true;
        }
      });
      if (!attached) return;
      el.load();
      el.play().catch(() => {});
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 1400);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
      style={{
        ...style,
        opacity: playing ? 1 : 0,
        transition: "opacity 900ms ease",
      }}
    >
      {/* VP9 first (smaller, and what Chrome and Firefox pick), H.264 for Safari. */}
      <source data-src="/img/hero-clouds.webm" type="video/webm" />
      <source data-src="/img/hero-clouds.mp4" type="video/mp4" />
    </video>
  );
}

interface LandingHeroProps {
  onStart: () => void;
  onSignIn?: () => void;
  isSignedIn?: boolean;
  userName?: string;
  onDashboard?: () => void;
  onSignOut?: () => void;
}

export function LandingHero({ onStart, onSignIn, isSignedIn, userName, onDashboard, onSignOut }: LandingHeroProps) {
  const bp = useHeroBreakpoint();
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";
  const reducedMotion = usePrefersReducedMotion();

  const bandHeight = isMobile ? 620 : bp === "tablet" ? 660 : 720;

  // One geometry, shared by the still and the loop, so the two register exactly
  // and the fade between them reads as the picture coming alive rather than moving.
  const backdrop: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    transform: isMobile ? "scale(1.32)" : "scale(1.3)",
    transformOrigin: isMobile ? "58% top" : "center top",
    zIndex: -2,
  };

  return (
    <header
      style={{
        width: "100%",
        background: WHITE,
        padding: isMobile ? "0 0 0" : "16px 24px 0",
        color: INK,
        fontFamily: FONT_STACK,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1352, margin: "0 auto" }}>
        {/* ── The photographic band ─────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            minHeight: bandHeight,
            borderRadius: isMobile ? 0 : 28,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            isolation: "isolate",
          }}
        >
          {/* Summit photograph. Anchored low so the peak stays in frame as the
              band gets shorter; the sky is what the crop gives up first. */}
          <picture>
            <source
              type="image/webp"
              srcSet="/img/hero-summit-sm.webp 1400w, /img/hero-summit.webp 2400w"
              sizes="(max-width: 768px) 100vw, 1352px"
            />
            <img
              src="/img/hero-summit.jpg"
              srcSet="/img/hero-summit-sm.jpg 1400w, /img/hero-summit.jpg 2400w"
              sizes="(max-width: 768px) 100vw, 1352px"
              alt="A forested summit rising through a sea of cloud at dawn"
              fetchPriority="high"
              decoding="async"
              style={backdrop}
            />
          </picture>
          {!reducedMotion && <HeroCloudLayer style={backdrop} />}
          <div style={{ position: "absolute", inset: 0, background: SCRIM_TOP, zIndex: -1 }} />
          <div style={{ position: "absolute", inset: 0, background: SCRIM_SIDE, zIndex: -1 }} />

          <div
            data-hero-copy
            style={{
              padding: isMobile ? "18px 20px 0" : "22px 40px 0",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <HeroTopNav
              isMobile={isMobile}
              showLinks={isDesktop}
              onDark
              onStart={onStart}
              onSignIn={onSignIn}
              isSignedIn={isSignedIn}
              userName={userName}
              onDashboard={onDashboard}
              onSignOut={onSignOut}
            />

            <div style={{ height: isMobile ? 56 : 82 }} />

            {/* Headline left, the argument and the action right — the split lets
                the display type run at full size without crowding the prose. */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "minmax(0, 1.15fr) minmax(0, 0.85fr)" : "1fr",
                gap: isDesktop ? 48 : 28,
                alignItems: "start",
                maxWidth: isDesktop ? "none" : 620,
              }}
            >
              <div>
                <div
                  className="lp-in"
                  style={{ ...eyebrow, color: "rgba(255,255,255,0.68)", ...delay(40) }}
                >
                  Personal finance, clarified
                </div>

                <h1
                  className="lp-in"
                  style={{
                    fontSize: isMobile ? 40 : bp === "tablet" ? 58 : 74,
                    lineHeight: 1.03,
                    letterSpacing: "-0.038em",
                    fontWeight: 600,
                    margin: `${isMobile ? 16 : 20}px 0 0`,
                    textWrap: "balance",
                    ...delay(120),
                  }}
                >
                  <span style={{ display: "block", color: "rgba(255,255,255,0.62)" }}>
                    Peace of mind starts
                  </span>
                  <span style={{ display: "block", color: WHITE }}>with one number</span>
                </h1>
              </div>

              <div style={{ paddingTop: isDesktop ? 14 : 0 }}>
                <p
                  className="lp-in"
                  style={{
                    fontSize: isMobile ? 15.5 : 16.5,
                    color: "rgba(255,255,255,0.84)",
                    lineHeight: 1.6,
                    maxWidth: 460,
                    margin: 0,
                    ...delay(220),
                  }}
                >
                  Enter your expenses and get the income you actually need, your financial
                  health score, and the one move that changes the most.
                </p>

                <div className="lp-in" style={{ marginTop: isMobile ? 20 : 24, ...delay(300) }}>
                  {/* The qualifier sits above the control: lower down the frame
                      the scrim has released the cloud to full brightness, and
                      12.5px type cannot hold its contrast there. */}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: WHITE,
                      marginBottom: 14,
                    }}
                  >
                    Free forever. No bank linking, no credit pull.
                  </div>
                  <PillButton size="lg" tone="light" onClick={onStart}>
                    Calculate my number
                  </PillButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product preview, lifted into the photograph's lower edge ───── */}
        <div
          className={isMobile ? undefined : "lp-parallax-scroll"}
          style={{
            ["--lp-par" as string]: "-30px",
            marginTop: isMobile ? -64 : -104,
            position: "relative",
            zIndex: 1,
            padding: isMobile ? "0 12px" : 0,
          }}
        >
          <div
            className="lp-in"
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              borderRadius: 14,
              padding: 7,
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 40px 90px -28px rgba(8,28,21,0.45)",
              boxSizing: "border-box",
              ...delay(420),
            }}
          >
            <HeroDashboardMockup isMobile={isMobile} />
          </div>
        </div>
      </div>
    </header>
  );
}
