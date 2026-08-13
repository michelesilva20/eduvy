import { Injectable } from "@nestjs/common";
import { InjectTenantDb } from "../../common/database/database.module";
import { TenantDatabase } from "@eduvy/database";

@Injectable()
export class EntitlementService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  async assert(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    moduleCode: string;
    capability: string;
  }): Promise<void> {
    const entitlement = await this.tenantDb.run(
      {
        tenantId: input.tenantId,
        userId: input.userId,
        requestId: input.requestId,
      },
      async (tx) =>
        tx.tenantEntitlement.findFirst({
          where: {
            isEnabled: true,
            capability: input.capability,
            module: { code: input.moduleCode },
          },
        }),
    );

    if (!entitlement) {
      throw new Error("ENTITLEMENT_DENIED");
    }
  }

  async isEnabled(input: {
    tenantId: string;
    userId: string;
    requestId: string;
    moduleCode: string;
    capability: string;
  }): Promise<boolean> {
    try {
      await this.assert(input);
      return true;
    } catch {
      return false;
    }
  }
}
