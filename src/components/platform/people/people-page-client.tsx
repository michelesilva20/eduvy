"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedPeopleDto, PersonListItemDto } from "@eduvy/contracts";
import { PageHeader } from "@/components/platform/shared/page-header";
import { EmptyState } from "@/components/platform/shared/empty-state";
import { InvitePersonForm } from "@/components/platform/people/invite-person-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "INVITED", label: "Convidados" },
  { value: "SUSPENDED", label: "Suspensos" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  SUSPENDED: "Suspenso",
  REMOVED: "Removido",
};

type PeopleKind = "students" | "instructors";

const CONFIG: Record<
  PeopleKind,
  { title: string; description: string; inviteLabel: string; basePath: string; apiInvite: string }
> = {
  students: {
    title: "Alunos",
    description: "Gerencie matrículas, progresso, níveis e engajamento.",
    inviteLabel: "Convidar aluno",
    basePath: "/app/students",
    apiInvite: "/api/students/invite",
  },
  instructors: {
    title: "Professores",
    description: "Acompanhe carga de trabalho, turmas e pendências de correção.",
    inviteLabel: "Convidar professor",
    basePath: "/app/teachers",
    apiInvite: "/api/instructors/invite",
  },
};

export function PeoplePageClient({
  kind,
  initialData,
  error,
}: {
  kind: PeopleKind;
  initialData: PaginatedPeopleDto | null;
  error: string | null;
}) {
  const config = CONFIG[kind];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const status = searchParams.get("status") ?? "ALL";
  const items = initialData?.items ?? [];

  function applyFilters(next: { search?: string; status?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
    }
    if (next.status !== undefined) {
      if (next.status && next.status !== "ALL") params.set("status", next.status);
      else params.delete("status");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${config.basePath}?${params.toString()}`);
    });
  }

  return (
    <>
      <PageHeader title={config.title} description={config.description}>
        <Button onClick={() => setInviteOpen((v) => !v)}>{config.inviteLabel}</Button>
      </PageHeader>

      {inviteOpen ? (
        <InvitePersonForm
          invitePath={config.apiInvite}
          title={config.inviteLabel}
          onCancel={() => setInviteOpen(false)}
          onSuccess={(token) => {
            setMessage(`Convite registrado. Token demo: ${token.slice(0, 12)}…`);
            router.refresh();
          }}
        />
      ) : null}

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          className="flex w-full max-w-md gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({ search: search.trim() });
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${kind === "students" ? "alunos" : "professores"}…`}
            aria-label="Buscar"
          />
          <Button type="submit" variant="secondary" disabled={isPending}>
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              disabled={isPending}
              onClick={() => applyFilters({ status: filter.value })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                status === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background-soft text-text-muted hover:text-text-primary",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      {!error && items.length === 0 ? (
        <EmptyState
          title={`Nenhum ${kind === "students" ? "aluno" : "professor"} encontrado`}
          description={
            search || status !== "ALL"
              ? "Tente ajustar os filtros ou convide alguém novo."
              : `Convide ${kind === "students" ? "alunos" : "professores"} para começar.`
          }
          actionLabel={config.inviteLabel}
          actionHref={config.basePath}
        />
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border-light">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border-light bg-background-soft/60 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Turmas</th>
                <th className="px-4 py-3 font-semibold">Cursos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((person: PersonListItemDto) => (
                <tr key={person.membershipId} className="border-b border-border-light last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`${config.basePath}/${person.membershipId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {person.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{person.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-background-soft px-2 py-0.5 text-xs font-semibold">
                      {STATUS_LABEL[person.status] ?? person.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{person.cohortsCount}</td>
                  <td className="px-4 py-3 text-text-muted">{person.activeCoursesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
