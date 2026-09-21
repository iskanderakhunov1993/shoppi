import { NextRequest, NextResponse } from "next/server";
import { getCreatorAvatar } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;
  const avatar = await getCreatorAvatar(creatorId);
  if (!avatar) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatar.mime,
      // Safe to cache forever: every upload changes the ?v= in the URL.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
