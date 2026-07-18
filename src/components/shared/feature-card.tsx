import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  featured?: boolean;
  children?: React.ReactNode;
}

export function FeatureCard({
  title,
  description,
  icon,
  className,
  featured,
  children,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl md:p-8",
        featured && "bg-gradient-to-br from-primary/5 to-secondary/5",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-text-light">
          {icon}
        </div>
      )}
      <h3 className="font-[family-name:var(--font-sora)] text-xl font-bold text-text-dark md:text-2xl">
        {title}
      </h3>
      <p className="mt-2 font-[family-name:var(--font-nunito)] text-base leading-relaxed text-text-muted">
        {description}
      </p>
      {children}
    </article>
  );
}
