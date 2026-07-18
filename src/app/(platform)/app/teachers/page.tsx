import Link from "next/link";
import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { Avatar } from "@/components/platform/ui/avatar";
import { StatusBadge } from "@/components/platform/ui/badge";
import { mockTeachers } from "@/mocks/platform";

export const metadata = platformMetadata("Professores");

export default function TeachersPage() {
  return (
    <>
      <PageHeader
        title="Professores"
        description="Acompanhe carga de trabalho, turmas e pendências de correção."
        actionLabel="Novo professor"
        actionHref="/app/teachers"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockTeachers.map((teacher) => (
          <Link key={teacher.id} href={`/app/teachers/${teacher.id}`}>
            <PlatformCard interactive className="h-full">
              <PlatformCardBody>
                <div className="flex items-start gap-3">
                  <Avatar initials={teacher.avatarInitials} />
                  <div>
                    <h2 className="font-[family-name:var(--font-sora)] font-bold text-text-primary">{teacher.name}</h2>
                    <p className="text-sm text-text-muted">{teacher.specialty}</p>
                    <StatusBadge status={teacher.status} />
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-text-muted">
                  <div><dt>Cursos</dt><dd className="text-sm font-semibold text-text-primary">{teacher.coursesCount}</dd></div>
                  <div><dt>Turmas</dt><dd className="text-sm font-semibold text-text-primary">{teacher.classesCount}</dd></div>
                  <div><dt>Alunos</dt><dd className="text-sm font-semibold text-text-primary">{teacher.studentsCount}</dd></div>
                  <div><dt>Redações</dt><dd className="text-sm font-semibold text-warning">{teacher.pendingEssays}</dd></div>
                </dl>
              </PlatformCardBody>
            </PlatformCard>
          </Link>
        ))}
      </div>
    </>
  );
}
