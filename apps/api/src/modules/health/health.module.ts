import { Inject, Module } from "@nestjs/common";
import { Controller, Get } from "@nestjs/common";
import type { ApiEnv } from "@eduvy/config";
import { PrismaClient } from "@eduvy/database";
import Redis from "ioredis";
import { Public } from "../../common/auth/decorators";
import { API_ENV } from "../../common/config/config.module";
import { InjectPrisma } from "../../common/database/database.module";

@Controller("health")
export class HealthController {
  private readonly redis: Redis;

  constructor(
    @InjectPrisma() private readonly prisma: PrismaClient,
    @Inject(API_ENV) env: ApiEnv,
  ) {
    this.redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  }

  @Public()
  @Get("live")
  live() {
    return { status: "ok", service: "api", timestamp: new Date().toISOString() };
  }

  @Public()
  @Get("ready")
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.redis.connect();
    await this.redis.ping();
    await this.redis.quit();
    return { status: "ok", service: "api", timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
