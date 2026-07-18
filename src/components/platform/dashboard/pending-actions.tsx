import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import type { PendingAction } from "@/types/platform";
import { cn } from "@/lib/utils";

const priorityStyles = {
  high: "border-red-200 bg-red-50/50",
  medium: "border-amber-200 bg-amber-50/50",
  low: "border-border-light bg-surface-light",
};

export function PendingActionsList({ items }: { items: PendingAction[] }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-[#3d3654]">
          Ações necessárias
        </h2>
        <AlertCircle className="size-5 text-amber-600" aria-hidden />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "focus-ring flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-primary/30",
                priorityStyles[item.priority],
              )}
            >
              <div>
                <p className="text-sm font-semibold text-[#3d3654]">{item.title}</p>
                <p className="text-xs text-text-muted">{item.count} itens</p>
              </div>
              <ChevronRight className="size-4 text-text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
