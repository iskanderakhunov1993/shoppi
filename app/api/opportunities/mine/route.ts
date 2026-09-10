import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { listApplicationsForOpportunity, listOpportunitiesByBrand } from "@/lib/store";

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }

  const opportunities = await listOpportunitiesByBrand(user.id);
  const withCounts = await Promise.all(
    opportunities.map(async (o) => ({
      ...o,
      applicationCount: (await listApplicationsForOpportunity(o.id)).length,
    }))
  );

  return NextResponse.json({ opportunities: withCounts });
}
