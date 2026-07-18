import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { StatusBadge } from "@/components/platform/ui/badge";
import { mockClasses } from "@/mocks/platform";

export const metadata = platformMetadata("Turmas");

export default function ClassesPage() {
  return (
    <>
      <PageHeader
        title="Turmas"
        description="Organize turmas, acompanhe progresso e participação dos alunos."
        actionLabel="Nova turma"
        actionHref="/app/classes"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {mockClasses.map((cls) => (
          <PlatformCard key={cls.id} interactive>
            <PlatformCardBody>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">
                    {cls.name}
                  </h2>
                  <p className="text-sm text-text-muted">{cls.courseName}</p>
                </div>
                <StatusBadge status={cls.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-text-muted">Professor</dt><dd className="font-medium">{cls.teacherName}</dd></div>
                <div><dt className="text-text-muted">Alunos</dt><dd className="font-medium">{cls.studentsCount}</dd></div>
                <div><dt className="text-text-muted">Início</dt><dd>{cls.startDate}</dd></div>
                <div><dt className="text-text-muted">Término</dt><dd>{cls.endDate}</dd></div>
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-background-purple-soft px-3 py-2">
                  <p className="text-xs text-text-muted">Progresso</p>
                  <p className="font-semibold text-primary">{cls.progress}%</p>
                </div>
                <div className="rounded-xl bg-success-soft px-3 py-2">
                  <p className="text-xs text-text-muted">Participação</p>
                  <p className="font-semibold text-success">{cls.participation}%</p>
                </div>
              </div>
            </PlatformCardBody>
          </PlatformCard>
        ))}
      </div>
    </>
  );
}
