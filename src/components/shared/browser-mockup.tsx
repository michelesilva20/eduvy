import { cn } from "@/lib/utils";

interface BrowserMockupProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function BrowserMockup({
  children,
  className,
  title = "eduvy.app",
}: BrowserMockupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface-light shadow-2xl shadow-primary/10",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border-light bg-background-light px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-achievement/80" />
          <span className="size-3 rounded-full bg-secondary/80" />
        </div>
        <div className="mx-auto rounded-full bg-white px-4 py-1 text-xs text-text-muted">
          {title}
        </div>
      </div>
      <div className="bg-background-light">{children}</div>
    </div>
  );
}
