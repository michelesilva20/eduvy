import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";

export const metadata = platformMetadata("Gamificação");

export default function GamificationPage() {
  return (
    <>
      <PageHeader
        title="Gamificação"
        description="Níveis, XP, conquistas e rankings com visual profissional e elegante."
      />
      <EmptyState
        title="Gamificação ainda não ativa"
        description="Quando houver alunos e atividades registradas, níveis, XP e rankings aparecerão aqui."
        actionLabel="Convidar alunos"
        actionHref="/app/students"
      />
    </>
  );
}
