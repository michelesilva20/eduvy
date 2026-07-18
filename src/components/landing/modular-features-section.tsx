"use client";

import { useMemo, useState } from "react";
import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { eduvyModules, moduleCategoryLabels } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { ModuleCard } from "@/components/shared/module-card";
import { cn } from "@/lib/utils";
import type { EduvyModule } from "@/types/landing";

type FilterCategory = "all" | EduvyModule["category"];

const filters: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "avaliacao", label: moduleCategoryLabels.avaliacao },
  { id: "engajamento", label: moduleCategoryLabels.engajamento },
  { id: "gestao", label: moduleCategoryLabels.gestao },
  { id: "personalizacao", label: moduleCategoryLabels.personalizacao },
];

export function ModularFeaturesSection() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const filteredModules = useMemo(
    () =>
      activeFilter === "all"
        ? eduvyModules
        : eduvyModules.filter((m) => m.category === activeFilter),
    [activeFilter],
  );

  return (
    <section
      id="modulos"
      className="relative overflow-hidden bg-background py-20 md:py-28"
      aria-labelledby="modules-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="modules-heading"
          title="Comece com o essencial. Expanda quando precisar."
          description="A Eduvy cresce junto com sua operação. Adicione módulos conforme seus objetivos, público e estratégia."
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <EduvyIllustration
            asset={eduvyAssets.illustrations.modules}
            sizes="(max-width: 768px) 90vw, 768px"
          />
        </div>

        <div
          className="mt-10 flex flex-wrap justify-center gap-2"
          role="group"
          aria-label="Filtrar módulos por categoria"
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={activeFilter === filter.id}
              className={cn(
                "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-all",
                activeFilter === filter.id
                  ? "bg-primary text-text-light shadow-lg shadow-primary/20"
                  : "border border-border bg-surface text-text-muted hover:border-primary/25 hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredModules.map((mod) => (
            <li key={mod.id}>
              <ModuleCard
                module={mod}
                selected={selectedModule === mod.id}
                onSelect={setSelectedModule}
              />
            </li>
          ))}
        </ul>

        {filteredModules.length === 0 && (
          <p className="mt-8 text-center text-text-muted">
            Nenhum módulo nesta categoria.
          </p>
        )}
      </div>
    </section>
  );
}
