import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div
      className="hidden border-b border-border-light bg-background-soft sm:block"
      role="region"
      aria-label="Anúncio"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs md:text-sm">
        <span className="font-[family-name:var(--font-nunito)] text-text-muted">
          Uma plataforma. Diferentes formas de ensinar.
        </span>
        <Link
          href="#modulos"
          className="focus-ring inline-flex items-center gap-1 rounded font-[family-name:var(--font-nunito)] font-semibold text-primary transition-colors hover:text-primary-bright"
        >
          Conheça os módulos da Eduvy
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
