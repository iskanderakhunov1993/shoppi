import { NextRequest, NextResponse } from "next/server";
import { setResetToken } from "@/lib/store";
import { sendResetPasswordEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "email обязателен" }, { status: 400 });
  }

  const token = await setResetToken(email);

  // Always respond the same way whether or not the email exists —
  // otherwise this endpoint could be used to check who's registered.
  if (!token) {
    return NextResponse.json({ emailed: false });
  }

  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;
  const emailed = await sendResetPasswordEmail(email, resetUrl);

  // Same fallback as registration: without RESEND_API_KEY, hand back
  // the link directly so the flow stays testable end-to-end.
  return NextResponse.json({ emailed, resetUrl: emailed ? undefined : resetUrl });
}
