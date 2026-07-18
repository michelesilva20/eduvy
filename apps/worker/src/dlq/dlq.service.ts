import type { Logger } from "@eduvy/logger";
import { Prisma, type PrismaClient } from "@eduvy/database";

export function registerDlqHandler(input: { prisma: PrismaClient; logger: Logger }) {
  input.logger.info("DLQ persistence handler registered");
}

export async function persistDeadLetterJob(
  prisma: PrismaClient,
  input: {
    tenantId?: string;
    originalQueue: string;
    originalJobId: string;
    jobName: string;
    payload: Record<string, unknown>;
    errorCode?: string;
    errorMessage?: string;
    attempts: number;
  },
) {
  await prisma.deadLetterJob.create({
    data: {
      tenantId: input.tenantId,
      originalQueue: input.originalQueue,
      originalJobId: input.originalJobId,
      jobName: input.jobName,
      payload: input.payload as Prisma.InputJsonValue,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage?.slice(0, 2000),
      attempts: input.attempts,
      firstFailedAt: new Date(),
      lastFailedAt: new Date(),
      status: "OPEN",
    },
  });
}
