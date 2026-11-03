import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCategoryValue } from "@/app/api/categories/route";
import type { CreateCategoryValueDto } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseBigIntId(val: string): bigint | null {
  if (!/^\d+$/.test(val)) return null;
  try {
    const b = BigInt(val);
    if (b > BigInt("9223372036854775807")) return null;
    return b;
  } catch {
    return null;
  }
}

async function findCategoryId(identifier: string): Promise<bigint | null> {
  if (!identifier || typeof identifier !== "string") return null;
  const trimmed = identifier.trim();
  const numericId = parseBigIntId(trimmed);
  if (numericId !== null) {
    const cat = await prisma.categories.findUnique({
      where: { id: numericId },
      select: { id: true },
    });
    return cat?.id || null;
  }
  const cat = await prisma.categories.findUnique({
    where: { code: trimmed.toUpperCase() },
    select: { id: true },
  });
  return cat?.id || null;
}

// ─── GET /api/categories/[id]/values ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = await findCategoryId(id);

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const values = await prisma.category_values.findMany({
      where: {
        category_id: categoryId,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: values.map(serializeCategoryValue),
    });
  } catch (error) {
    console.error("GET /api/categories/[id]/values error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category values." },
      { status: 500 }
    );
  }
}

// ─── POST /api/categories/[id]/values ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = await findCategoryId(id);

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 }
      );
    }

    let body: CreateCategoryValueDto;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { code, label, isActive = true, sortOrder = 0 } = body || {};

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Option code is required (e.g., DEACON)." },
        { status: 400 }
      );
    }

    if (!label || !label.trim()) {
      return NextResponse.json(
        { success: false, message: "Display label is required (e.g., Senior Pastor)." },
        { status: 400 }
      );
    }

    const formattedCode = code.trim().toUpperCase().replace(/\s+/g, "_");

    // Check duplicate code within the same category
    const existing = await prisma.category_values.findUnique({
      where: {
        category_id_code: {
          category_id: categoryId,
          code: formattedCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `An option with code "${formattedCode}" already exists in this category.`,
        },
        { status: 409 }
      );
    }

    const sortOrderNum = Number(sortOrder);
    const newValue = await prisma.category_values.create({
      data: {
        category_id: categoryId,
        code: formattedCode,
        label: label.trim(),
        is_active: Boolean(isActive),
        sort_order: Number.isFinite(sortOrderNum) ? Math.floor(sortOrderNum) : 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Option added successfully.",
        data: serializeCategoryValue(newValue),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories/[id]/values error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add category option." },
      { status: 500 }
    );
  }
}
