import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@eduvy/database";
import { InjectPrisma } from "../../common/database/database.module";

export interface AuditInput {
  tenantId?: string;
  actorType: "USER" | "SYSTEM" | "SUPPORT" | "API_KEY";
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@InjectPrisma() private readonly prisma: PrismaClient) {}

  async record(input: AuditInput) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorType: input.actorType,
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        requestId: input.requestId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
