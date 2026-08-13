import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchAssessment } from "@/lib/assessments/server";
import { AssessmentDetailClient } from "@/components/platform/assessments/assessment-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await fetchAssessment(id);
  return platformMetadata(data?.title ?? "Avaliação");
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await fetchAssessment(id);

  if (!data) {
    if (error) {
      return (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      );
    }
    notFound();
  }

  return <AssessmentDetailClient assessment={data} />;
}
