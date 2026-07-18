import { cn } from "@/lib/utils";

export function PlatformCard({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface shadow-soft",
        interactive && "transition-shadow hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PlatformCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <h2 className="font-[family-name:var(--font-sora)] text-base font-bold text-text-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PlatformCardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
