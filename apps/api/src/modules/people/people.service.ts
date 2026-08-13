import { createHash, randomBytes } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateInvitationResponseDto,
  InvitationListItemDto,
  PaginatedInvitationsDto,
  PaginatedPeopleDto,
  PersonDetailDto,
} from "@eduvy/contracts";
import { Prisma, TenantDatabase } from "@eduvy/database";
import { InjectTenantDb } from "../../common/database/database.module";
import { mapInvitation, mapPersonDetail, mapPersonListItem } from "./people.mapper";

type TenantCtx = { tenantId: string; userId: string; requestId: string };

const membershipInclude = {
  user: true,
  roleAssignments: {
    where: {
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    include: { tenantRole: true },
  },
} satisfies Prisma.MembershipInclude;

const invitationInclude = {
  roles: { include: { tenantRole: true } },
} satisfies Prisma.InvitationInclude;

@Injectable()
export class PeopleService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  listStudents(
    input: TenantCtx & { search?: string; status?: string; page?: number; limit?: number },
  ): Promise<PaginatedPeopleDto> {
    return this.listByRole({ ...input, roleCode: "STUDENT" });
  }

  listInstructors(
    input: TenantCtx & { search?: string; status?: string; page?: number; limit?: number },
  ): Promise<PaginatedPeopleDto> {
    return this.listByRole({ ...input, roleCode: "INSTRUCTOR" });
  }

  getStudent(
    input: TenantCtx & { membershipId: string },
  ): Promise<PersonDetailDto> {
    return this.getByRole({ ...input, roleCode: "STUDENT" });
  }

  getInstructor(
    input: TenantCtx & { membershipId: string },
  ): Promise<PersonDetailDto> {
    return this.getByRole({ ...input, roleCode: "INSTRUCTOR" });
  }

  listInvitations(
    input: TenantCtx & { status?: string; page?: number; limit?: number },
  ): Promise<PaginatedInvitationsDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(50, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: Prisma.InvitationWhereInput = {};
        if (input.status) {
          where.status = input.status as Prisma.InvitationWhereInput["status"];
        }

        const [total, rows] = await Promise.all([
          tx.invitation.count({ where }),
          tx.invitation.findMany({
            where,
            include: invitationInclude,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map(mapInvitation),
          meta: { page, limit, total, hasMore: skip + rows.length < total },
        };
      },
    );
  }

  createInvitation(
    input: TenantCtx & { email: string; roleCodes: string[] },
  ): Promise<CreateInvitationResponseDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const email = input.email.trim().toLowerCase();
        if (!email.includes("@")) {
          throw new BadRequestException({
            code: "INVALID_EMAIL",
            message: "E-mail inválido.",
          });
        }

        const roles = await tx.tenantRole.findMany({
          where: { code: { in: input.roleCodes } },
        });
        if (roles.length !== input.roleCodes.length) {
          throw new BadRequestException({
            code: "INVALID_ROLE",
            message: "Um ou mais papéis informados não existem neste tenant.",
          });
        }

        const existingMember = await tx.membership.findFirst({
          where: { user: { email } },
          include: { user: true },
        });
        if (existingMember?.status === "ACTIVE") {
          throw new BadRequestException({
            code: "MEMBER_ALREADY_ACTIVE",
            message: "Este e-mail já possui acesso ativo ao tenant.",
          });
        }

        const pending = await tx.invitation.findFirst({
          where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
        });
        if (pending) {
          throw new BadRequestException({
            code: "INVITATION_PENDING",
            message: "Já existe um convite pendente para este e-mail.",
          });
        }

        const inviteToken = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invitation = await tx.invitation.create({
          data: {
            tenantId: input.tenantId,
            email,
            tokenHash,
            status: "PENDING",
            expiresAt,
            invitedBy: input.userId,
            lastSentAt: new Date(),
          },
        });

        await tx.invitationRole.createMany({
          data: roles.map((role) => ({
            tenantId: input.tenantId,
            invitationId: invitation.id,
            tenantRoleId: role.id,
          })),
        });

        const invitationWithRoles = await tx.invitation.findFirstOrThrow({
          where: { id: invitation.id },
          include: invitationInclude,
        });

        await tx.auditLog.create({
          data: {
            tenantId: input.tenantId,
            actorType: "USER",
            actorUserId: input.userId,
            action: "invitation.created",
            resourceType: "invitation",
            resourceId: invitationWithRoles.id,
            requestId: input.requestId,
          },
        });

        return {
          invitation: mapInvitation(invitationWithRoles),
          inviteToken,
        };
      },
    );
  }

  revokeInvitation(input: TenantCtx & { invitationId: string }): Promise<InvitationListItemDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const invitation = await tx.invitation.findFirst({
          where: { id: input.invitationId },
          include: invitationInclude,
        });
        if (!invitation) {
          throw new NotFoundException({
            code: "INVITATION_NOT_FOUND",
            message: "Convite não encontrado.",
          });
        }
        if (invitation.status !== "PENDING") {
          throw new BadRequestException({
            code: "INVITATION_NOT_REVOKABLE",
            message: "Somente convites pendentes podem ser revogados.",
          });
        }

        const updated = await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "REVOKED", revokedAt: new Date() },
          include: invitationInclude,
        });

        return mapInvitation(updated);
      },
    );
  }

  private async listByRole(
    input: TenantCtx & {
      roleCode: string;
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedPeopleDto> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(50, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const where: Prisma.MembershipWhereInput = {
          roleAssignments: {
            some: {
              tenantRole: { code: input.roleCode },
              OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
            },
          },
        };

        if (input.status) {
          where.status = input.status as Prisma.MembershipWhereInput["status"];
        }

        if (input.search?.trim()) {
          const q = input.search.trim();
          where.user = {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          };
        }

        const [total, rows] = await Promise.all([
          tx.membership.count({ where }),
          tx.membership.findMany({
            where,
            include: membershipInclude,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
        ]);

        return {
          items: rows.map(mapPersonListItem),
          meta: { page, limit, total, hasMore: skip + rows.length < total },
        };
      },
    );
  }

  private async getByRole(
    input: TenantCtx & { membershipId: string; roleCode: string },
  ): Promise<PersonDetailDto> {
    return this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId: input.requestId },
      async (tx) => {
        const row = await tx.membership.findFirst({
          where: {
            id: input.membershipId,
            roleAssignments: {
              some: {
                tenantRole: { code: input.roleCode },
                OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
              },
            },
          },
          include: membershipInclude,
        });

        if (!row) {
          throw new NotFoundException({
            code: "PERSON_NOT_FOUND",
            message: "Pessoa não encontrada.",
          });
        }

        return mapPersonDetail(row);
      },
    );
  }
}
