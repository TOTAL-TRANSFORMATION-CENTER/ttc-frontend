import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { createSession } from "@/lib/auth/session";
import { handleCorsPreflight } from "@/lib/cors";

export const OPTIONS = handleCorsPreflight;

export async function POST(request: Request) {
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

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const phone = (
      result.data.phone ||
      result.data.identifier ||
      ""
    ).trim();

    const { password } = result.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          {
            phone: phone.startsWith("+")
              ? phone.slice(1)
              : `+${phone}`,
          },
          {
            phone: phone.startsWith("+91")
              ? phone.slice(3)
              : `+91${phone}`,
          },
        ],
      },
    });

    // DEBUG 1: Check whether the phone number matched a user.
    console.log("LOGIN DEBUG:", {
      userFound: Boolean(user),
      userActive: user?.isActive,
      storedPhone: user?.phone,
    });

    // DEBUG 2: Check whether the account exists and is active.
    if (!user) {
      console.log("LOGIN FAILED: User not found");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password",
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      console.log("LOGIN FAILED: Account is inactive");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password",
        },
        { status: 401 }
      );
    }

    // DEBUG 3: Check the password against the stored hash.
    const passwordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    console.log("LOGIN DEBUG: Password valid =", passwordValid);

    if (!passwordValid) {
      console.log("LOGIN FAILED: Password does not match");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or password",
        },
        { status: 401 }
      );
    }

    // Login passed. Create the session.
    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in" },
      { status: 500 }
    );
  }
}
