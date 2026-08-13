# Gate 6 — Progress + Student Player

## Modelo

`LessonProgress` registra progresso por aula dentro de uma `Enrollment`.

### Campos

- `status`, `progressPercentage` (0–100)
- `startedAt`, `completedAt`, `lastAccessAt`
- `timeSpentSeconds`

### Estados

`NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/learning/my-courses` | `learning_progress.read` |
| GET | `/learning/:enrollmentId` | `learning_progress.read` |
| POST | `/learning/:enrollmentId/lessons/:lessonId/start` | `learning_progress.read` |
| POST | `/learning/:enrollmentId/lessons/:lessonId/complete` | `learning_progress.read` |

Entitlement: `CORE_COURSES` / `courses`

## Regras

- Aluno só acessa matrículas do próprio `membership` / `userId`
- Matrículas `CANCELLED` / `EXPIRED` bloqueadas
- Progresso do curso = aulas concluídas / total de aulas (determinístico)
- `complete` é idempotente (já concluída permanece 100%)
- Ao concluir 100% das aulas, enrollment → `COMPLETED`
- Seed: role `STUDENT` recebe `learning_progress.read`

## Frontend

- `/app/learning` — Meus cursos
- `/app/learning/:enrollmentId` — Player (overlay full-screen)
- Nav: **Meus cursos**
- BFF: `/api/learning/*`

## Migration

`20260813050000_learning_core_progress`  
RLS: `sql/rls/005_lesson_progress.sql`

## Smoke

```bash
node --env-file=.env scripts/smoke-learning-api.mjs
```
