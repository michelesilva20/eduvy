# Row-Level Security (RLS)

## Política padrão

```sql
tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
```

- `ENABLE ROW LEVEL SECURITY`
- `FORCE ROW LEVEL SECURITY`
- Ausência de contexto → nega acesso

## Roles PostgreSQL

| Role | Uso |
|------|-----|
| `eduvy_migration` | Migrações Prisma + SQL |
| `eduvy_app` | Runtime da API/worker — sem BYPASSRLS |
| `eduvy_readonly` | Observabilidade somente leitura |

## Verificação

```bash
pnpm db:verify-rls
```

## Testes adversariais

Ver `packages/database/tests/rls.integration.test.ts`
