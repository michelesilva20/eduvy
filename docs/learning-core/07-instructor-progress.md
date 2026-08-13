# Gate 7 — Instructor Progress (Progresso na turma)

## Objetivo

Permitir que gestores e professores acompanhem o progresso dos alunos de uma turma, reutilizando `LessonProgress` do Gate 6.

## Endpoint

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/cohorts/:id/progress` | `learning_progress.read` |

Query:

- `filter` = `ALL` \| `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED`
- `search`, `page`, `limit`

Entitlement: `CORE_COURSES` / `courses`

## Regras

- Agrega matrículas `PENDING` / `ACTIVE` / `COMPLETED` da turma
- Progresso = aulas concluídas / total de aulas da versão do curso
- Status derivado:
  - `NOT_STARTED` — 0% sem acesso
  - `IN_PROGRESS` — iniciado ou parcialmente concluído
  - `COMPLETED` — 100%
- Evita N+1: enrollments + lessonProgress + memberships em batch
- Seed: role `INSTRUCTOR` recebe `courses.read`, `cohorts.read`, `enrollments.read`, `learning_progress.read`, `students.read`, `instructors.read`

## Frontend

- Aba **Progresso** em `/app/classes/:id`
- Tabela: Nome | Progresso (%) | Status | Último acesso
- Contador de alunos + filtros
- BFF: `/api/cohorts/:id/progress`

## Smoke

```bash
node --env-file=.env scripts/smoke-cohort-progress-api.mjs
```
