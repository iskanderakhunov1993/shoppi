import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, type Role } from "@/lib/store";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { seedDemoAccounts, DEMO_ACCOUNTS } from "@/lib/seed";
import { DEMO_LOGIN_ENABLED } from "@/lib/featureFlags";

const ROLES: Role[] = ["shopper", "creator", "brand"];

// Dev-only shortcut: logs straight into a seeded demo account for the
// given role, skipping registration, email verification and the
// password check. Disabled in production (404) — see DEMO_LOGIN_ENABLED.
export async function POST(request: NextRequest) {
  if (!DEMO_LOGIN_ENABLED) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const role = body?.role as string | undefined;

  if (!role || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: `role must be one of: ${ROLES.join(", ")}` }, { status: 400 });
  }

  await seedDemoAccounts();
  const user = await getUserByEmail(DEMO_ACCOUNTS[role as Role]);
  if (!user) {
    return NextResponse.json({ error: "Demo account seeding failed" }, { status: 500 });
  }

  const token = await createSession(user.id);
  const response = NextResponse.json({ email: user.email, role: user.role });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
