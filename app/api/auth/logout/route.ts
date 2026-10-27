import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/jwt";

// ─── POST / GET: Clear session cookies on logout ───
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
  return clearAuthCookies(response);
}

export async function GET() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
  return clearAuthCookies(response);
}
