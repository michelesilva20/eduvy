import type {
  InvitationListItemDto,
  PersonDetailDto,
  PersonListItemDto,
} from "@eduvy/contracts";
import type { Prisma } from "@eduvy/database";

type MembershipWithUser = Prisma.MembershipGetPayload<{
  include: {
    user: true;
    roleAssignments: { include: { tenantRole: true } };
  };
}>;

export function mapPersonListItem(row: MembershipWithUser): PersonListItemDto {
  const roles = row.roleAssignments.map((a) => a.tenantRole.code);
  return {
    membershipId: row.id,
    userId: row.userId,
    fullName: row.user.fullName,
    email: row.user.email,
    status: row.status as PersonListItemDto["status"],
    roles,
    joinedAt: row.joinedAt?.toISOString() ?? null,
    cohortsCount: 0,
    activeCoursesCount: 0,
    progressPercent: null,
  };
}

export function mapPersonDetail(row: MembershipWithUser): PersonDetailDto {
  return {
    ...mapPersonListItem(row),
    invitedAt: row.invitedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapInvitation(
  row: Prisma.InvitationGetPayload<{ include: { roles: { include: { tenantRole: true } } } }>,
): InvitationListItemDto {
  return {
    id: row.id,
    email: row.email,
    status: row.status as InvitationListItemDto["status"],
    roles: row.roles.map((r) => r.tenantRole.code),
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    lastSentAt: row.lastSentAt?.toISOString() ?? null,
  };
}
