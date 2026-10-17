
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "ttc_session";

const SESSION_DURATION_DAYS = Number(
  process.env.SESSION_DURATION_DAYS ?? "7"
);

if (
  !Number.isSafeInteger(SESSION_DURATION_DAYS) ||
  SESSION_DURATION_DAYS < 1 ||
  SESSION_DURATION_DAYS > 30
) {
  throw new Error(
    "SESSION_DURATION_DAYS must be an integer between 1 and 30"
  );
}

const SESSION_DURATION =
  SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isActive
  ) {
    if (session) {
      await prisma.session.delete({
        where: { id: session.id },
      });
    }

    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    sessionId: session.id,
  };
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}
