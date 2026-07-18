import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { platformFeatures } from "@/data/landing";
import { Check } from "lucide-react";

const floatingCards = [
  { label: "Editor de cursos", top: "8%", left: "-4%" },
  { label: "Prévia do aluno", top: "42%", right: "-6%" },
  { label: "Publicação", bottom: "12%", left: "6%" },
];

export function PlatformSection() {
  return (
    <section
      id="plataforma"
      className="relative bg-background-soft py-20 md:py-28"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <SectionHeading
          id="platform-heading"
          title="Crie experiências completas de aprendizagem."
          description="Organize módulos, aulas, materiais, avaliações e trilhas em um único ambiente."
        />

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <EduvyIllustration
              asset={eduvyAssets.illustrations.courseBuilder}
              sizes="(max-width: 1024px) 90vw, 45vw"
            />
            {floatingCards.map((card) => (
              <span
                key={card.label}
                className="glass-panel absolute hidden rounded-2xl px-3 py-2 text-xs font-semibold text-text-primary md:block"
                style={{
                  top: card.top,
                  left: card.left,
                  right: card.right,
                  bottom: card.bottom,
                }}
              >
                {card.label}
              </span>
            ))}
          </div>

          <div>
            <ul className="space-y-4">
              {platformFeatures.map((feature) => (
                <li
                  key={feature.id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-text-primary">{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
