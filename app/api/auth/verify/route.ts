import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/store";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token query param is required" }, { status: 400 });
  }

  const user = verifyUser(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or already-used token" }, { status: 400 });
  }

  return NextResponse.json({ email: user.email, verified: true });
}
