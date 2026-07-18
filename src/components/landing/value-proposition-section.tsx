import { Sparkles, Target, TrendingUp } from "lucide-react";
import { valuePillars } from "@/data/landing";
import { SectionHeading } from "@/components/shared/section-heading";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

const icons = {
  crie: Sparkles,
  engaje: Target,
  evolua: TrendingUp,
};

const gridPlacement: Record<string, string> = {
  crie: "lg:col-start-1 lg:row-start-1",
  engaje: "lg:col-start-1 lg:row-start-2",
  evolua: "lg:col-start-2 lg:col-span-2 lg:row-span-2 lg:row-start-1",
};

export function ValuePropositionSection() {
  return (
    <section
      className="relative overflow-hidden bg-background-light py-20 md:py-28"
      aria-labelledby="value-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="value-heading"
          title="Tudo começa com uma boa experiência de aprendizagem."
          description="A Eduvy conecta conteúdo, acompanhamento e motivação para que ensinar e aprender deixem de ser processos fragmentados."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 lg:gap-6">
          {valuePillars.map((pillar) => {
            const Icon = icons[pillar.id as keyof typeof icons];
            const isFeatured = pillar.featured;

            return (
              <article
                key={pillar.id}
                className={cn(
                  "rounded-[var(--radius-card)] border border-border-light bg-surface-light p-6 shadow-lg md:p-8",
                  !isFeatured && "transition-all hover:-translate-y-1 hover:shadow-xl",
                  isFeatured &&
                    "bg-gradient-to-br from-primary/5 via-surface-light to-secondary/5 shadow-xl md:p-10 lg:rounded-[var(--radius-lg)]",
                  gridPlacement[pillar.id],
                )}
              >
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-bold text-text-dark md:text-3xl">
                  {pillar.title}
                </h3>
                <p className="mt-3 font-[family-name:var(--font-nunito)] text-base leading-relaxed text-text-muted">
                  {pillar.description}
                </p>

                {isFeatured && (
                  <div className="mt-8 rounded-[var(--radius-card)] border border-border-light bg-background-light p-6">
                    <p className="font-[family-name:var(--font-nunito)] text-sm font-semibold text-text-muted">
                      Evolução da turma — últimos 30 dias
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-primary">
                          <AnimatedCounter value={78} suffix="%" />
                        </p>
                        <p className="text-xs text-text-muted">Participação</p>
                      </div>
                      <div>
                        <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-secondary">
                          <AnimatedCounter value={24} />
                        </p>
                        <p className="text-xs text-text-muted">Habilidades</p>
                      </div>
                      <div>
                        <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-achievement">
                          <AnimatedCounter value={156} />
                        </p>
                        <p className="text-xs text-text-muted">Conquistas</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-light">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary via-secondary to-achievement" />
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      Progresso médio da turma: 78%
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
