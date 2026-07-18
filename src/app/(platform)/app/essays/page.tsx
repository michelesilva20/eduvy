import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Redações");

export default function EssaysPage() {
  return (
    <PlatformFeaturePage
      title="Redações"
      description="Envio, fila de correção e feedback aos alunos."
      actionHref="/app/essays"
      stats={[{ label: "Aguardando correção", value: "12" }]}
    >
      <p className="rounded-[var(--radius-card)] border border-border bg-surface p-6 text-sm text-text-secondary shadow-soft">
        Fila de correção preparada para integração com módulo de redações e assistência por IA.
      </p>
    </PlatformFeaturePage>
  );
}
