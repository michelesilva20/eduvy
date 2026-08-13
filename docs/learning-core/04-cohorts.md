# Gate 4 — Cohorts (Turmas)

## Modelo

`Cohort` vinculado a `Course` + `CourseVersion`, com professores via `CohortInstructor`.

### Campos enriquecidos

- `courseId`, `courseVersionId`
- `enrollmentStartAt`, `enrollmentEndAt`, `maxStudents`
- `status`, `createdBy`

### Enums

**CohortStatus:** `DRAFT` → `OPEN` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED` | `ARCHIVED`

**CohortInstructorRole:** `LEAD` | `ASSISTANT` | `TUTOR`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET/POST | `/cohorts` | `cohorts.read` / `cohorts.create` |
| GET/PATCH/DELETE | `/cohorts/:id` | `cohorts.read` / `cohorts.update` |
| POST | `/cohorts/:id/open\|start\|complete\|archive` | `cohorts.update` |
| GET/POST | `/cohorts/:id/instructors` | `cohorts.read` / `cohorts.update` |
| DELETE | `/cohorts/:id/instructors/:membershipId` | `cohorts.update` |

## Regras

- Criar turma exige curso existente; usa versão PUBLISHED ou a mais recente
- DELETE em rascunho sem matrículas → hard delete; caso contrário → archive
- Professor atribuído deve ter role `INSTRUCTOR` ativo
- Contagem de alunos via enrollments (Gate 5)

## Frontend

- `/app/classes` — listagem
- `/app/classes/new` — criação
- `/app/classes/:id` — detalhe (visão geral + professores)
- BFF em `/api/cohorts/*`

## Migration

`20260813030000_learning_core_cohorts`

## Smoke

```bash
node --env-file=.env scripts/smoke-cohorts-api.mjs
```
