import { Global, Inject, Module, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient, TenantDatabase } from "@eduvy/database";
import type { ApiEnv } from "@eduvy/config";
import { API_ENV } from "../config/config.module";

export const PRISMA = Symbol("PRISMA");
export const TENANT_DB = Symbol("TENANT_DB");

class PrismaShutdownHook implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaClient) {}

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PRISMA,
      inject: [API_ENV],
      useFactory: (env: ApiEnv) =>
        new PrismaClient({
          datasources: { db: { url: env.DATABASE_URL } },
        }),
    },
    {
      provide: TENANT_DB,
      inject: [PRISMA],
      useFactory: (prisma: PrismaClient) => new TenantDatabase(prisma),
    },
    {
      provide: PrismaShutdownHook,
      inject: [PRISMA],
      useFactory: (prisma: PrismaClient) => new PrismaShutdownHook(prisma),
    },
  ],
  exports: [PRISMA, TENANT_DB],
})
export class DatabaseModule {}

export const InjectPrisma = () => Inject(PRISMA);
export const InjectTenantDb = () => Inject(TENANT_DB);
