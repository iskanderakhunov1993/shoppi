import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { addFeedback, listNewFeedback, markFeedbackTriaged, validateFeedback } from "@/lib/feedback";
import { isRateLimited, TOO_MANY } from "@/lib/rateLimit";
import { clientIpFrom } from "@/lib/bot-detection";

/** Widget submit: anyone may write, rate-limited per IP. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const error = validateFeedback(body ?? {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (await isRateLimited(`feedback:ip:${clientIpFrom(request.headers)}`, 5, 60 * 60)) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
  const user = await requireUser(request);
  await addFeedback({
    userId: user?.id,
    email: body.email || user?.email,
    page: typeof body.page === "string" ? body.page : undefined,
    message: body.message,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// The nightly support agent reads new items and marks them handled.
// Bearer CRON_SECRET only — this exposes users' messages and emails.
function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: await listNewFeedback() });
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string") return NextResponse.json({ error: "id required" }, { status: 400 });
  await markFeedbackTriaged(body.id, typeof body.issueUrl === "string" ? body.issueUrl : undefined);
  return NextResponse.json({ ok: true });
}
