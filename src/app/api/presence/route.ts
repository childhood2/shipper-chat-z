import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Consider user "online" if lastSeenAt is within this many ms. */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { online?: boolean };
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const online = body.online !== false;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastSeenAt: online ? new Date() : null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
