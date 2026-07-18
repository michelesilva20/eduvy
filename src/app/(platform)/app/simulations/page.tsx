import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Simulados");

export default function SimulationsPage() {
  return (
    <PlatformFeaturePage
      title="Simulados"
      description="Provas cronometradas com relatórios de desempenho."
      actionLabel="Novo simulado"
      actionHref="/app/simulations"
    >
      <p className="text-sm text-text-muted">Módulo ativo — interface preparada para listagem e resultados.</p>
    </PlatformFeaturePage>
  );
}
