import { Global, Module } from "@nestjs/common";
import { TenantsController } from "./tenants.controller";
import { TenancyService } from "./tenancy.service";

@Global()
@Module({
  controllers: [TenantsController],
  providers: [TenancyService],
  exports: [TenancyService],
})
export class TenancyModule {}
