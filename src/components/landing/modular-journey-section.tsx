"use client";

import { useEffect, useRef, useState } from "react";
import { modularSteps } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function ModularJourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);
  const displayProgress = reducedMotion ? 100 : progress;

  useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.8;
      const end = -rect.height * 0.3;
      const raw = (start - rect.top) / (start - end);
      setProgress(Math.min(100, Math.max(0, raw * 100)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative bg-surface-light py-20 md:py-28"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="journey-heading"
          title="Sua plataforma não precisa começar complexa."
          description="Evolua em etapas naturais — do essencial à personalização completa."
        />

        <div className="relative mt-16">
          <div
            className="absolute bottom-4 left-[1.65rem] top-4 w-0.5 bg-border-light md:left-8"
            aria-hidden
          >
            <div
              className="w-full bg-gradient-to-b from-primary via-secondary to-achievement transition-all duration-300"
              style={{ height: `${displayProgress}%` }}
            />
          </div>

          <ol className="space-y-8">
            {modularSteps.map((step) => (
              <li key={step.id} className="relative pl-16 md:pl-20">
                <div
                  className={cn(
                    "absolute left-3 top-6 z-10 flex size-8 items-center justify-center rounded-full border-4 border-surface-light font-[family-name:var(--font-sora)] text-sm font-bold text-white shadow-md md:left-6 md:size-10 md:text-base",
                    displayProgress >= (step.step / modularSteps.length) * 100 - 5
                      ? "bg-primary"
                      : "bg-text-muted/40",
                  )}
                  aria-hidden
                >
                  {step.step}
                </div>

                <article className="rounded-[var(--radius-card)] border border-border-light bg-background-light p-6 shadow-md md:p-8">
                  <h3 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-text-dark">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-[family-name:var(--font-nunito)] text-text-muted">
                    {step.description}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {step.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border-light bg-surface-light px-3 py-1 text-sm font-semibold text-text-dark"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
