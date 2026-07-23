import { useState, useEffect } from "react";

interface PillDef {
  label: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

const PILLS: PillDef[] = [
  { label: "Required income", top: "-6px", left: "8%" },
  { label: "Health score", top: "-6px", right: "12%" },
  { label: "Scenario testing", top: "25%", right: "-14px" },
  { label: "AI diagnosis", top: "55%", right: "-20px" },
  { label: "Budget tracking", bottom: "-6px", right: "15%" },
  { label: "Top move", bottom: "-6px", left: "10%" },
  { label: "12-month forecast", top: "55%", left: "-18px" },
  { label: "Savings rate", top: "25%", left: "-12px" },
];

const VISIBLE_COUNT = 4;
const CYCLE_MS = 2500;

export function HeroAnimatedPills() {
  const [visibleSet, setVisibleSet] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (let i = 0; i < VISIBLE_COUNT; i++) s.add(i);
    return s;
  });

  useEffect(() => {
    let nextOut = VISIBLE_COUNT; // index of the next pill to swap in
    const interval = setInterval(() => {
      setVisibleSet((prev) => {
        const arr = Array.from(prev);
        const removeIdx = arr[0]; // remove oldest visible
        const addIdx = nextOut % PILLS.length;
        const next = new Set(prev);
        next.delete(removeIdx);
        next.add(addIdx);
        nextOut = (nextOut + 1) % PILLS.length;
        return next;
      });
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {PILLS.map((pill, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: pill.top,
            bottom: pill.bottom,
            left: pill.left,
            right: pill.right,
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(12,26,18,0.10)",
            borderRadius: 999,
            padding: "7px 15px",
            fontSize: 12,
            fontWeight: 500,
            color: "#31402F",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(27,67,50,0.10), inset 0 1px 0 rgba(255,255,255,0.65)",
            opacity: visibleSet.has(i) ? 1 : 0,
            transform: visibleSet.has(i) ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 500ms ease, transform 500ms cubic-bezier(0.23, 1, 0.32, 1)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {pill.label}
        </div>
      ))}
    </>
  );
}
