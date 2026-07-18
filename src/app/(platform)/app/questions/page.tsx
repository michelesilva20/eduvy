import { platformMetadata } from "@/lib/platform/metadata";
import { PlatformFeaturePage } from "@/components/platform/shared/platform-feature-page";

export const metadata = platformMetadata("Banco de questões");

export default function QuestionsPage() {
  return (
    <PlatformFeaturePage
      title="Banco de questões"
      description="Organize questões por matéria, dificuldade e tags."
      actionLabel="Nova questão"
      actionHref="/app/questions"
      emptyTitle="Seu banco de questões"
      emptyDescription="Importe ou crie questões para simulados e avaliações."
    />
  );
}
