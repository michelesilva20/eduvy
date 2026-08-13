# Gate 3 — People (Students / Instructors)

## Modelo

Aluno e professor **não** são entidades separadas — são **papéis de membership** no tenant:

`User` (global) → `Membership` → `MembershipRoleAssignment` → `TenantRole` (`STUDENT` | `INSTRUCTOR`)

Convites reutilizam `Invitation` + `InvitationRole`.

## Endpoints

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/students` | `students.read` |
| GET | `/students/:membershipId` | `students.read` |
| POST | `/students/invite` | `students.manage` |
| GET | `/instructors` | `instructors.read` |
| GET | `/instructors/:membershipId` | `instructors.read` |
| POST | `/instructors/invite` | `instructors.manage` |
| GET | `/invitations` | `members.read` |
| POST | `/invitations/:id/revoke` | `members.invite` |

Todas exigem JWT, tenant, entitlement `CORE_COURSES`.

## Regras

- Listagem paginada server-side com busca por nome/e-mail
- Turmas, cursos ativos e progresso retornam `0`/`null` até Gates 4–6
- Convite cria registro `PENDING` com token hash (token retornado uma vez na API demo)
- Aceite de convite → integração com identity (futuro)

## Frontend

- `/app/students` — listagem + convite
- `/app/students/:id` — detalhe
- `/app/teachers` — listagem + convite
- `/app/teachers/:id` — detalhe
- BFF em `/api/students/*`, `/api/instructors/*`

## Seed demo (Escola Horizonte)

- `aluno@horizonte.demo` / `Eduvy@2026!` — papel STUDENT
- `professor@horizonte.demo` / `Eduvy@2026!` — papel INSTRUCTOR

## Smoke test

```bash
node --env-file=.env scripts/smoke-people-api.mjs
```
