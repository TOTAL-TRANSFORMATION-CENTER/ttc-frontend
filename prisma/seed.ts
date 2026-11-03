import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { ALL_PAGE_ROUTE_KEYS } from "../constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // ─── 1. Seed Categories & Category Values ───
  console.log("📦 Seeding mandatory system categories (REGION, CHURCH_ROLE)...");

  // A. Region Category
  const regionCategory = await prisma.categories.upsert({
    where: { code: "REGION" },
    update: {},
    create: {
      code: "REGION",
      name: "Region",
      description: "Geographical church fellowship regions",
    },
  });

  const defaultRegions = [
    { code: "KARAMADAI", label: "Karamadai", sort_order: 1 },
    { code: "METTUPALAYAM", label: "Mettupalayam", sort_order: 2 },
    { code: "NARASIMANAICKENPALAYAM", label: "Narasimanaickenpalayam", sort_order: 3 },
    { code: "PERIYANAICKENPALAYAM", label: "Periyanaickenpalayam", sort_order: 4 },
    { code: "VEERAPANDI", label: "Veerapandi", sort_order: 5 },
  ];

  for (const reg of defaultRegions) {
    const existingVal = await prisma.category_values.findFirst({
      where: {
        category_id: regionCategory.id,
        code: reg.code,
      },
    });

    if (!existingVal) {
      await prisma.category_values.create({
        data: {
          category_id: regionCategory.id,
          code: reg.code,
          label: reg.label,
          sort_order: reg.sort_order,
          is_active: true,
        },
      });
    }
  }
  console.log("   ✅ Region category & values verified.");

  // B. Church Roles Category
  const churchRoleCategory = await prisma.categories.upsert({
    where: { code: "CHURCH_ROLE" },
    update: {},
    create: {
      code: "CHURCH_ROLE",
      name: "Church Roles",
      description: "Dynamic functional job assignments within our church",
    },
  });

  const defaultChurchRoles = [
    { code: "PASTOR", label: "Senior Pastor", sort_order: 1 },
    { code: "YOUTH_LEADER", label: "Youth Leader", sort_order: 2 },
    { code: "CHOIR_MEMBER", label: "Choir Member", sort_order: 3 },
    { code: "DEACON", label: "Deacon / Elder", sort_order: 4 },
    { code: "SUNDAY_SCHOOL", label: "Sunday School Teacher", sort_order: 5 },
    { code: "USHER", label: "Usher / Hospitality", sort_order: 6 },
    { code: "MEDIA_TECH", label: "Sound & Media Team", sort_order: 7 },
  ];

  for (const role of defaultChurchRoles) {
    const existingVal = await prisma.category_values.findFirst({
      where: {
        category_id: churchRoleCategory.id,
        code: role.code,
      },
    });

    if (!existingVal) {
      await prisma.category_values.create({
        data: {
          category_id: churchRoleCategory.id,
          code: role.code,
          label: role.label,
          sort_order: role.sort_order,
          is_active: true,
        },
      });
    }
  }
  console.log("   ✅ Church Role category & values verified.");

  // ─── 2. Update existing Super Admins with empty page_routes ───
  const emptySuperAdmins = await prisma.admin.findMany({
    where: {
      role: "SUPER ADMIN",
      page_routes: { isEmpty: true },
    },
  });

  if (emptySuperAdmins.length > 0) {
    console.log(`🔄 Upgrading ${emptySuperAdmins.length} Super Admin(s) with initial full page_routes...`);
    for (const adm of emptySuperAdmins) {
      await prisma.admin.update({
        where: { id: adm.id },
        data: { page_routes: [...ALL_PAGE_ROUTE_KEYS] },
      });
    }
    console.log("   ✅ Existing Super Admins updated with all page routes.");
  }

  // ─── 3. Bootstrap Super Admin if none exists ───
  const existingAdmin = await prisma.admin.findFirst({
    include: {
      members: true,
    },
  });

  if (existingAdmin) {
    console.log(
        `ℹ️  Database contains an admin account: ${existingAdmin.members?.name || "Admin"} (${existingAdmin.members?.phone || existingAdmin.members?.email}). Skipping bootstrap.`
    );
    console.log("✅ Database seeded successfully!");
    return;
  }

  // Configurable credentials via environment variables or default fallbacks
  const adminName = process.env.INITIAL_ADMIN_NAME || "Super Admin";
  const adminPhone = process.env.INITIAL_ADMIN_PHONE || "+919876543210";
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@ttcministries.org";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin@TTC2026!";
  const adminRole = "SUPER ADMIN";

  console.log(`👤 Bootstrapping initial Super Admin (${adminPhone} / ${adminEmail})...`);

  // Hash password using the application's peppered bcrypt algorithm
  const hashedPassword = await hashPassword(adminPassword);

  // 1. Create Administration Family
  const adminFamily = await prisma.family.create({
    data: {
      status: "ACTIVE",
      region: "Karamadai",
      address: "Total Transformation Center Church Campus",
      location: null,
      is_deleted: false,
    },
  });

  // 2. Create Admin Member Record
  const adminMember = await prisma.members.create({
    data: {
      family_id: adminFamily.id,
      name: adminName,
      is_head: true,
      gender: "MALE",
      phone: adminPhone,
      email: adminEmail,
      status: "ACTIVE",
      marital_status: "MARRIED",
      role: "ADMIN",
      church_role: "Senior Pastor / Super Admin",
      is_deleted: false,
    },
  });

  // 3. Create Admin Authentication Record
  const newAdmin = await prisma.admin.create({
    data: {
      member_id: adminMember.id,
      password: hashedPassword,
      role: adminRole,
      is_active: true,
      is_reset: false,
      page_routes: [...ALL_PAGE_ROUTE_KEYS],
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("───────────────────────────────────────────────────");
  console.log("🔑 Initial Administrator Credentials:");
  console.log(`   Phone:    ${adminPhone}`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role:     ${newAdmin.role}`);
  console.log("───────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

