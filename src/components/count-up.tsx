"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function format(value: number, kind: "cop" | "percent") {
  return kind === "cop" ? cop.format(value) : `${Math.round(value)}%`;
}

export function CountUp({
  value,
  kind = "cop",
  className,
}: {
  value: number;
  kind?: "cop" | "percent";
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v, kind);
      },
    });
    return () => controls.stop();
  }, [value, kind]);

  return (
    <span ref={ref} className={className}>
      {format(value, kind)}
    </span>
  );
}
