import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  CategoryItem,
  CategoryValueItem,
  DbCategory,
  DbCategoryValue,
  CreateCategoryDto,
} from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function serializeCategory(cat: DbCategory): CategoryItem {
  return {
    id: Number(cat.id),
    code: cat.code,
    name: cat.name,
    description: cat.description,
    createdAt: cat.created_at ? cat.created_at.toISOString() : "",
    valuesCount: cat._count?.category_values ?? (cat.category_values?.length ?? 0),
    values: cat.category_values?.map(serializeCategoryValue) ?? [],
  };
}

export function serializeCategoryValue(val: DbCategoryValue): CategoryValueItem {
  return {
    id: Number(val.id),
    categoryId: Number(val.category_id),
    code: val.code,
    label: val.label,
    isActive: val.is_active,
    sortOrder: val.sort_order,
    createdAt: val.created_at ? val.created_at.toISOString() : "",
  };
}

// ─── GET /api/categories ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const includeValues = searchParams.get("includeValues") === "true";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const categories = await prisma.categories.findMany({
      where,
      include: {
        _count: {
          select: { category_values: true },
        },
        ...(includeValues
          ? {
              category_values: {
                orderBy: [{ sort_order: "asc" }, { id: "asc" }],
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories.map(serializeCategory),
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}

// ─── POST /api/categories ───
export async function POST(request: NextRequest) {
  try {
    let body: CreateCategoryDto;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { code, name, description } = body || {};

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Category code is required (e.g., CHURCH_ROLE)." },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required (e.g., Church Roles)." },
        { status: 400 }
      );
    }

    // Format code: UPPERCASE with underscores
    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, "_");

    // Check if code already exists
    const existing = await prisma.categories.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Category code "${formattedCode}" already exists.` },
        { status: 409 }
      );
    }

    const newCategory = await prisma.categories.create({
      data: {
        code: formattedCode,
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: { category_values: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully.",
        data: serializeCategory(newCategory),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create category." },
      { status: 500 }
    );
  }
}

