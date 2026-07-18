import { Injectable } from "@nestjs/common";
import { InjectTenantDb } from "../../common/database/database.module";
import { TenantDatabase } from "@eduvy/database";

interface PermissionCheckInput {
  userId: string;
  tenantId: string;
  permission: string;
}

@Injectable()
export class AuthorizationService {
  constructor(@InjectTenantDb() private readonly tenantDb: TenantDatabase) {}

  async hasPermission(input: PermissionCheckInput): Promise<boolean> {
    const requestId = "authz-check";
    const rows = await this.tenantDb.run(
      { tenantId: input.tenantId, userId: input.userId, requestId },
      async (tx) =>
        tx.membershipRoleAssignment.findMany({
          where: {
            membership: {
              userId: input.userId,
              status: "ACTIVE",
            },
            tenantRole: {
              permissions: {
                some: {
                  permission: { code: input.permission },
                },
              },
            },
          },
          take: 1,
        }),
    );
    return rows.length > 0;
  }
}
