"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EduvyModule } from "@/types/landing";
import { moduleCategoryLabels } from "@/data/landing";
import { LandingIcon } from "@/lib/icons";

interface ModuleCardProps {
  module: EduvyModule;
  className?: string;
  onSelect?: (id: string) => void;
  selected?: boolean;
}

export function ModuleCard({
  module,
  className,
  onSelect,
  selected,
}: ModuleCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl md:p-6",
        selected && "border-primary ring-2 ring-primary/20",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <LandingIcon name={module.icon} className="size-5" />
        </div>
        <span className="rounded-full bg-background-light px-2.5 py-1 text-xs font-semibold text-text-muted">
          {moduleCategoryLabels[module.category]}
        </span>
      </div>
      <h3 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-dark">
        {module.name}
      </h3>
      <p className="mt-2 flex-1 font-[family-name:var(--font-nunito)] text-sm leading-relaxed text-text-muted">
        {module.description}
      </p>
      <button
        type="button"
        onClick={() => onSelect?.(module.id)}
        className="focus-ring mt-4 inline-flex items-center gap-1 self-start rounded-full px-1 py-1 font-[family-name:var(--font-nunito)] text-sm font-semibold text-primary transition-colors hover:text-primary-bright"
        aria-pressed={selected}
      >
        Conhecer módulo
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </button>
    </article>
  );
}
