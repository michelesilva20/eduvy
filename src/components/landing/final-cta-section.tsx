import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { Button } from "@/components/ui/button";

export function FinalCTASection() {
  return (
    <section
      id="cta-final"
      className="relative bg-background px-4 py-20 md:px-6 md:py-28 lg:px-8"
      aria-labelledby="final-cta-heading"
    >
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-lg)] cta-bg">
        <div className="grid items-center gap-8 p-8 md:p-12 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <h2
              id="final-cta-heading"
              className="font-[family-name:var(--font-sora)] text-3xl font-bold text-text-primary md:text-4xl"
            >
              O próximo nível da aprendizagem começa aqui.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary md:text-lg lg:mx-0">
              Crie uma experiência que evolui com seus alunos, sua equipe e seus objetivos.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button size="lg" asChild className="group w-full sm:w-auto">
                <Link href="#planos">
                  Criar minha plataforma
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Solicitar demonstração
              </Button>
            </div>
          </div>

          <EduvyIllustration
            asset={eduvyAssets.illustrations.platformEcosystem}
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="mx-auto max-h-80 w-auto lg:max-h-none"
          />
        </div>
      </div>
    </section>
  );
}
