import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "tenant.read",
  "tenant.update",
  "members.read",
  "members.invite",
  "courses.read",
  "courses.create",
  "courses.update",
  "courses.publish",
  "courses.delete",
  "course_content.read",
  "course_content.manage",
  "students.read",
  "students.manage",
  "instructors.read",
  "instructors.manage",
  "cohorts.read",
  "cohorts.create",
  "cohorts.update",
  "cohorts.manage_students",
  "enrollments.read",
  "enrollments.create",
  "enrollments.cancel",
  "learning_progress.read",
  "questions.read",
  "questions.manage",
  "assessments.read",
  "assessments.create",
  "assessments.update",
  "assessments.publish",
  "assessments.attempt",
  "audit.read",
  "entitlements.read",
];

const MODULES = [
  { code: "CORE_COURSES", name: "Cursos (núcleo)" },
  { code: "ESSAYS", name: "Redações" },
  { code: "SIMULATIONS", name: "Simulados" },
  { code: "QUESTION_BANK", name: "Banco de questões" },
  { code: "GAMIFICATION", name: "Gamificação" },
  { code: "CERTIFICATES", name: "Certificados" },
  { code: "ADVANCED_ANALYTICS", name: "Analytics avançado" },
  { code: "INTEGRATIONS", name: "Integrações" },
];

async function main() {
  for (const code of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: code },
    });
  }

  for (const mod of MODULES) {
    await prisma.moduleCatalog.upsert({
      where: { code: mod.code },
      update: {},
      create: { code: mod.code, name: mod.name, description: mod.name },
    });
  }

  const plan = await prisma.plan.upsert({
    where: { code: "STARTER" },
    update: {},
    create: { code: "STARTER", name: "Starter", description: "Plano inicial" },
  });

  const planVersion = await prisma.planVersion.upsert({
    where: { planId_version: { planId: plan.id, version: 1 } },
    update: { isCurrent: true },
    create: { planId: plan.id, version: 1, isCurrent: true },
  });

  const coreModule = await prisma.moduleCatalog.findUniqueOrThrow({
    where: { code: "CORE_COURSES" },
  });

  await prisma.planEntitlement.upsert({
    where: {
      planVersionId_moduleId_capability: {
        planVersionId: planVersion.id,
        moduleId: coreModule.id,
        capability: "courses",
      },
    },
    update: {},
    create: {
      planVersionId: planVersion.id,
      moduleId: coreModule.id,
      capability: "courses",
      limitValue: 50,
    },
  });

  const passwordHash = await argon2.hash("Eduvy@2026!", { type: argon2.argon2id });

  const owner = await prisma.user.upsert({
    where: { email: "owner@horizonte.demo" },
    update: {},
    create: {
      email: "owner@horizonte.demo",
      fullName: "Ana Proprietária",
      emailVerifiedAt: new Date(),
      authIdentities: { create: { provider: "EMAIL", passwordHash } },
    },
  });

  const allPermissions = await prisma.permission.findMany({
    where: { code: { in: PERMISSIONS } },
  });

  const tenants = [
    { name: "Escola Horizonte", slug: "escola-horizonte" },
    { name: "Academia Corporativa Atlas", slug: "academia-atlas" },
    { name: "Preparatório Prisma", slug: "preparatorio-prisma" },
  ];

  for (const data of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: data.slug },
      update: {},
      create: { ...data, status: "ACTIVE" },
    });

    const membership = await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
      update: { status: "ACTIVE" },
      create: {
        tenantId: tenant.id,
        userId: owner.id,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    const role = await prisma.tenantRole.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "TENANT_OWNER" } },
      update: {},
      create: {
        tenantId: tenant.id,
        code: "TENANT_OWNER",
        name: "Proprietário",
        isSystem: true,
      },
    });

    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          tenantRoleId_permissionId: {
            tenantRoleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          tenantRoleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    const existingAssignment = await prisma.membershipRoleAssignment.findFirst({
      where: { tenantId: tenant.id, membershipId: membership.id, tenantRoleId: role.id },
    });
    if (!existingAssignment) {
      await prisma.membershipRoleAssignment.create({
        data: {
          tenantId: tenant.id,
          membershipId: membership.id,
          tenantRoleId: role.id,
          scopeType: "TENANT",
          assignedBy: owner.id,
        },
      });
    }

    await prisma.subscription
      .create({
        data: {
          tenantId: tenant.id,
          planVersionId: planVersion.id,
          status: "TRIAL",
          startsAt: new Date(),
        },
      })
      .catch(async () => {
        /* subscription may already exist */
      });

    await prisma.tenantEntitlement.upsert({
      where: {
        tenantId_moduleId_capability: {
          tenantId: tenant.id,
          moduleId: coreModule.id,
          capability: "courses",
        },
      },
      update: { isEnabled: true },
      create: {
        tenantId: tenant.id,
        moduleId: coreModule.id,
        capability: "courses",
        isEnabled: true,
        limitValue: 50,
      },
    });

    const roleDefs = [
      { code: "STUDENT", name: "Aluno" },
      { code: "INSTRUCTOR", name: "Professor" },
      { code: "ACADEMIC_MANAGER", name: "Gestor acadêmico" },
    ] as const;

    for (const def of roleDefs) {
      await prisma.tenantRole.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: def.code } },
        update: {},
        create: {
          tenantId: tenant.id,
          code: def.code,
          name: def.name,
          isSystem: true,
        },
      });
    }
  }

  const horizonte = await prisma.tenant.findUniqueOrThrow({
    where: { slug: "escola-horizonte" },
  });

  async function ensureMemberWithRole(input: {
    email: string;
    fullName: string;
    roleCode: string;
  }) {
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: { fullName: input.fullName },
      create: {
        email: input.email,
        fullName: input.fullName,
        emailVerifiedAt: new Date(),
        authIdentities: { create: { provider: "EMAIL", passwordHash } },
      },
    });

    const membership = await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: horizonte.id, userId: user.id } },
      update: { status: "ACTIVE" },
      create: {
        tenantId: horizonte.id,
        userId: user.id,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    const role = await prisma.tenantRole.findUniqueOrThrow({
      where: { tenantId_code: { tenantId: horizonte.id, code: input.roleCode } },
    });

    const existingAssignment = await prisma.membershipRoleAssignment.findFirst({
      where: {
        tenantId: horizonte.id,
        membershipId: membership.id,
        tenantRoleId: role.id,
      },
    });

    if (!existingAssignment) {
      await prisma.membershipRoleAssignment.create({
        data: {
          tenantId: horizonte.id,
          membershipId: membership.id,
          tenantRoleId: role.id,
          scopeType: "TENANT",
          assignedBy: owner.id,
        },
      });
    }
  }

  await ensureMemberWithRole({
    email: "aluno@horizonte.demo",
    fullName: "Bruno Aluno",
    roleCode: "STUDENT",
  });

  await ensureMemberWithRole({
    email: "professor@horizonte.demo",
    fullName: "Carla Professora",
    roleCode: "INSTRUCTOR",
  });

  const studentPermissionCodes = [
    "learning_progress.read",
    "assessments.attempt",
  ] as const;

  const studentPermissions = await prisma.permission.findMany({
    where: { code: { in: [...studentPermissionCodes] } },
  });

  const instructorPermissionCodes = [
    "courses.read",
    "cohorts.read",
    "enrollments.read",
    "learning_progress.read",
    "students.read",
    "instructors.read",
    "questions.read",
    "questions.manage",
    "assessments.read",
    "assessments.create",
    "assessments.update",
    "assessments.publish",
    "assessments.attempt",
  ] as const;

  const instructorPermissions = await prisma.permission.findMany({
    where: { code: { in: [...instructorPermissionCodes] } },
  });

  for (const tenant of await prisma.tenant.findMany()) {
    const studentRole = await prisma.tenantRole.findUnique({
      where: { tenantId_code: { tenantId: tenant.id, code: "STUDENT" } },
    });
    if (studentRole) {
      for (const permission of studentPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            tenantRoleId_permissionId: {
              tenantRoleId: studentRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            tenantId: tenant.id,
            tenantRoleId: studentRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    const instructorRole = await prisma.tenantRole.findUnique({
      where: { tenantId_code: { tenantId: tenant.id, code: "INSTRUCTOR" } },
    });
    if (!instructorRole) continue;

    for (const permission of instructorPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          tenantRoleId_permissionId: {
            tenantRoleId: instructorRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          tenantRoleId: instructorRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
