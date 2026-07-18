import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 font-[family-name:var(--font-nunito)] text-xs font-bold uppercase tracking-[0.2em]",
            dark ? "text-primary-soft" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          "font-[family-name:var(--font-sora)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]",
          dark ? "text-text-light" : "text-text-dark",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 font-[family-name:var(--font-nunito)] text-base leading-relaxed md:text-lg",
            dark ? "text-text-light/75" : "text-text-muted",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
