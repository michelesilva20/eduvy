import { platformMetadata } from "@/lib/platform/metadata";
import { fetchInstructors } from "@/lib/people/server";
import { PeoplePageClient } from "@/components/platform/people/people-page-client";

export const metadata = platformMetadata("Professores");

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { data, error } = await fetchInstructors(params);

  return <PeoplePageClient kind="instructors" initialData={data} error={error} />;
}
