import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import {
  createOpportunity,
  getCreatorByUserId,
  listApplicationsByCreator,
  listOpenOpportunities,
} from "@/lib/store";

const CATEGORIES = ["cosmetics", "mens", "clothing"] as const;

export async function GET(request: NextRequest) {
  const opportunities = await listOpenOpportunities();

  // A signed-in creator also gets their own application status per
  // opportunity, so the list can show "Вы откликнулись" instead of a
  // dead-end apply button they'd click twice.
  const user = await requireUser(request);
  if (user?.role === "creator") {
    const creator = await getCreatorByUserId(user.id);
    if (creator) {
      const applications = await listApplicationsByCreator(creator.id);
      const statusByOpportunity = new Map(applications.map((a) => [a.opportunityId, a.status]));
      return NextResponse.json({
        opportunities: opportunities.map((o) => ({
          ...o,
          myStatus: statusByOpportunity.get(o.id) ?? null,
        })),
      });
    }
  }

  return NextResponse.json({ opportunities });
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user || user.role !== "brand") {
    return NextResponse.json({ error: "Brands only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title as string | undefined;
  const description = body?.description as string | undefined;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }
  const category = body?.category as string | undefined;
  if (category && !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json(
      { error: `category must be one of: ${CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const opportunity = await createOpportunity({
    brandUserId: user.id,
    title: title.trim(),
    description: description.trim(),
    compensation: body?.compensation?.trim() || undefined,
    category: category as (typeof CATEGORIES)[number] | undefined,
  });

  return NextResponse.json(opportunity, { status: 201 });
}
