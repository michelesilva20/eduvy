import { platformMetadata } from "@/lib/platform/metadata";
import { fetchStudents } from "@/lib/people/server";
import { PeoplePageClient } from "@/components/platform/people/people-page-client";

export const metadata = platformMetadata("Alunos");

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { data, error } = await fetchStudents(params);

  return <PeoplePageClient kind="students" initialData={data} error={error} />;
}
