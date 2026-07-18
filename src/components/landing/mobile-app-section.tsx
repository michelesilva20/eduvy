import { eduvyAssets } from "@/config/eduvy-assets";
import { EduvyIllustration } from "@/components/brand/eduvy-image";
import { SectionHeading } from "@/components/shared/section-heading";

const highlights = [
  "Cursos e aulas",
  "Progresso em tempo real",
  "Notificações",
  "Desafios e simulados",
  "Perfil e conquistas",
];

export function MobileAppSection() {
  return (
    <section
      id="aplicativo"
      className="bg-background py-20 md:py-28"
      aria-labelledby="mobile-app-heading"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SectionHeading
              id="mobile-app-heading"
              title="Aprendizado onde seus alunos estiverem."
              description="Uma experiência fluida para acompanhar aulas, desafios, simulados e progresso pelo celular."
              align="left"
            />
            <ul className="mt-8 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
            <EduvyIllustration
              asset={eduvyAssets.illustrations.mobileApp}
              sizes="(max-width: 1024px) 80vw, 40vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
