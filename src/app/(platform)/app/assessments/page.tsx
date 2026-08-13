import { platformMetadata } from "@/lib/platform/metadata";
import { fetchAssessments } from "@/lib/assessments/server";
import { AssessmentsPageClient } from "@/components/platform/assessments/assessments-page-client";

export const metadata = platformMetadata("Avaliações");

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const query = await searchParams;
  const { data, error } = await fetchAssessments(query);
  return <AssessmentsPageClient initialData={data} error={error} />;
}
