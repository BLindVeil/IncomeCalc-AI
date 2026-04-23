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
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 500,
            color: "#374151",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            opacity: visibleSet.has(i) ? 1 : 0,
            transition: "opacity 400ms ease",
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
