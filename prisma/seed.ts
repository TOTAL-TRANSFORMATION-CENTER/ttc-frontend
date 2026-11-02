import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check if an admin already exists
  const existingAdmin = await prisma.admin.findFirst({
    include: {
      members: true,
    },
  });

  if (existingAdmin) {
    console.log(
      `ℹ️  Database already contains an admin account: ${existingAdmin.members?.name || "Admin"} (${existingAdmin.members?.phone || existingAdmin.members?.email}). Skipping bootstrap.`
    );
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
      region: "Headquarters",
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
      is_reset: false, // Initial super admin does not need forced password reset
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
  console.log("⚠️  Please change the default password after initial login.");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

