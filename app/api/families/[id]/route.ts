import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateYears, parseDateString } from "@/lib/utils";
import { validateUpdateFamilyPayload } from "@/lib/validation";

// ─── GET: Get a single family by ID with members ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = id;

    const family = await prisma.family.findFirst({
      where: { id: familyId, is_deleted: false },
      include: {
        members: {
          where: { is_deleted: false },
          orderBy: [
            { is_head: "desc" },
            { name: "asc" },
          ],
        },
      },
    });

    if (!family) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: family });
  } catch (error) {
    console.error("GET /api/families/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch family" },
      { status: 500 }
    );
  }
}

// ─── PUT: Update a family and its members ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = validateUpdateFamilyPayload(body);
    if (!validation.isValid || !validation.data) {
      return NextResponse.json(
        { success: false, message: validation.error || "Validation failed" },
        { status: 400 }
      );
    }

    const {
      location,
      region,
      address,
      status,
      inactiveReason,
      members: membersList,
    } = validation.data;

    // Check family exists and is not deleted
    const existing = await prisma.family.findFirst({
      where: { id: familyId, is_deleted: false },
      include: { members: { where: { is_deleted: false } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    const family = await prisma.$transaction(async (tx) => {
      // Update the family record
      await tx.family.update({
        where: { id: familyId },
        data: {
          location: location?.trim() || null,
          region: region?.trim() || null,
          address: address?.trim() || null,
          status: status || existing.status,
          inactive_reason: inactiveReason?.trim() || null,
        },
      });

      // If members were provided, sync them
      if (membersList && Array.isArray(membersList)) {
        const existingMemberIds = existing.members.map((m) => m.id);
        const incomingMemberIds = membersList
          .filter((m) => m.id)
          .map((m) => m.id!);

        // Soft delete members that were removed from the family
        const toDelete = existingMemberIds.filter(
          (mId) => !incomingMemberIds.includes(mId)
        );
        if (toDelete.length > 0) {
          await tx.members.updateMany({
            where: {
              id: { in: toDelete },
              family_id: familyId,
            },
            data: { is_deleted: true },
          });
        }

        // Upsert each member
        for (const m of membersList) {
          const dobDate = m.dob ? parseDateString(m.dob) : null;
          const domDate = m.dateOfMarriage ? parseDateString(m.dateOfMarriage) : null;
          const computedAge = m.age
            ? Number(m.age)
            : m.dob
            ? Number(calculateYears(m.dob)) || null
            : null;

          const isNew = !m.id || !existingMemberIds.includes(m.id);
          const existingMember = existing.members.find((em) => em.id === m.id);
          const churchRole =
            m.churchRole?.trim() ||
            (m.role && m.role !== "MEMBER" ? m.role.trim() : null) ||
            null;
          // For newly created members, role must default to "MEMBER"; for existing members, preserve their existing authorization role
          const memberRole = isNew ? "MEMBER" : (existingMember?.role || "MEMBER");

          const memberData = {
            name: m.name.trim(),
            is_head: m.isHead,
            age: isNaN(computedAge as number) ? null : computedAge,
            gender: m.gender || null,
            blood_group: m.bloodGroup || null,
            dob: dobDate,
            status: m.status || "ACTIVE",
            inactive_reason: m.inactiveReason?.trim() || null,
            marital_status: m.maritalStatus || null,
            dom: domDate,
            is_looking_for_alliance: m.isLookingForAlliance ?? false,
            occupation: m.occupation?.trim() || null,
            role: memberRole,
            church_role: churchRole,
            phone: m.phone?.trim() || null,
            email: m.email?.trim() || null,
            is_deleted: false,
          };

          if (m.id && existingMemberIds.includes(m.id)) {
            // Update existing member
            await tx.members.update({
              where: { id: m.id },
              data: memberData,
            });
          } else {
            // Create new member
            await tx.members.create({
              data: {
                ...memberData,
                family_id: familyId,
              },
            });
          }
        }
      }

      // Return updated family with active members
      return tx.family.findFirst({
        where: { id: familyId, is_deleted: false },
        include: {
          members: {
            where: { is_deleted: false },
            orderBy: [{ is_head: "desc" }, { name: "asc" }],
          },
        },
      });
    });

    if (!family) {
      return NextResponse.json(
        { success: false, message: "Failed to update family" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Family updated successfully",
      data: family,
    });
  } catch (error) {
    console.error("PUT /api/families/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update family" },
      { status: 500 }
    );
  }
}

// ─── DELETE: Soft delete a family and its members ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const familyId = id;

    const existing = await prisma.family.findFirst({
      where: { id: familyId, is_deleted: false },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Family not found" },
        { status: 404 }
      );
    }

    // Soft delete members first, then family (in a transaction)
    await prisma.$transaction(async (tx) => {
      await tx.members.updateMany({
        where: { family_id: familyId, is_deleted: false },
        data: { is_deleted: true },
      });
      await tx.family.update({
        where: { id: familyId },
        data: { is_deleted: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Family deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/families/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete family" },
      { status: 500 }
    );
  }
}
