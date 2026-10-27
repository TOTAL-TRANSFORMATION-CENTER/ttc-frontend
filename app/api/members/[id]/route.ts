import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── GET: Fetch a single member by ID from members table ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const member = await prisma.members.findFirst({
      where: { id, is_deleted: false },
      include: {
        family: {
          select: {
            address: true,
            region: true,
            location: true,
            status: true,
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
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found." },
        { status: 404 }
      );
    }

    const formattedMember = {
      id: member.id,
      name: member.name,
      isHead: member.is_head,
      age: member.age,
      gender: member.gender,
      bloodGroup: member.blood_group,
      dob: member.dob ? member.dob.toISOString().split("T")[0] : null,
      status: member.status || "ACTIVE",
      inactiveReason: member.inactive_reason,
      maritalStatus: member.marital_status,
      dom: member.dom ? member.dom.toISOString().split("T")[0] : null,
      isLookingForAlliance: member.is_looking_for_alliance,
      occupation: member.occupation,
      role: member.role || "MEMBER",
      churchRole: member.church_role || member.role || "General Member",
      phone: member.phone,
      email: member.email,
      familyAddress: member.family?.address || null,
      familyRegion: member.family?.region || null,
      familyLocation: member.family?.location || null,
      familyStatus: member.family?.status || null,
      hasAdminAccount: !!member.admin,
      adminId: member.admin?.id || null,
      adminRole: member.admin?.role || null,
      isAdminActive: member.admin?.is_active ?? null,
    };

    return NextResponse.json({
      success: true,
      data: formattedMember,
    });
  } catch (error) {
    console.error("GET /api/members/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch member details." },
      { status: 500 }
    );
  }
}
