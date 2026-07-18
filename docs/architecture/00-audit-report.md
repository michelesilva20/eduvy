# Eduvy — Relatório de Auditoria (Fase 0)

**Data:** 2026-07-17  
**Escopo:** Fundação backend SaaS

## Estado anterior

| Área | Situação | Nota |
|------|----------|------|
| Backend / API | Inexistente | 0/10 |
| Banco de dados | Inexistente (mocks em `src/mocks/`) | 0/10 |
| Autenticação real | Apenas UI de login mock | 0/10 |
| Multi-tenancy | Não implementado | 0/10 |
| Filas / Worker | Inexistente | 0/10 |
| Docker / Infra local | Inexistente | 0/10 |
| Testes backend | Inexistente | 0/10 |
| CI/CD backend | Inexistente | 0/10 |
| Frontend Next.js | Implementado (landing + login + `/app/*`) | 8/10 |
| Design system / UX | Consistente, tokens CSS, componentes | 8/10 |

**Nota arquitetura anterior (backend): 0/10**  
**Nota frontend existente: 8/10**

## Stack identificada

- **Monorepo:** Não (single Next.js app)
- **Package manager:** pnpm (lock presente) + package-lock.json legado
- **Frontend:** Next.js 16, React 19, TypeScript strict, Tailwind v4
- **Dados:** Mocks centralizados em `src/mocks/platform/index.ts`
- **ORM / DB:** Nenhum
- **Autenticação:** Nenhuma (redirect mock para `/app`)

## Riscos do estado anterior

1. Plataforma inteiramente mockada — sem isolamento de tenant.
2. Impossibilidade de evoluir módulos contratáveis sem backend.
3. Ausência de auditoria, sessões e autorização.
4. Frontend acoplado a dados fictícios — migração exigirá contratos API.

## Decisões de migração

1. **Preservar** o frontend Next.js na raiz (`@eduvy/web`) — sem mover para `apps/web` nesta fase.
2. **Adicionar** `apps/api`, `apps/worker` e `packages/*` via pnpm workspaces.
3. **Não remover** mocks do frontend até integração gradual (Fase posterior).
4. **Excluir** `apps/` e `packages/` do `tsconfig.json` do Next.js.

## Divergências vs especificação

| Especificação | Implementação nesta fase |
|---------------|-------------------------|
| `apps/web/` | Web permanece na raiz por compatibilidade |
| Todos os módulos de negócio | Alicerce + domínio educacional inicial apenas |
| SSO / SAML / SCIM | Arquitetura preparada, não implementado |
| OpenTelemetry completo | Bootstrap + hooks; exportador configurável |
| GitHub Actions | Estrutura documentada; pipeline em fase 8 |

## Plano de fases

Ver `docs/architecture/00-overview.md` e ADRs em `docs/adr/`.
