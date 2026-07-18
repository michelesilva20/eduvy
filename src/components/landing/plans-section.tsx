"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  demoModuleChips,
  eduvyModules,
  pricingPlans,
} from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PlansSection() {
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "gamificacao",
  ]);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const selectedLabels = demoModuleChips
    .filter((c) => selectedModules.includes(c.id))
    .map((c) => c.label);

  return (
    <section
      id="planos"
      className="bg-surface-light py-20 md:py-28"
      aria-labelledby="plans-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="plans-heading"
          title="Planos que acompanham o crescimento da sua operação."
          description="Escolha a base ideal e componha sua solução com módulos adicionais."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-lg)] border p-8 transition-all",
                plan.highlighted
                  ? "border-primary bg-gradient-to-b from-primary/5 to-surface-light shadow-2xl shadow-primary/15 lg:scale-[1.02]"
                  : "border-border-light bg-background-light shadow-lg",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-text-light">
                  Mais popular
                </span>
              )}
              <h3 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-text-dark">
                {plan.name}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-nunito)] text-sm text-text-muted">
                {plan.description}
              </p>
              <p className="mt-4 font-[family-name:var(--font-sora)] text-lg font-semibold text-primary">
                Preços em definição
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-text-dark"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-secondary"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "default" : "secondary"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </article>
          ))}
        </div>

        {/* Module composer demo */}
        <div className="mt-16 rounded-[var(--radius-lg)] border border-border-light bg-background-light p-6 md:p-8">
          <p className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-dark">
            Adicione somente os módulos que sua operação precisa.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Demonstração — seleção ilustrativa, sem cálculo de preço.
          </p>

          <div
            className="mt-6 flex flex-wrap gap-2"
            role="group"
            aria-label="Selecionar módulos adicionais"
          >
            {demoModuleChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => toggleModule(chip.id)}
                aria-pressed={selectedModules.includes(chip.id)}
                className={cn(
                  "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-all",
                  selectedModules.includes(chip.id)
                    ? "bg-primary text-text-light shadow-md"
                    : "border border-border-light bg-surface-light text-text-muted hover:border-primary/30",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-surface-light p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" aria-hidden />
              <p className="font-[family-name:var(--font-sora)] font-bold text-text-dark">
                Sua composição demonstrativa
              </p>
            </div>
            <p className="mt-2 text-sm text-text-muted">
              <strong className="text-text-dark">Base:</strong> Eduvy Learning
              Core
              {selectedLabels.length > 0 && (
                <>
                  {" "}
                  +{" "}
                  <strong className="text-text-dark">
                    {selectedLabels.join(", ")}
                  </strong>
                </>
              )}
            </p>
            {selectedModules.length > 0 && (
              <ul className="mt-3 space-y-1">
                {selectedModules.map((id) => {
                  const mod = eduvyModules.find((m) => m.id === id);
                  return mod ? (
                    <li key={id} className="text-sm text-text-muted">
                      · {mod.name}: {mod.description}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
