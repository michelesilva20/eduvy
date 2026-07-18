"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Check } from "lucide-react";
import { useCases } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { BrowserMockup } from "@/components/shared/browser-mockup";
import { cn } from "@/lib/utils";

export function UseCasesSection() {
  return (
    <section
      id="solucoes"
      className="bg-background-light py-20 md:py-28"
      aria-labelledby="usecases-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="usecases-heading"
          title="Adaptada ao contexto de quem ensina."
          description="Empresas, cursinhos, escolas e professores usam a mesma base modular com configurações diferentes."
        />

        <Tabs.Root defaultValue={useCases[0].id} className="mt-14">
          <Tabs.List
            className="flex flex-wrap justify-center gap-2"
            aria-label="Casos de uso"
          >
            {useCases.map((useCase) => (
              <Tabs.Trigger
                key={useCase.id}
                value={useCase.id}
                className={cn(
                  "focus-ring rounded-full px-5 py-2.5 font-[family-name:var(--font-nunito)] text-sm font-semibold transition-all",
                  "data-[state=active]:bg-primary data-[state=active]:text-text-light data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25",
                  "data-[state=inactive]:border data-[state=inactive]:border-border-light data-[state=inactive]:bg-surface-light data-[state=inactive]:text-text-muted data-[state=inactive]:hover:border-primary/30",
                )}
              >
                {useCase.tabLabel}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {useCases.map((useCase) => (
            <Tabs.Content
              key={useCase.id}
              value={useCase.id}
              className="mt-10 focus:outline-none"
            >
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <h3 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-text-dark md:text-3xl">
                    {useCase.title}
                  </h3>
                  <ul className="mt-6 space-y-3">
                    {useCase.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 font-[family-name:var(--font-nunito)] text-base text-text-dark"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" aria-hidden />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <BrowserMockup title={`eduvy.app/${useCase.id}`}>
                  <div className="p-6">
                    <p className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-dark">
                      {useCase.illustration.headline}
                    </p>
                    <dl className="mt-6 grid grid-cols-3 gap-4">
                      {useCase.illustration.metrics.map((metric) => (
                        <div key={metric.label}>
                          <dt className="text-xs text-text-muted">
                            {metric.label}
                          </dt>
                          <dd className="font-[family-name:var(--font-sora)] text-xl font-bold text-primary">
                            {metric.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-6 h-24 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
                      <p className="text-xs font-semibold text-text-muted">
                        Evolução demonstrativa
                      </p>
                      <div className="mt-2 flex items-end gap-1">
                        {[30, 45, 40, 60, 55, 75, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-primary/60"
                            style={{ height: `${h * 0.25}px` }}
                            aria-hidden
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </BrowserMockup>
              </div>
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}
