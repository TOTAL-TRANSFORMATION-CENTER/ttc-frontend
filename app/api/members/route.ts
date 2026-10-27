import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MemberOption } from "@/types";

// ─── GET: List active members for dropdown selection & details fetching ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: Record<string, unknown> = {
      is_deleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const members = await prisma.members.findMany({
      where,
      include: {
        family: {
          select: {
            address: true,
            region: true,
            location: true,
          },
        },
        admin: {
          select: {
            id: true,
            role: true,
            is_active: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: 200,
    });

    const formattedMembers: MemberOption[] = members.map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email,
      gender: m.gender,
      age: m.age,
      churchRole: m.church_role || m.role,
      bloodGroup: m.blood_group,
      maritalStatus: m.marital_status,
      status: m.status,
      isHead: m.is_head,
      familyAddress: m.family?.address || null,
      familyRegion: m.family?.region || null,
      hasAdminAccount: !!m.admin,
      adminRole: m.admin?.role || null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers,
    });
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch church members." },
      { status: 500 }
    );
  }
}
