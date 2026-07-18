import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { StatMetric } from "@/types/platform";
import { cn } from "@/lib/utils";

const trendConfig = {
  up: { icon: ArrowUp, className: "text-success" },
  down: { icon: ArrowDown, className: "text-warning" },
  neutral: { icon: Minus, className: "text-text-muted" },
};

export function StatCard({ metric }: { metric: StatMetric }) {
  const trend = trendConfig[metric.trend];
  const TrendIcon = trend.icon;

  return (
    <article
      className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft transition-shadow hover:shadow-card"
      title={metric.hint}
    >
      <p className="text-sm text-text-muted">{metric.label}</p>
      <p className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary">
        {metric.value}
      </p>
      <p className={cn("mt-1 flex items-center gap-1 text-xs font-semibold", trend.className)}>
        <TrendIcon className="size-3" aria-hidden />
        {metric.change}
      </p>
    </article>
  );
}
