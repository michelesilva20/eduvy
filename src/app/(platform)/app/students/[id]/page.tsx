import { notFound } from "next/navigation";
import { platformMetadata } from "@/lib/platform/metadata";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformCard, PlatformCardBody } from "@/components/platform/shared/platform-card";
import { Avatar } from "@/components/platform/ui/avatar";
import { StatusBadge } from "@/components/platform/ui/badge";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { mockStudents } = await import("@/mocks/platform");
  const { id } = await params;
  const student = mockStudents.find((s) => s.id === id);
  return platformMetadata(student?.name ?? "Aluno");
}

export default async function StudentDetailPage({ params }: Props) {
  const { mockStudents } = await import("@/mocks/platform");
  const { id } = await params;
  const student = mockStudents.find((s) => s.id === id);
  if (!student) notFound();

  return (
    <>
      <PageHeader title={student.name} description="Perfil completo do aluno na plataforma." />
      <div className="grid gap-6 lg:grid-cols-3">
        <PlatformCard className="lg:col-span-1">
          <PlatformCardBody>
            <div className="flex items-center gap-4">
              <Avatar initials={student.avatarInitials} className="size-14 text-base" />
              <div>
                <StatusBadge status={student.status} />
                <p className="mt-2 text-sm text-text-muted">{student.email}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Turma</dt><dd>{student.className}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Cursos</dt><dd>{student.coursesCount}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Progresso</dt><dd className="font-semibold text-primary">{student.progress}%</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Nível / XP</dt><dd>Nv. {student.level} · {student.xp.toLocaleString("pt-BR")} XP</dd></div>
            </dl>
          </PlatformCardBody>
        </PlatformCard>

        <PlatformCard className="lg:col-span-2">
          <PlatformCardBody>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-bold text-text-primary">Linha do tempo</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              <li className="rounded-xl border border-border bg-background-soft px-4 py-3">Concluiu simulado integrado — há 2 dias</li>
              <li className="rounded-xl border border-border bg-background-soft px-4 py-3">Enviou redação argumentativa — há 4 dias</li>
              <li className="rounded-xl border border-border bg-background-soft px-4 py-3">Alcançou nível {student.level} — há 1 semana</li>
            </ul>
          </PlatformCardBody>
        </PlatformCard>
      </div>
    </>
  );
}
