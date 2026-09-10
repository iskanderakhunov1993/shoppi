import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { applyToOpportunity, getCreatorByUserId, getOpportunity } from "@/lib/store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser(request);
  if (!user || user.role !== "creator") {
    return NextResponse.json({ error: "Creators only" }, { status: 403 });
  }

  const creator = await getCreatorByUserId(user.id);
  if (!creator) {
    return NextResponse.json({ error: "Creator profile missing" }, { status: 404 });
  }

  const opportunity = await getOpportunity(id);
  if (!opportunity || opportunity.status !== "open") {
    return NextResponse.json({ error: "Opportunity not found or closed" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const application = await applyToOpportunity(id, creator.id, body?.message?.trim() || undefined);

  return NextResponse.json(application, { status: 201 });
}
