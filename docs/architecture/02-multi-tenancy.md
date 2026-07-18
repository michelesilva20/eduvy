# Multi-tenancy

## Modelo

- Banco compartilhado, schema compartilhado
- `tenant_id NOT NULL` em todas as tabelas de dados do cliente
- RLS com `app.tenant_id` (transação local via `set_config(..., true)`)

## Control plane vs tenant data

**Global:** users, sessions, tenants, plans, module_catalog, subscriptions, platform_audit_logs

**Tenant-scoped:** memberships, courses, cohorts, files, audit_logs (tenant_id), etc.

## Contexto de transação

```typescript
await tenantDatabase.run({ tenantId, userId, requestId }, async (tx) => {
  // usar exclusivamente tx
});
```

Nunca usar Prisma global para operações tenant-scoped.

## Evolução futura

- Tenant enterprise em banco dedicado
- White-label / domínio customizado via `tenant_domains`
- Migração de tenant entre regiões
