import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/store";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "email and password (min 6 chars) are required" },
      { status: 400 }
    );
  }

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const { user, creator } = createUser(email, hashPassword(password));

  // MVP has no email provider wired up yet: the verification token is
  // returned directly instead of emailed, so /api/auth/verify is testable
  // end-to-end without external infra.
  return NextResponse.json(
    {
      userId: user.id,
      email: user.email,
      creatorSlug: creator.slug,
      verificationToken: user.verificationToken,
    },
    { status: 201 }
  );
}
