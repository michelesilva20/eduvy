"use client";

import Link from "next/link";
import type { PersonDetailDto } from "@eduvy/contracts";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/platform/shared/page-header";

export function PersonDetailClient({
  person,
  basePath,
  label,
}: {
  person: PersonDetailDto;
  basePath: string;
  label: string;
}) {
  return (
    <>
      <div className="mb-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {label}
        </Link>
      </div>

      <PageHeader title={person.fullName} description={person.email} />

      <section className="rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-text-muted">Status</dt>
            <dd className="font-medium">{person.status}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Papéis</dt>
            <dd className="font-medium">{person.roles.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Entrou em</dt>
            <dd className="font-medium">
              {person.joinedAt ? new Date(person.joinedAt).toLocaleDateString("pt-BR") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Turmas / Cursos</dt>
            <dd className="font-medium">
              {person.cohortsCount} turmas · {person.activeCoursesCount} cursos
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-text-muted">
          Progresso e atribuições a turmas entram nos Gates 4–6.
        </p>
      </section>
    </>
  );
}
