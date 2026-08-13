# Gate 11 — Auto-grade + Results

Fecha o ciclo de correção objetiva e a visão de resultados do professor.

## Auto-grade

| Tipo | Regra |
|------|--------|
| `SINGLE_CHOICE` / `TRUE_FALSE` | opção correta única |
| `MULTIPLE_CHOICE` | conjunto **exato** (sem partial score) |
| `SHORT_TEXT` | permanece pendente de correção manual |

Persistência no attempt: `score`, `maxScore`, `scorePercentage`, `gradedAt`.

Enquanto houver SHORT_TEXT sem pontos: status `SUBMITTED`, `pendingManualGrade = true`, aluno vê “Correção em andamento”.

## Correção manual

```text
PATCH /assessment-attempts/:attemptId/answers/:questionId/grade
{ isCorrect, pointsAwarded }
```

Permissão: `assessments.grade`.

Após a última questão manual, o attempt vira `GRADED` e o score é recalculado (`totalsFromAwardedPoints`).

## Resultados (professor)

Permissão: `assessments.results.read`.

| Método | Rota |
|--------|------|
| GET | `/assessments/:id/results` |
| GET | `/assessments/:id/results/questions` |
| GET | `/assessment-attempts/:id/instructor` |

`GET /results` agrega alunos matriculados nas turmas atribuídas:

- resumo: alunos, realizaram, pendentes, média / maior / menor
- tabela: aluno, turma, status, nota, tentativa, enviado
- filtros: busca, status, `AWAITING_GRADE`
- stats por questão (% de acerto)

## Frontend

Seção **Resultados** no detalhe da avaliação:

- cards de resumo
- tabela com filtros
- drawer da tentativa (gabarito + grade SHORT_TEXT)

## Testes

```powershell
pnpm --filter @eduvy/api test -- attempt-grading.spec.ts
node --env-file=.env scripts/smoke-assessment-results-api.mjs
```

## Segurança

- Aluno **não** acessa `/results` (403)
- Detalhe instructor exige `assessments.results.read`
- Payload do player do aluno continua sem gabarito
