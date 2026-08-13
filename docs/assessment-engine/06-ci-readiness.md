# Gate 12 — CI Foundation + Release Readiness

Fecha a iniciativa Assessment Engine 1.0 com validação automatizada e checklist de release.

## CI (GitHub Actions)

### PR validation — `.github/workflows/ci.yml`

```text
install
↓
build packages
↓
migrate + roles + RLS (Postgres 16 service)
↓
typecheck:all
↓
lint
↓
unit tests (API)
↓
integration tests (RLS + cross-tenant)
↓
build API / worker / web
```

Cache pnpm via `actions/setup-node`.

### Full smoke — `.github/workflows/smoke-assessment.yml`

`workflow_dispatch` apenas (não roda em todo PR).

Local:

```powershell
pnpm smoke:assessment-engine
```

Requer API + seed demo (`owner@` / `aluno@` / `professor@` + `Eduvy@2026!`).

Staging: configurar secret `EDUVY_BFF_SECRET` e disparar o workflow com a URL da API.

## Scripts raiz

| Script | Uso |
|--------|-----|
| `pnpm ci:db-prepare` | generate + migrate deploy + roles/RLS |
| `pnpm test:unit` | Jest API |
| `pnpm test:integration` | Jest database RLS |
| `pnpm smoke:assessment-engine` | smoke ponta a ponta |

## Decisão — imutabilidade de questões

**Estratégia A (Gate 10):** avaliação `PUBLISHED` com assignments ou attempts → `ASSESSMENT_LOCKED` (questões não editáveis).

Alinha ao princípio de Course Version: conteúdo consumido pelo aluno não muda silenciosamente.

## Security review (Assessment Engine)

| # | Ataque | Resultado esperado | Status |
|---|--------|-------------------|--------|
| A | Aluno acessa attempt de outro | 403/404 | coberto (ownership) |
| B | Cross-tenant assessment | RLS + tenant header | coberto (integration) |
| C | `assessmentId` adulterado no start | start só via assignment | coberto Gate 10 |
| D | Answer para question fora do assessment | rejeitado no save | coberto Gate 9 |
| E | Aluno lê endpoint admin/gabarito | 403 / DTO sem key | coberto smokes |
| F | Mutar answer pós-submit | rejeitado | smoke engine |
| G | Double submit | idempotente | smoke attempts |
| H | Relógio local | timer server-side `expiresAt` | Gate 9 |
| I | Start após deadline | `ASSESSMENT_DEADLINE_PASSED` | availability |
| J | Results sem permissão | 403 | smoke engine |

## Staging / produção

- **Deploy produção:** não executado nesta iniciativa.
- **Staging:** não configurado no repositório; documentar quando existir URL + secrets.

## Release checklist

Ver [ASSESSMENT_ENGINE_1_READINESS.md](../release/ASSESSMENT_ENGINE_1_READINESS.md).
