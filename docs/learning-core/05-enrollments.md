# Gate 5 — Enrollments (Matrículas)

## Modelo

`Enrollment` liga `Membership` (aluno) a `Cohort` + `CourseVersion`.

### Campos

- `status`, `enrolledAt`, `startedAt`, `completedAt`, `cancelledAt`

### Estados

`PENDING` | `ACTIVE` | `COMPLETED` | `CANCELLED` | `EXPIRED`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/cohorts/:id/enrollments` | `enrollments.read` |
| POST | `/cohorts/:id/enrollments` | `enrollments.create` |
| POST | `/cohorts/:id/enrollments/bulk` | `enrollments.create` |
| POST | `/enrollments/:id/cancel` | `enrollments.cancel` |

## Regras

- Aluno precisa ter role `STUDENT` ativo
- Evita duplicata (mesmo aluno + turma + versão)
- Respeita `maxStudents` da turma
- Turmas `ARCHIVED` / `CANCELLED` / `COMPLETED` não aceitam matrícula
- Bulk retorna `{ enrolled, alreadyEnrolled, failed, results[] }`
- Cancelamento reativa possível em nova matrícula

## Frontend

- Aba **Alunos** em `/app/classes/:id`
- Seleção múltipla + matricular em massa
- Cancelar matrícula ativa

## Migration

`20260813040000_learning_core_enrollments`

## Smoke

```bash
node --env-file=.env scripts/smoke-enrollments-api.mjs
```
