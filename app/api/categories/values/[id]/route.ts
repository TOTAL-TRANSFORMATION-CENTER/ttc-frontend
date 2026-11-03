import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCategoryValue } from "@/app/api/categories/route";
import type { UpdateCategoryValueDto } from "@/types";

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

// ─── PUT /api/categories/values/[id] ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const valueId = parseBigIntId(id);

    if (!valueId) {
      return NextResponse.json(
        { success: false, message: "Invalid option ID." },
        { status: 400 }
      );
    }

    const existing = await prisma.category_values.findUnique({
      where: { id: valueId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Option not found." },
        { status: 404 }
      );
    }

    let body: UpdateCategoryValueDto;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { code, label, isActive, sortOrder } = body || {};

    const updateData: {
      code?: string;
      label?: string;
      is_active?: boolean;
      sort_order?: number;
    } = {};

    if (code !== undefined) {
      const formattedCode = code.trim().toUpperCase().replace(/\s+/g, "_");
      if (!formattedCode) {
        return NextResponse.json(
          { success: false, message: "Code cannot be empty." },
          { status: 400 }
        );
      }
      if (formattedCode !== existing.code) {
        // Check uniqueness within the same category
        const duplicate = await prisma.category_values.findUnique({
          where: {
            category_id_code: {
              category_id: existing.category_id,
              code: formattedCode,
            },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message: `Code "${formattedCode}" is already in use in this category.`,
            },
            { status: 409 }
          );
        }
        updateData.code = formattedCode;
      }
    }

    if (label !== undefined) {
      if (!label.trim()) {
        return NextResponse.json(
          { success: false, message: "Label cannot be empty." },
          { status: 400 }
        );
      }
      updateData.label = label.trim();
    }

    if (isActive !== undefined) {
      updateData.is_active = Boolean(isActive);
    }

    if (sortOrder !== undefined) {
      const sortOrderNum = Number(sortOrder);
      updateData.sort_order = Number.isFinite(sortOrderNum) ? Math.floor(sortOrderNum) : 0;
    }

    const updated = await prisma.category_values.update({
      where: { id: valueId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Option updated successfully.",
      data: serializeCategoryValue(updated),
    });
  } catch (error) {
    console.error("PUT /api/categories/values/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update option." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/categories/values/[id] ───
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const valueId = parseBigIntId(id);

    if (!valueId) {
      return NextResponse.json(
        { success: false, message: "Invalid option ID." },
        { status: 400 }
      );
    }

    const existing = await prisma.category_values.findUnique({
      where: { id: valueId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Option not found." },
        { status: 404 }
      );
    }

    await prisma.category_values.delete({
      where: { id: valueId },
    });

    return NextResponse.json({
      success: true,
      message: `Option "${existing.label}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/categories/values/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete option." },
      { status: 500 }
    );
  }
}
