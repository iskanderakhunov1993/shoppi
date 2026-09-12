import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/store";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  // Don't reveal whether the address is registered — same response
  // either way, only the verified/unverified branches differ once a
  // real account is found.
  if (!user || user.verified) {
    return NextResponse.json({ ok: true });
  }

  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const verifyUrl = `${protocol}://${host}/verify?token=${user.verificationToken}`;
  const emailed = await sendVerificationEmail(user.email, verifyUrl);

  return NextResponse.json({ ok: true, emailed, verificationToken: emailed ? undefined : user.verificationToken });
}
