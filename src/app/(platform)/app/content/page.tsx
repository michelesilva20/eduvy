import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Conteúdos");

export default function ContentPage() {
  return (
    <PlatformFeaturePage
      title="Conteúdos"
      description="Vídeos, textos, PDFs, atividades e aulas ao vivo."
      actionLabel="Novo conteúdo"
      actionHref="/app/content"
      emptyTitle="Central de conteúdos vazia"
      emptyDescription="Organize materiais por curso e módulo. Layout pronto para upload e integração com CDN."
    />
  );
}
