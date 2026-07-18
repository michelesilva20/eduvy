# ADR-001: Monólito modular

**Status:** Aceito

NestJS monolith com fronteiras de domínio rígidas. Extração para microserviços apenas quando necessário.

# ADR-002: Shared database + RLS

**Status:** Aceito

Um PostgreSQL com `tenant_id` + RLS. Enterprise dedicado fica para fase posterior.

# ADR-003: Prisma + SQL raw

**Status:** Aceito

Prisma para schema/DML; SQL separado para RLS, roles e hardening.

# ADR-004: Redis + BullMQ

**Status:** Aceito

Filas assíncronas; Redis não é source of truth.

# ADR-005: Transactional outbox

**Status:** Aceito

Eventos de domínio na mesma transação; dispatcher no worker.

# ADR-006: RBAC + Scope + ABAC

**Status:** Aceito

Permissões explícitas; escopos COURSE, COHORT, TENANT, etc.
