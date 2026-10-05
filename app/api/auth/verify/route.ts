import { NextRequest, NextResponse } from "next/server";
import { track } from "@/lib/events";
import { verifyUser } from "@/lib/store";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token query param is required" }, { status: 400 });
  }

  const user = await verifyUser(token);
  if (!user) {
    return NextResponse.json({ error: "Ссылка недействительна или уже использована" }, { status: 400 });
  }

  await track("email_verified", { userId: user.id });
  return NextResponse.json({ email: user.email, verified: true });
}
