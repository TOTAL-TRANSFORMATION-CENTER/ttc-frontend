import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCategory } from "@/app/api/categories/route";
import type { UpdateCategoryDto } from "@/types";

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

// Helper to resolve either numeric ID or code
async function findCategory(identifier: string) {
  if (!identifier || typeof identifier !== "string") return null;
  const trimmed = identifier.trim();
  const numericId = parseBigIntId(trimmed);
  if (numericId !== null) {
    return prisma.categories.findUnique({
      where: { id: numericId },
      include: {
        category_values: {
          orderBy: [{ sort_order: "asc" }, { id: "asc" }],
        },
      },
    });
  }
  return prisma.categories.findUnique({
    where: { code: trimmed.toUpperCase() },
    include: {
      category_values: {
        orderBy: [{ sort_order: "asc" }, { id: "asc" }],
      },
    },
  });
}

// ─── GET /api/categories/[id] ───
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await findCategory(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeCategory(category),
    });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category." },
      { status: 500 }
    );
  }
}

// ─── PUT /api/categories/[id] ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await findCategory(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 }
      );
    }

    let body: UpdateCategoryDto;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { name, description } = body || {};

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.categories.update({
      where: { id: existing.id },
      data: {
        name: name.trim(),
        description: description !== undefined ? description?.trim() || null : existing.description,
      },
      include: {
        category_values: {
          orderBy: [{ sort_order: "asc" }, { id: "asc" }],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
      data: serializeCategory(updated),
    });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update category." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/categories/[id] ───
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await findCategory(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Category not found." },
        { status: 404 }
      );
    }

    await prisma.categories.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: `Category "${existing.name}" and all associated values deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category." },
      { status: 500 }
    );
  }
}
