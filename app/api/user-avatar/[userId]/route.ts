import { NextRequest, NextResponse } from "next/server";
import { getUserAvatar } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const avatar = await getUserAvatar(userId);
  if (!avatar) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatar.mime,
      // Safe to cache forever: every upload changes the ?v= in the URL.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
