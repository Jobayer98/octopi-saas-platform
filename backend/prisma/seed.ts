import {
  PrismaClient,
  Role,
  OrgStatus,
  SubscriptionStatus,
  BillingInterval,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const SEED_USERS = {
  platformAdmin: {
    email: "admin@platform.dev",
    password: "Passw0rd!123",
    name: "Platform Admin",
  },
  orgAdmin: {
    email: "admin@acme.dev",
    password: "Passw0rd!123",
    name: "Acme Admin",
  },
  orgMember: {
    email: "member@acme.dev",
    password: "Passw0rd!123",
    name: "Acme Member",
  },
};

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seedPlans() {
  const plans = [
    {
      name: "Starter",
      priceCents: 2900,
      billingInterval: BillingInterval.MONTHLY,
      features: ["Up to 5 members", "Basic support", "Core features"],
    },
    {
      name: "Growth",
      priceCents: 9900,
      billingInterval: BillingInterval.MONTHLY,
      features: [
        "Up to 25 members",
        "Priority support",
        "All features",
        "Usage analytics",
      ],
    },
    {
      name: "Growth (Annual)",
      priceCents: 99000,
      billingInterval: BillingInterval.YEARLY,
      features: [
        "Up to 25 members",
        "Priority support",
        "All features",
        "Usage analytics",
        "2 months free",
      ],
    },
  ];

  const created: Record<string, string> = {};

  for (const plan of plans) {
    // Plan has no natural unique key in the schema besides id, so we upsert on name
    // via findFirst+create/update rather than a unique constraint (keeps schema lean for v1).
    const existing = await prisma.plan.findFirst({
      where: { name: plan.name },
    });
    const record = existing
      ? await prisma.plan.update({
          where: { id: existing.id },
          data: { ...plan, features: plan.features, isActive: true },
        })
      : await prisma.plan.create({
          data: { ...plan, features: plan.features, isActive: true },
        });
    created[plan.name] = record.id;
    console.log(`  plan: ${plan.name} (${record.id})`);
  }

  return created;
}

async function seedPlatformAdmin() {
  const passwordHash = await hash(SEED_USERS.platformAdmin.password);

  const user = await prisma.user.upsert({
    where: { email: SEED_USERS.platformAdmin.email },
    update: {
      passwordHash,
      name: SEED_USERS.platformAdmin.name,
      role: Role.PLATFORM_ADMIN,
    },
    create: {
      email: SEED_USERS.platformAdmin.email,
      passwordHash,
      name: SEED_USERS.platformAdmin.name,
      role: Role.PLATFORM_ADMIN,
      organizationId: null, // platform admin is not scoped to any org
    },
  });

  console.log(`  platform admin: ${user.email}`);
  return user;
}

async function seedDemoOrgWithAdminAndMember(growthPlanId: string) {
  // Upsert-by-name pattern since Organization has no unique business key by design.
  let org = await prisma.organization.findFirst({
    where: { name: "Acme Corp" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Acme Corp",
        billingEmail: "billing@acme.dev",
        contactInfo: { phone: "+1-555-0100", address: "123 Demo St" },
        status: OrgStatus.ACTIVE, // seeded as already-active so reviewers can test admin/member panels immediately
      },
    });
  }

  const adminPasswordHash = await hash(SEED_USERS.orgAdmin.password);
  const orgAdmin = await prisma.user.upsert({
    where: { email: SEED_USERS.orgAdmin.email },
    update: {
      passwordHash: adminPasswordHash,
      name: SEED_USERS.orgAdmin.name,
      role: Role.ORG_ADMIN,
      organizationId: org.id,
    },
    create: {
      email: SEED_USERS.orgAdmin.email,
      passwordHash: adminPasswordHash,
      name: SEED_USERS.orgAdmin.name,
      role: Role.ORG_ADMIN,
      organizationId: org.id,
    },
  });

  const memberPasswordHash = await hash(SEED_USERS.orgMember.password);
  const orgMember = await prisma.user.upsert({
    where: { email: SEED_USERS.orgMember.email },
    update: {
      passwordHash: memberPasswordHash,
      name: SEED_USERS.orgMember.name,
      role: Role.ORG_MEMBER,
      organizationId: org.id,
    },
    create: {
      email: SEED_USERS.orgMember.email,
      passwordHash: memberPasswordHash,
      name: SEED_USERS.orgMember.name,
      role: Role.ORG_MEMBER,
      organizationId: org.id,
    },
  });

  // Give the demo org an active subscription so billing/subscription pages render real data,
  // without needing to run an actual Stripe checkout every time you reset the DB.
  const existingSub = await prisma.subscription.findFirst({
    where: { organizationId: org.id },
  });
  if (!existingSub) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        organizationId: org.id,
        planId: growthPlanId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  console.log(`  org: ${org.name} (${org.id})`);
  console.log(`  org admin: ${orgAdmin.email}`);
  console.log(`  org member: ${orgMember.email}`);

  return { org, orgAdmin, orgMember };
}

async function seedPendingOrgForCheckoutTesting(starterPlanId: string) {
  // A second org left in PENDING_PAYMENT so you can manually test the "retry checkout"
  // path without having to run the full registration flow every time.
  const existing = await prisma.organization.findFirst({
    where: { name: "Pending Co" },
  });
  if (existing) return existing;

  const org = await prisma.organization.create({
    data: {
      name: "Pending Co",
      billingEmail: "billing@pendingco.dev",
      status: OrgStatus.PENDING_PAYMENT,
    },
  });

  const passwordHash = await hash("Passw0rd!123");
  await prisma.user.upsert({
    where: { email: "admin@pendingco.dev" },
    update: { passwordHash, organizationId: org.id, role: Role.ORG_ADMIN },
    create: {
      email: "admin@pendingco.dev",
      passwordHash,
      name: "Pending Co Admin",
      role: Role.ORG_ADMIN,
      organizationId: org.id,
    },
  });

  console.log(
    `  pending org: ${org.name} (${org.id}) — use this to test the checkout/retry flow`,
  );
  return org;
}

async function main() {
  console.log("Seeding...\n");

  console.log("Plans:");
  const plans = await seedPlans();

  console.log("\nPlatform admin:");
  await seedPlatformAdmin();

  console.log("\nDemo org (active):");
  await seedDemoOrgWithAdminAndMember(plans["Growth"]);

  console.log("\nDemo org (pending payment):");
  await seedPendingOrgForCheckoutTesting(plans["Starter"]);

  console.log("\nSeed complete. Login credentials:\n");
  console.table([
    {
      role: "PLATFORM_ADMIN",
      email: SEED_USERS.platformAdmin.email,
      password: SEED_USERS.platformAdmin.password,
    },
    {
      role: "ORG_ADMIN",
      email: SEED_USERS.orgAdmin.email,
      password: SEED_USERS.orgAdmin.password,
    },
    {
      role: "ORG_MEMBER",
      email: SEED_USERS.orgMember.email,
      password: SEED_USERS.orgMember.password,
    },
  ]);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
