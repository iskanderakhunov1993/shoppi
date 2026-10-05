import { NextRequest, NextResponse } from "next/server";
import { listDigestRecipients, markDigestSent, newFindsFor, unsubscribeToken } from "@/lib/digest";
import { EMAIL_ENABLED, sendDigestEmail } from "@/lib/email";
import { track } from "@/lib/events";

// Vercel Cron calls this weekly (see vercel.json) with
// "Authorization: Bearer $CRON_SECRET". One run handles a batch; anyone
// not reached is picked up next time since digest_sent_at stays old.
const BATCH = 200;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!EMAIL_ENABLED) {
    return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 503 });
  }

  const base = process.env.APP_URL ?? `https://${request.headers.get("host")}`;
  const recipients = await listDigestRecipients(BATCH);
  let sent = 0;
  let skipped = 0;

  for (const r of recipients) {
    const { total, items } = await newFindsFor(r.userId);
    // Nothing new: don't mail, and don't mark — so next week checks again.
    if (total === 0) {
      skipped++;
      continue;
    }
    const ok = await sendDigestEmail({
      email: r.email,
      total,
      items: items.map((i) => ({ ...i, url: `${base}/r/${i.id}?src=digest` })),
      allUrl: `${base}/dashboard?tab=circle`,
      unsubscribeUrl: `${base}/api/digest/unsubscribe?u=${encodeURIComponent(r.userId)}&t=${unsubscribeToken(r.userId)}`,
    });
    if (ok) {
      await markDigestSent(r.userId);
      await track("digest_sent", { userId: r.userId });
      sent++;
    }
  }

  return NextResponse.json({ candidates: recipients.length, sent, skipped });
}
