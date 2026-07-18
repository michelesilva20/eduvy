import type { ActivityItem } from "@/types/platform";
import { BookOpen, Award, ClipboardCheck, PenLine, UserPlus } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "user-plus": UserPlus,
  "book-open": BookOpen,
  "pen-line": PenLine,
  "clipboard-check": ClipboardCheck,
  award: Award,
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-soft">
      <h2 className="mb-4 font-[family-name:var(--font-sora)] text-lg font-bold text-[#3d3654]">
        Atividades recentes
      </h2>
      <ol className="space-y-4">
        {items.map((item, index) => {
          const Icon = iconMap[item.icon] ?? BookOpen;
          return (
            <li key={item.id} className="relative flex gap-3 pl-1">
              {index < items.length - 1 && (
                <span className="absolute left-[1.125rem] top-8 h-[calc(100%+0.5rem)] w-px bg-border-light" aria-hidden />
              )}
              <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-sm font-semibold text-[#3d3654]">{item.title}</p>
                <p className="text-xs text-text-muted">{item.description}</p>
                <time className="mt-1 block text-[10px] text-text-muted">{item.timestamp}</time>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
