import { platformMetadata } from "@/lib/platform/metadata";
import { fetchCohorts } from "@/lib/cohorts/server";
import { ClassesPageClient } from "@/components/platform/classes/classes-page-client";

export const metadata = platformMetadata("Turmas");

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { data, error } = await fetchCohorts(params);
  return <ClassesPageClient initialData={data} error={error} />;
}
