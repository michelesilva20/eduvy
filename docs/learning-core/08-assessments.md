# Gate 8 — Assessment foundation

## Modelos

| Modelo | Papel |
|--------|--------|
| `Question` | Banco reutilizável de questões |
| `Assessment` | Prova / atividade |
| `AssessmentQuestion` | Vínculo Assessment ↔ Question (ordem/peso) |
| `AssessmentAttempt` | Tentativa do aluno (schema pronto) |
| `AttemptAnswer` | Resposta da tentativa (schema pronto) |

### Tipos de questão (agora)

`SINGLE_CHOICE` · `MULTIPLE_CHOICE` · `TRUE_FALSE` · `SHORT_TEXT`

### Status da avaliação

`DRAFT` · `PUBLISHED` · `ARCHIVED`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET/POST | `/questions` | `questions.read` / `questions.manage` |
| GET/PATCH/DELETE | `/questions/:id` | read / manage |
| GET/POST | `/assessments` | `assessments.read` / `assessments.create` |
| GET/PATCH | `/assessments/:id` | read / update |
| POST | `/assessments/:id/publish` | `assessments.publish` |
| POST | `/assessments/:id/archive` | `assessments.update` |
| POST | `/assessments/:id/questions` | `assessments.update` |
| DELETE | `/assessments/:id/questions/:questionId` | `assessments.update` |
| PATCH | `/assessments/:id/questions/reorder` | `assessments.update` |

Entitlement: `CORE_COURSES` / `courses`

## Regras

- Publicar exige ≥ 1 questão
- Questão em uso não pode ser excluída
- Audit: `assessment.created|updated|published`
- Seed: `INSTRUCTOR` recebe questions.* + assessments.*

## Frontend

- `/app/assessments` — listagem
- `/app/assessments/new` — criação
- `/app/assessments/:id` — detalhe + adicionar questões + publicar

## Migration / RLS

- `20260813060000_learning_core_assessments`
- `sql/rls/006_assessments.sql`

## Fora deste gate

- Player do aluno / timer / auto-grade completo
- Tipos ESSAY / MATCHING / ORDERING
- Simulados e redações (módulos separados)

## Smoke

```bash
node --env-file=.env scripts/smoke-assessments-api.mjs
```
