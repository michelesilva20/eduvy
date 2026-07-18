import { Queue } from "bullmq";
import type { Logger } from "@eduvy/logger";
import { QUEUE_NAMES } from "@eduvy/contracts";
import type { PrismaClient } from "@eduvy/database";

export function createOutboxDispatcher(input: {
  prisma: PrismaClient;
  connection: { url: string };
  logger: Logger;
}) {
  const outboxQueue = new Queue(QUEUE_NAMES.OUTBOX, { connection: input.connection });

  return setInterval(async () => {
    const batch = await input.prisma.$queryRaw<
      Array<{ id: string; event_type: string; payload: unknown; tenant_id: string | null }>
    >`
      SELECT id, event_type, payload, tenant_id
      FROM outbox_events
      WHERE status = 'PENDING' AND available_at <= NOW()
      ORDER BY occurred_at ASC
      LIMIT 25
      FOR UPDATE SKIP LOCKED
    `;

    for (const event of batch) {
      await outboxQueue.add(event.event_type, {
        outboxEventId: event.id,
        tenantId: event.tenant_id,
        payload: event.payload,
      });
      await input.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      input.logger.info({ outboxEventId: event.id, eventType: event.event_type }, "Outbox published");
    }
  }, 5_000);
}
