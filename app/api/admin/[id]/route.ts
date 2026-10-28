import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hashPassword } from "@/lib/password";
import type { AdminItem, UpdateAdminDto } from "@/types";

// ─── GET: Fetch single admin by ID ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adm = await prisma.admin.findUnique({
      where: { id },
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
    });

    if (!adm) {
      return NextResponse.json(
        { success: false, message: "Administrator account not found." },
        { status: 404 }
      );
    }

    const formatted: AdminItem = {
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
      isReset: adm.is_reset,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/admin/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin details." },
      { status: 500 }
    );
  }
}

// ─── PUT: Update admin role, active status (is_active), or password ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { role, isActive, password } = (body as Partial<UpdateAdminDto>) ?? {};

    const existing = await prisma.admin.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Administrator account not found." },
        { status: 404 }
      );
    }

    const updatedAdmin = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.adminUpdateInput = {
        last_modified: new Date(),
      };

      if (typeof isActive === "boolean") {
        updateData.is_active = isActive;
      }

      if (role && role.trim()) {
        const normalizedRole = role.trim().toUpperCase();
        updateData.role = normalizedRole;
      }

      if (password && password.trim()) {
        if (password.trim().length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        updateData.password = await hashPassword(password.trim());
        updateData.is_reset = true; // Setting generated/edited password requires admin to reset
      }

      const adminRecord = await tx.admin.update({
        where: { id },
        data: updateData,
        include: {
          members: {
            include: {
              family: true,
            },
          },
        },
      });

      // Sync member's role if role was updated
      if (role && role.trim()) {
        await tx.members.update({
          where: { id: existing.member_id },
          data: {
            role: role.trim().toUpperCase(),
            last_modified: new Date(),
          },
        });
      }

      return adminRecord;
    });

    const formatted: AdminItem = {
      id: updatedAdmin.id,
      memberId: updatedAdmin.member_id,
      name: updatedAdmin.members.name,
      phone: updatedAdmin.members.phone,
      email: updatedAdmin.members.email,
      role: updatedAdmin.role || updatedAdmin.members.role || "Admin",
      isActive: updatedAdmin.is_active,
      createdAt: updatedAdmin.created_at.toISOString(),
      lastModified: updatedAdmin.last_modified.toISOString(),
      churchRole: updatedAdmin.members.church_role || updatedAdmin.members.role,
      gender: updatedAdmin.members.gender,
      age: updatedAdmin.members.age,
      bloodGroup: updatedAdmin.members.blood_group,
      maritalStatus: updatedAdmin.members.marital_status,
      familyAddress: updatedAdmin.members.family?.address || null,
      familyRegion: updatedAdmin.members.family?.region || null,
      isReset: updatedAdmin.is_reset,
    };

    return NextResponse.json({
      success: true,
      message: `Admin account for ${updatedAdmin.members.name} updated successfully.`,
      data: formatted,
    });
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Failed to update administrator account.";
    console.error("PUT /api/admin/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 400 }
    );
  }
}

// ─── DELETE: Revoke admin account (deactivate: is_active = false) ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.admin.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Administrator account not found." },
        { status: 404 }
      );
    }

    // Deactivate admin account (set is_active = false, do NOT delete)
    const updated = await prisma.admin.update({
      where: { id },
      data: {
        is_active: false,
        last_modified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Administrator access for ${existing.members?.name || "administrator"} has been revoked. Account is now Inactive.`,
      data: { id: updated.id, isActive: false },
    });
  } catch (error) {
    console.error("DELETE /api/admin/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to revoke administrator account." },
      { status: 500 }
    );
  }
}

