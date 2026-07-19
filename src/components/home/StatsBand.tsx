"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Animated counters band. Numbers count up when scrolled into view.
 * The animation writes straight to the DOM node (no per-frame re-renders).
 */

interface Stat {
  value: number | null;
  display?: string; // used verbatim when value is null (non-numeric stats)
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 5, label: "exchanges streamed live" },
  { value: 100, suffix: "+", label: "markets with live pages" },
  { value: null, display: "24/7", label: "real-time streaming" },
  { value: null, display: "$0", label: "free · no sign-up" },
];

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView || stat.value === null) return;
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, stat.value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${stat.suffix ?? ""}`;
      },
    });
    return () => controls.stop();
  }, [inView, stat.value, stat.suffix]);

  return (
    <span ref={ref} className="font-mono text-4xl font-bold tabular-nums text-foreground">
      {stat.value === null ? stat.display : `0${stat.suffix ?? ""}`}
    </span>
  );
}

export default function StatsBand() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1.5 bg-card px-6 py-8 text-center">
          <Counter stat={s} />
          <span className="text-sm text-muted-foreground">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
