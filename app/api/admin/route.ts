import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { AdminItem, CreateAdminDto } from "@/types";

// ─── GET: Fetch all admins from DB with joined member & family details ───
export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      include: {
        members: {
          include: {
            family: {
              select: {
                address: true,
                region: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const formattedAdmins: AdminItem[] = admins.map((adm) => ({
      id: adm.id,
      memberId: adm.member_id,
      name: adm.members.name,
      phone: adm.members.phone,
      email: adm.members.email,
      role: adm.role || adm.members.role || "Admin",
      isActive: adm.is_active,
      createdAt: adm.created_at.toISOString(),
      lastModified: adm.last_modified.toISOString(),
      churchRole: adm.members.church_role || adm.members.role,
      gender: adm.members.gender,
      age: adm.members.age,
      bloodGroup: adm.members.blood_group,
      maritalStatus: adm.members.marital_status,
      familyAddress: adm.members.family?.address || null,
      familyRegion: adm.members.family?.region || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAdmins,
    });
  } catch (error) {
    console.error("GET /api/admin error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch administrator accounts." },
      { status: 500 }
    );
  }
}

// ─── POST: Provision a new admin account for a member ───
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { memberId, role, password } = (body as Partial<CreateAdminDto>) ?? {};

    // 1. Mandatory field validations
    if (!memberId || !memberId.trim()) {
      return NextResponse.json(
        { success: false, message: "Please select a church member." },
        { status: 400 }
      );
    }

    if (!role || !role.trim()) {
      return NextResponse.json(
        { success: false, message: "Administrator role is required." },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    if (password.trim().length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    // 2. Verify member exists and is not deleted
    const member = await prisma.members.findFirst({
      where: { id: memberId.trim(), is_deleted: false },
      include: {
        admin: true,
        family: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Selected member was not found." },
        { status: 404 }
      );
    }

    // 3. Hash password with bcrypt using protective salt rounds & secret key pepper
    const normalizedRole = role.trim().toUpperCase();
    const hashedPassword = await hashPassword(password.trim());

    const createdAdmin = await prisma.$transaction(async (tx) => {
      const newAdmin = await tx.admin.upsert({
        where: { member_id: member.id },
        create: {
          member_id: member.id,
          role: normalizedRole,
          password: hashedPassword,
          is_active: true, // "Make the user is_active as true when we create a admin."
          created_at: new Date(),
          last_modified: new Date(),
        },
        update: {
          role: normalizedRole,
          password: hashedPassword,
          is_active: true,
          last_modified: new Date(),
        },
        include: {
          members: {
            include: {
              family: true,
            },
          },
        },
      });

      // Update the member's role to reflect their admin access
      await tx.members.update({
        where: { id: member.id },
        data: {
          role: normalizedRole,
          last_modified: new Date(),
        },
      });

      return newAdmin;
    });

    const responseItem: AdminItem = {
      id: createdAdmin.id,
      memberId: createdAdmin.member_id,
      name: createdAdmin.members.name,
      phone: createdAdmin.members.phone,
      email: createdAdmin.members.email,
      role: createdAdmin.role || role.trim(),
      isActive: createdAdmin.is_active,
      createdAt: createdAdmin.created_at.toISOString(),
      lastModified: createdAdmin.last_modified.toISOString(),
      churchRole: createdAdmin.members.church_role || createdAdmin.members.role,
      gender: createdAdmin.members.gender,
      age: createdAdmin.members.age,
      bloodGroup: createdAdmin.members.blood_group,
      maritalStatus: createdAdmin.members.marital_status,
      familyAddress: createdAdmin.members.family?.address || null,
      familyRegion: createdAdmin.members.family?.region || null,
    };

    return NextResponse.json(
      {
        success: true,
        message: `Admin account provisioned successfully for ${createdAdmin.members.name}.`,
        data: responseItem,
      },
      { status: 201 }
    );
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Failed to create administrator account.";
    console.error("POST /api/admin error:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 500 }
    );
  }
}
