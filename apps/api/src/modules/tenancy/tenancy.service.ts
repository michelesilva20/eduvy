import { Injectable, NotFoundException } from "@nestjs/common";
import type { TenantSummaryDto } from "@eduvy/contracts";
import { PrismaClient } from "@eduvy/database";
import { InjectPrisma } from "../../common/database/database.module";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class TenancyService {
  constructor(
    @InjectPrisma() private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
  ) {}

  async listUserTenants(userId: string): Promise<TenantSummaryDto[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        tenant: {
          include: {
            subscriptions: {
              where: { status: { in: ["TRIAL", "ACTIVE"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                planVersion: {
                  include: { plan: true },
                },
              },
            },
          },
        },
        roleAssignments: {
          include: { tenantRole: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((membership: (typeof memberships)[number]) => {
      const subscription = membership.tenant.subscriptions[0];
      const role = membership.roleAssignments[0]?.tenantRole;

      return {
        id: membership.tenant.id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        planName: subscription?.planVersion.plan.name ?? null,
        roleName: role?.name ?? null,
        membershipId: membership.id,
      };
    });
  }

  async assertUserTenantAccess(userId: string, tenantId: string): Promise<TenantSummaryDto> {
    const tenants = await this.listUserTenants(userId);
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      throw new NotFoundException({
        code: "TENANT_NOT_FOUND",
        message: "Organização não encontrada ou sem acesso.",
      });
    }
    return tenant;
  }

  async onboardTenant(input: {
    name: string;
    slug: string;
    ownerUserId: string;
    planVersionId: string;
    requestId: string;
    idempotencyKey?: string;
  }): Promise<{ id: string; name: string; slug: string; status: string }> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          status: "PROVISIONING",
        },
      });

      const membership = await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId: input.ownerUserId,
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });

      const ownerRole = await tx.tenantRole.create({
        data: {
          tenantId: tenant.id,
          code: "TENANT_OWNER",
          name: "Proprietário",
          isSystem: true,
        },
      });

      await tx.membershipRoleAssignment.create({
        data: {
          tenantId: tenant.id,
          membershipId: membership.id,
          tenantRoleId: ownerRole.id,
          scopeType: "TENANT",
          assignedBy: input.ownerUserId,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planVersionId: input.planVersionId,
          status: "TRIAL",
          startsAt: new Date(),
        },
      });

      await tx.outboxEvent.create({
        data: {
          tenantId: tenant.id,
          aggregateType: "tenant",
          aggregateId: tenant.id,
          eventType: "tenant.created",
          payload: { tenantId: tenant.id, slug: tenant.slug },
          idempotencyKey: input.idempotencyKey,
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: { status: "ACTIVE" },
      });

      await this.audit.record({
        tenantId: tenant.id,
        actorType: "USER",
        actorUserId: input.ownerUserId,
        action: "tenant.created",
        resourceType: "tenant",
        resourceId: tenant.id,
        requestId: input.requestId,
      });

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      };
    });
  }
}
