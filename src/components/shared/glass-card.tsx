import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export function GlassCard({ children, className, dark = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border backdrop-blur-xl",
        dark
          ? "border-white/10 bg-glass-dark"
          : "border-border-light bg-glass-light shadow-xl shadow-primary/5",
        className,
      )}
    >
      {children}
    </div>
  );
}
