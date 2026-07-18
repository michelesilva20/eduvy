import Link from "next/link";
import { Globe, MessageSquare, Share2, Video } from "lucide-react";
import { footerLinkGroups } from "@/data/landing";
import { EduvyLogo } from "@/components/shared/eduvy-logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border-light bg-background-soft text-text-dark"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <EduvyLogo variant="dark" />
            <p className="mt-4 max-w-xs font-[family-name:var(--font-nunito)] text-sm leading-relaxed text-text-muted">
              Plataforma modular de aprendizagem para empresas, escolas e
              especialistas que querem evoluir a forma de ensinar.
            </p>
            <div className="mt-6 flex gap-3" aria-label="Redes sociais (demonstração)">
              {[Share2, MessageSquare, Video].map((Icon, i) => (
                <span
                  key={i}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border-light bg-surface-light text-text-muted"
                  aria-hidden
                  title="Demonstração — link indisponível"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-light px-3 py-1.5 text-xs text-text-muted">
              <Globe className="size-3.5" aria-hidden />
              <span>Português (BR)</span>
              <span className="text-text-muted/60">· demonstração</span>
            </div>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-[family-name:var(--font-sora)] text-sm font-bold uppercase tracking-wider text-text-dark">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.demo || !link.href ? (
                      <span
                        className="font-[family-name:var(--font-nunito)] text-sm text-text-muted/70"
                        title="Conteúdo demonstrativo — em breve"
                      >
                        {link.label}
                      </span>
                    ) : (
                      <Link
                        href={link.href}
                        className="focus-ring rounded font-[family-name:var(--font-nunito)] text-sm text-text-muted transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-light pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-[family-name:var(--font-nunito)] text-sm text-text-muted">
            © {year} Eduvy. Produto conceitual desenvolvido para portfólio.
          </p>
          <p className="font-[family-name:var(--font-nunito)] text-xs text-text-muted/70">
            Demonstração conceitual — funcionalidades e preços sujeitos a
            definição.
          </p>
        </div>
      </div>
    </footer>
  );
}
