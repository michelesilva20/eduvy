import { platformMetadata } from "@/lib/platform/metadata";
import { fetchMyAssessments } from "@/lib/assessments/server";
import { MyAssessmentsClient } from "@/components/platform/assessments/my-assessments-client";

export const metadata = platformMetadata("Minhas avaliações");

export default async function MyAssessmentsPage() {
  const { data, error } = await fetchMyAssessments();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-text-primary md:text-3xl">
          Minhas avaliações
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Pendentes, em andamento e concluídas.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : (
        <MyAssessmentsClient items={data ?? []} />
      )}
    </div>
  );
}
