# Gate 9 — Assessment Attempts + Student Player

Fecha o ciclo de tentativa do aluno: iniciar, retomar, autosave, timer, submit e resultado básico.

## Modelo

`AssessmentAttempt` (adaptado, não duplicado):

| Campo | Uso |
|-------|-----|
| `attemptNumber` | Sequência por aluno/avaliação |
| `enrollmentId` | Opcional (vínculo com turma no Gate 10) |
| `expiresAt` | Timer server-authoritative |
| `score` / `maxScore` / `scorePercentage` | Resultado |
| `gradedAt` | Quando correção objetiva finaliza |
| `EXPIRED` | Status quando o tempo acaba |

Constraints:

- `UNIQUE (tenant, assessment, membership, attempt_number)`
- Partial unique: **uma** tentativa `IN_PROGRESS` por aluno/avaliação

## Disponibilidade (Gate 9)

Enquanto o Assignment (Gate 10) não existir, a disponibilidade usa campos do `Assessment`:

- `status = PUBLISHED`
- janela `availableFrom` / `availableUntil`
- `maxAttempts`
- membership ativa + permissão `assessments.attempt`

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/learning/assessments` | `assessments.attempt` |
| POST | `/assessments/:id/attempts` | start/resume |
| GET | `/assessment-attempts/:id` | player state |
| PUT | `/assessment-attempts/:id/answers/:questionId` | autosave upsert |
| POST | `/assessment-attempts/:id/submit` | submit idempotente |
| GET | `/assessment-attempts/:id/result` | resultado aluno |

## Segurança do payload

DTO do player **nunca** inclui:

- `isCorrect` nas opções
- `correctAnswer`
- `explanation`

Admin continua usando `GET /assessments/:id` com gabarito.

## Timer

- `expiresAt` gravado no start quando há `timeLimitMinutes`
- UI conta localmente com offset de `serverNow`
- Save/submit validam expiração no servidor
- Ao expirar: submit automático → status `EXPIRED` + grade objetiva

## Correção no submit

| Tipo | Comportamento |
|------|----------------|
| SINGLE_CHOICE / TRUE_FALSE | opção correta |
| MULTIPLE_CHOICE | conjunto **exato** |
| SHORT_TEXT | `SUBMITTED` + pending manual |

## Frontend

| Rota | Função |
|------|--------|
| `/app/my-assessments` | Central do aluno |
| `/app/assessments/:id/take` | Player fullscreen |

UX: progress bar, navigator, autosave discreto (Salvando… / Salvo), confirmação de envio com questões em branco.

## Testes

```powershell
pnpm --filter @eduvy/api test -- attempt-grading.spec.ts
node --env-file=.env scripts/smoke-assessment-attempts-api.mjs
```

## Decisão — imutabilidade

Gate 9 **não** bloqueia edição admin de questões após publish. Risco documentado; Gate 10/11 deve impedir mudanças destrutivas com tentativas ativas (preferência: assessment publicado imutável enquanto houver attempts).
