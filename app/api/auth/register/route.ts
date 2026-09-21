import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, markUserVerified, type Role } from "@/lib/store";
import { hashPassword } from "@/lib/auth";
import { EMAIL_ENABLED, EXPOSE_LINKS, sendVerificationEmail } from "@/lib/email";

const ROLES: Role[] = ["shopper", "creator", "brand"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const password = body?.password as string | undefined;
  const role = body?.role as string | undefined;
  const brandDomain = body?.brandDomain as string | undefined;

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Введите email и пароль (не короче 6 символов)" },
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
      { error: "Укажите домен бренда" },
      { status: 400 }
    );
  }

  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });
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

  // Production with no mail provider configured at all: there is no way
  // to prove ownership of the address, and returning the token would let
  // anyone "verify" any email — so confirm the account right away rather
  // than lock every new user out. (If mail IS configured but a send fails,
  // the account stays unverified and the user retries via "resend".)
  const autoVerified = !emailed && !EMAIL_ENABLED && !EXPOSE_LINKS;
  if (autoVerified) await markUserVerified(user.id);

  // Local dev only: hand the token back so /api/auth/verify stays testable.
  return NextResponse.json(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      creatorSlug: creator?.slug,
      emailed,
      autoVerified,
      verificationToken: emailed || autoVerified || !EXPOSE_LINKS ? undefined : user.verificationToken,
    },
    { status: 201 }
  );
}
