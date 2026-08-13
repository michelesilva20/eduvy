import Link from "next/link";
import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { startAssessmentAttempt } from "@/lib/assessments/server";
import { AssessmentPlayerClient } from "@/components/platform/assessments/assessment-player-client";
import { Button } from "@/components/ui/button";

export const metadata = platformMetadata("Realizar avaliação");

export default async function AssessmentTakePage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const { data, error } = await startAssessmentAttempt(assignmentId);

  if (!data) {
    if (error) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <div
            role="alert"
            className="w-full rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/app/my-assessments">Voltar às avaliações</Link>
          </Button>
        </div>
      );
    }
    notFound();
  }

  return <AssessmentPlayerClient initialAttempt={data} />;
}
