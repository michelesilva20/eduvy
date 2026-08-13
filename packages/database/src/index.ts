import {
  CourseStatus,
  CourseVisibility,
  CourseVersionStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export type TenantContext = {
  tenantId: string;
  userId: string;
  requestId: string;
};

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class TenantDatabase {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(context: TenantContext, fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx: TransactionClient) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${context.tenantId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', ${context.userId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.request_id', ${context.requestId}, true)`;
      return fn(tx);
    });
  }

  /** Operações globais (control plane) — sem contexto de tenant. */
  global(): PrismaClient {
    return this.prisma;
  }
}

export {
  CourseStatus,
  CourseVisibility,
  CourseVersionStatus,
  Prisma,
  PrismaClient,
};
