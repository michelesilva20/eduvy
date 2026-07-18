import { Worker } from "bullmq";
import { loadWorkerEnv } from "@eduvy/config";
import { QUEUE_NAMES } from "@eduvy/contracts";
import { PrismaClient } from "@eduvy/database";
import { createLogger } from "@eduvy/logger";
import { createOutboxDispatcher } from "./queues/outbox.dispatcher";
import { registerDlqHandler } from "./dlq/dlq.service";

async function bootstrap() {
  const env = loadWorkerEnv();
  const logger = createLogger({
    service: env.EDUVY_SERVICE,
    environment: env.NODE_ENV,
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === "development",
  });

  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
  const connection = { url: env.REDIS_URL };

  const workers = [
    new Worker(
      QUEUE_NAMES.EMAIL,
      async (job) => {
        logger.info({ jobId: job.id, name: job.name }, "Processing email job");
      },
      { connection },
    ),
    new Worker(
      QUEUE_NAMES.OUTBOX,
      async (job) => {
        logger.info({ jobId: job.id }, "Outbox fan-out placeholder");
      },
      { connection },
    ),
  ];

  registerDlqHandler({ prisma, logger });
  const outboxInterval = createOutboxDispatcher({ prisma, connection, logger });

  logger.info("Eduvy worker started");

  const shutdown = async () => {
    clearInterval(outboxInterval);
    await Promise.all(workers.map((worker) => worker.close()));
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
