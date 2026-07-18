"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { analyticsMetrics, skills } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

const trendIcons = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};

export function AnalyticsSection() {
  return (
    <section
      id="analytics"
      className="bg-background-soft py-20 md:py-28"
      aria-labelledby="analytics-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="analytics-heading"
          title="Veja mais do que notas. Entenda a evolução."
          description="Acompanhe participação, desempenho, domínio de habilidades e pontos de atenção em uma visão clara."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-card">
            <dl className="grid grid-cols-2 gap-4">
              {analyticsMetrics.map((metric) => {
                const TrendIcon = trendIcons[metric.trend ?? "neutral"];
                return (
                  <div key={metric.id} className="rounded-2xl border border-border bg-background-soft p-4">
                    <dt className="text-xs text-text-muted">{metric.label}</dt>
                    <dd className="mt-1 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">
                      {metric.value}
                    </dd>
                    {metric.change && (
                      <p
                        className={cn(
                          "mt-1 flex items-center gap-0.5 text-xs font-semibold",
                          metric.trend === "up" && "text-success",
                          metric.trend === "down" && "text-red-500",
                          metric.trend === "neutral" && "text-text-muted",
                        )}
                      >
                        <TrendIcon className="size-3" aria-hidden />
                        {metric.change}
                      </p>
                    )}
                  </div>
                );
              })}
            </dl>

            <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <p className="font-[family-name:var(--font-sora)] text-sm font-bold text-text-primary">
                Mapa de habilidades
              </p>
              <ul className="relative mt-4 flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <li key={skill.id}>
                    <span className="inline-flex flex-col items-center rounded-2xl border border-border bg-background-purple-soft px-3 py-2 text-center">
                      <span className="font-[family-name:var(--font-sora)] text-sm font-bold text-primary">
                        {skill.level}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold text-text-secondary">{skill.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <EduvyIllustration
            asset={eduvyAssets.illustrations.analytics}
            sizes="(max-width: 1024px) 90vw, 45vw"
          />
        </div>
      </div>
    </section>
  );
}
