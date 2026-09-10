import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getOpportunity, setApplicationStatus } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id, appId } = await params;
  const user = await requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }

  const opportunity = await getOpportunity(id);
  if (!opportunity || opportunity.brandUserId !== user.id) {
    return NextResponse.json({ error: "Not your opportunity" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status as string | undefined;
  if (status !== "accepted" && status !== "declined") {
    return NextResponse.json({ error: "status must be 'accepted' or 'declined'" }, { status: 400 });
  }

  const updated = await setApplicationStatus(appId, status);
  return NextResponse.json(updated);
}
