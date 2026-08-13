# Gate 10 — Assessment Assignment

Avaliação só fica disponível ao aluno quando há **atribuição à turma** + matrícula ativa, com janela, tentativas e visibilidade de resultado.

## Modelo

`AssessmentAssignment`:

| Campo | Uso |
|-------|-----|
| `assessmentId` / `cohortId` | Vínculo obrigatório (unique por tenant) |
| `lessonId` | Opcional (contexto de aula) |
| `availableFrom` / `availableUntil` | Janela da atribuição (prevalece sobre a do Assessment) |
| `attemptsAllowed` | Limite por atribuição (fallback: `Assessment.maxAttempts`) |
| `timeLimitMinutes` | Timer da atribuição (fallback: Assessment) |
| `resultVisibility` | `IMMEDIATE` / `AFTER_SUBMISSION` / `AFTER_DEADLINE` / `MANUAL` |
| `required` / `isActive` | Obrigatoriedade e desativação sem apagar histórico |

`AssessmentAttempt.assignmentId` — tentativas passam a nascer a partir da atribuição.

## Regras de disponibilidade

Aluno inicia tentativa somente se:

1. Assessment `PUBLISHED`
2. Assignment `isActive`
3. Matrícula ativa (ou equivalente) na turma
4. Dentro da janela resolvida
5. Tentativas restantes (`attemptsAllowed` / `maxAttempts`)

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/assessments/:id/assignments` | `assessments.assign` |
| POST | `/assessments/:id/assignments` | `assessments.assign` |
| PATCH | `/assessment-assignments/:id` | `assessments.assign` |
| GET | `/my-assessments` | `assessments.attempt` |
| POST | `/assessment-assignments/:id/attempts` | `assessments.attempt` |

Start legado `POST /assessments/:id/attempts` **removido** — fluxo único via assignment.

## Imutabilidade

Publicado + (assignments > 0 **ou** attempts > 0) → bloqueio de alteração de questões (`ASSESSMENT_LOCKED`).

## Frontend

| Rota | Função |
|------|--------|
| Detalhe da avaliação | Seção **Atribuições** (criar/listar) |
| `/app/my-assessments` | Lista com turma, prazo e CTA por assignment |
| `/app/assessments/assignments/:assignmentId/take` | Player |
| `/app/assessments/:id/take` | Redirect para Minhas avaliações |

Resultado oculto quando `resultVisible = false` (ex.: `MANUAL` / `AFTER_DEADLINE` antes do prazo).

## Testes

```powershell
pnpm --filter @eduvy/api test -- assignment-availability.spec.ts
node --env-file=.env scripts/smoke-assessment-assignments-api.mjs
node --env-file=.env scripts/smoke-assessment-attempts-api.mjs
```

## RLS

`packages/database/sql/rls/008_assessment_assignments.sql` — tenant isolation fail-closed.
