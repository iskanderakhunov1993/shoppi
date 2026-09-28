"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades a section in as it enters the viewport — no animation library,
 * just an IntersectionObserver flipping a class. Renders fully visible
 * until JS confirms it can animate, so a slow script load or a non-JS
 * crawler never gets a permanently invisible section; only once
 * hydrated does it drop to hidden-until-scrolled-to (or stay visible
 * outright under `prefers-reduced-motion: reduce`).
 */
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    // Already on screen at mount (tall viewport, deep-linked anchor) —
    // nothing to reveal, so don't hide it first just to fade it back in.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;
    setHidden(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        hidden ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
