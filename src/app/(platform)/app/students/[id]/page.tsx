import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { fetchStudent } from "@/lib/people/server";
import { PersonDetailClient } from "@/components/platform/people/person-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await fetchStudent(id);
  return platformMetadata(data?.fullName ?? "Aluno");
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await fetchStudent(id);

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

  return <PersonDetailClient person={data} basePath="/app/students" label="Alunos" />;
}
