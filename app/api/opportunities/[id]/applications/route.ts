import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreatorById, getOpportunity, listApplicationsForOpportunity } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }

  const opportunity = await getOpportunity(id);
  if (!opportunity || opportunity.brandUserId !== user.id) {
    return NextResponse.json({ error: "Not your opportunity" }, { status: 403 });
  }

  const applications = await listApplicationsForOpportunity(id);
  const withCreators = await Promise.all(
    applications.map(async (a) => ({ ...a, creator: await getCreatorById(a.creatorId) }))
  );

  return NextResponse.json({ applications: withCreators });
}
