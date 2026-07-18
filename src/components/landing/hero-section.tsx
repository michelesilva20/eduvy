import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { Button } from "@/components/ui/button";

const indicators = ["Cursos", "Gamificação", "Analytics", "Módulos adicionais"];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden hero-bg pb-16 pt-8 md:pb-24 md:pt-12"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute -right-20 top-10 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <p className="inline-flex items-center rounded-full border border-primary/15 bg-surface/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Plataforma modular de aprendizagem
            </p>

            <h1
              id="hero-heading"
              className="mt-6 font-[family-name:var(--font-sora)] text-[2rem] font-bold leading-[1.12] tracking-tight text-text-primary sm:text-5xl lg:text-[3.125rem]"
            >
              Transforme conhecimento em{" "}
              <span className="relative inline-block text-primary">
                evolução
                <span
                  className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/25"
                  aria-hidden
                />
              </span>
              .
            </h1>

            <p className="mt-6 text-base leading-relaxed text-text-secondary md:text-lg">
              Crie cursos, desenvolva habilidades e acompanhe cada conquista em uma
              plataforma feita para empresas, escolas e especialistas.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" asChild className="group w-full sm:w-auto">
                <Link href="#cta-final">
                  Criar minha plataforma
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
                <Link href="#plataforma">Explorar a Eduvy</Link>
              </Button>
            </div>

            <p className="mt-5 text-sm text-text-muted">
              Comece com o essencial e adicione novos módulos quando precisar.
            </p>

            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {indicators.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-secondary"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <EduvyIllustration
              asset={eduvyAssets.illustrations.learningJourney}
              priority
              sizes="(max-width: 1024px) 90vw, 50vw"
              className="animate-float"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
