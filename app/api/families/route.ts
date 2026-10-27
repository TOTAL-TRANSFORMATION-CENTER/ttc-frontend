import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateYears, parseDateString } from "@/lib/utils";
import { validateCreateFamilyPayload } from "@/lib/validation";

// ─── GET: List all families with their members ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const search = searchParams.get("search")?.trim() ?? "";
    const region = searchParams.get("region")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const skip = (page - 1) * limit;

    // Build dynamic where clause (only non-deleted families)
    const where: Record<string, unknown> = {
      is_deleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (region) {
      where.region = region;
    }

    if (search) {
      where.members = {
        some: {
          name: { contains: search, mode: "insensitive" },
          is_deleted: false,
        },
      };
    }

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        include: {
          members: {
            where: { is_deleted: false },
            orderBy: [
              { is_head: "desc" },
              { name: "asc" },
            ],
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.family.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: families,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/families error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch families" },
      { status: 500 }
    );
  }
}

// ─── POST: Create a family with members ───
export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Comprehensive server validation for all mandatory frontend fields
    const validation = validateCreateFamilyPayload(body);
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
      members: membersList,
    } = validation.data;

    // Create family and members in a transaction
    const family = await prisma.$transaction(async (tx) => {
      const newFamily = await tx.family.create({
        data: {
          status: "ACTIVE",
          location: location?.trim() || null,
          region: region?.trim() || null,
          address: address?.trim() || null,
          is_deleted: false,
          created_at: new Date(),
          members: {
            create: membersList.map((m) => {
              const dobDate = m.dob ? parseDateString(m.dob) : null;
              const domDate = m.dateOfMarriage ? parseDateString(m.dateOfMarriage) : null;
              const computedAge = m.age
                ? Number(m.age)
                : m.dob
                ? Number(calculateYears(m.dob)) || null
                : null;

              const churchRole =
                m.churchRole?.trim() ||
                (m.role && m.role !== "MEMBER" ? m.role.trim() : null) ||
                null;

              return {
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
                role: "MEMBER",
                church_role: churchRole,
                phone: m.phone?.trim() || null,
                email: m.email?.trim() || null,
                is_deleted: false,
              };
            }),
          },
        },
        include: {
          members: {
            where: { is_deleted: false },
          },
        },
      });

      return newFamily;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Family created successfully",
        data: family,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/families error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create family" },
      { status: 500 }
    );
  }
}
