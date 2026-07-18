import { audiences } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { LandingIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function AudienceStrip() {
  return (
    <section
      className="relative bg-surface-light py-16 md:py-20"
      aria-labelledby="audience-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="audience-heading"
          title="Uma plataforma para diferentes formas de ensinar."
          align="center"
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <li key={audience.id}>
              <article
                className={cn(
                  "group relative h-full rounded-[var(--radius-card)] border border-border-light bg-background-light p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg",
                )}
              >
                <div
                  className="absolute -top-px left-6 h-px w-8 bg-gradient-to-r from-primary to-secondary opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <LandingIcon name={audience.icon} className="size-6" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-sora)] text-lg font-bold text-text-dark">
                  {audience.name}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-nunito)] text-sm leading-relaxed text-text-muted">
                  {audience.description}
                </p>
                <span className="sr-only">
                  Público {index + 1} de {audiences.length}
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
