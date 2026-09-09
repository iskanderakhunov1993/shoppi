import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreatorByUserId } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = requireUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (user.role === "creator") {
    const creator = getCreatorByUserId(user.id);
    return NextResponse.json({
      role: user.role,
      displayName: creator?.displayName ?? user.email,
      slug: creator?.slug,
    });
  }

  if (user.role === "brand") {
    return NextResponse.json({
      role: user.role,
      displayName: user.email,
      brandDomain: user.brandDomain,
    });
  }

  return NextResponse.json({ role: user.role, displayName: user.email });
}
