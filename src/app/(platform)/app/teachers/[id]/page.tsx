import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { Avatar } from "@/components/platform/ui/avatar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { mockTeachers } = await import("@/mocks/platform");
  const { id } = await params;
  const teacher = mockTeachers.find((t) => t.id === id);
  return platformMetadata(teacher?.name ?? "Professor");
}

export default async function TeacherDetailPage({ params }: Props) {
  const { mockTeachers } = await import("@/mocks/platform");
  const { id } = await params;
  const teacher = mockTeachers.find((t) => t.id === id);
  if (!teacher) notFound();

  return (
    <>
      <PageHeader title={teacher.name} description={teacher.specialty} />
      <div className="grid gap-6 lg:grid-cols-3">
        <PlatformCard>
          <PlatformCardBody>
            <Avatar initials={teacher.avatarInitials} className="size-14 text-base" />
            <p className="mt-4 text-sm text-text-muted">{teacher.email}</p>
            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Cursos</dt><dd>{teacher.coursesCount}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Turmas</dt><dd>{teacher.classesCount}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Alunos</dt><dd>{teacher.studentsCount}</dd></div>
            </dl>
          </PlatformCardBody>
        </PlatformCard>

        <PlatformCard className="lg:col-span-2">
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Pendências</h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="rounded-xl border border-border bg-warning-soft px-4 py-3">{teacher.pendingEssays} redações aguardando correção</li>
              <li className="rounded-xl border border-border bg-background-soft px-4 py-3">{teacher.pendingAssessments} avaliações sem nota</li>
            </ul>
          </PlatformCardBody>
        </PlatformCard>
      </div>
    </>
  );
}
