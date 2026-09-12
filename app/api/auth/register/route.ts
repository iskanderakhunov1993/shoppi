import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, type Role } from "@/lib/store";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

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

  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const { user, creator } = await createUser(
    email,
    hashPassword(password),
    role as Role,
    brandDomain?.trim()
  );

  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const verifyUrl = `${protocol}://${host}/verify?token=${user.verificationToken}`;
  const emailed = await sendVerificationEmail(user.email, verifyUrl);

  // Without RESEND_API_KEY configured (local dev, or the key missing),
  // the token is returned directly so /api/auth/verify stays testable
  // end-to-end without external infra.
  return NextResponse.json(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      creatorSlug: creator?.slug,
      emailed,
      verificationToken: emailed ? undefined : user.verificationToken,
    },
    { status: 201 }
  );
}
