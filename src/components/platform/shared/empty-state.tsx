import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-background-soft px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-background-purple-soft text-primary">
        <Inbox className="size-7" aria-hidden />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
