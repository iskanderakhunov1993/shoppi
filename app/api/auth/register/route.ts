import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, type Role } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

const ROLES: Role[] = ["shopper", "creator", "brand"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;
  const role = body?.role as string | undefined;
  const brandDomain = body?.brandDomain as string | undefined;

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "email and password (min 6 chars) are required" },
      { status: 400 }
    );
  }
  if (!role || !ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ROLES.join(", ")}` },
      { status: 400 }
    );
  }
  if (role === "brand" && !brandDomain?.trim()) {
    return NextResponse.json(
      { error: "brandDomain is required for the brand role" },
      { status: 400 }
    );
  }

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const { user, creator } = createUser(
    email,
    hashPassword(password),
    role as Role,
    brandDomain?.trim()
  );

  // MVP has no email provider wired up yet: the verification token is
  // returned directly instead of emailed, so /api/auth/verify is testable
  // end-to-end without external infra.
  return NextResponse.json(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      creatorSlug: creator?.slug,
      verificationToken: user.verificationToken,
    },
    { status: 201 }
  );
}
