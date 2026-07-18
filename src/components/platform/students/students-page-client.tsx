"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/platform/shared/page-header";
import { PlatformTable } from "@/components/platform/shared/platform-table";
import { Avatar } from "@/components/platform/ui/avatar";
import { StatusBadge } from "@/components/platform/ui/badge";
import { mockStudents } from "@/mocks/platform";

export function StudentsPageClient() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Gerencie matrículas, progresso, níveis e engajamento."
        actionLabel="Convidar aluno"
        actionHref="/app/students"
      />

      <PlatformTable
        data={mockStudents}
        keyExtractor={(s) => s.id}
        onRowClick={(s) => router.push(`/app/students/${s.id}`)}
        columns={[
          {
            key: "name",
            header: "Aluno",
            render: (s) => (
              <span className="flex items-center gap-3">
                <Avatar initials={s.avatarInitials} />
                <span>
                  <span className="block font-medium text-text-primary">{s.name}</span>
                  <span className="block text-xs text-text-muted">{s.email}</span>
                </span>
              </span>
            ),
          },
          { key: "class", header: "Turma", render: (s) => s.className },
          { key: "progress", header: "Progresso", render: (s) => `${s.progress}%` },
          { key: "level", header: "Nível", render: (s) => `Nv. ${s.level}` },
          { key: "access", header: "Último acesso", render: (s) => s.lastAccess },
          { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
        ]}
      />
    </>
  );
}
