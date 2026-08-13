import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { BffSecretGuard } from "./common/guards/bff-secret.guard";
import { EntitlementGuard } from "./common/guards/entitlement.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionGuard } from "./common/guards/permission.guard";
import { TenantGuard } from "./common/guards/tenant.guard";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthorizationModule } from "./modules/authorization/authorization.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { DatabaseModule } from "./common/database/database.module";
import { EntitlementsModule } from "./modules/entitlements/entitlements.module";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { TenancyModule } from "./modules/tenancy/tenancy.module";
import { ConfigModule } from "./common/config/config.module";
import { LoggingModule } from "./common/logging/logging.module";

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    DatabaseModule,
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 120 },
      { name: "auth", ttl: 60_000, limit: 20 },
    ]),
    HealthModule,
    IdentityModule,
    TenancyModule,
    AuthorizationModule,
    EntitlementsModule,
    AuditModule,
    OutboxModule,
    CoursesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_GUARD, useClass: EntitlementGuard },
    { provide: APP_GUARD, useClass: BffSecretGuard },
  ],
})
export class AppModule {}
