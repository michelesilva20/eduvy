import { Injectable } from "@nestjs/common";
import { InjectPrisma } from "../../common/database/database.module";
import { PrismaClient } from "@eduvy/database";

@Injectable()
export class OutboxService {
  constructor(@InjectPrisma() private readonly prisma: PrismaClient) {}

  async fetchPendingBatch(limit = 50) {
    return this.prisma.$queryRaw<
      Array<{ id: string; event_type: string; payload: unknown; tenant_id: string | null }>
    >`
      SELECT id, event_type, payload, tenant_id
      FROM outbox_events
      WHERE status = 'PENDING' AND available_at <= NOW()
      ORDER BY occurred_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;
  }

  async markPublished(id: string) {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }
}
