import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/chats/[chatId]/presence - returns the other member's lastSeenAt for real-time status. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const membership = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: { chatId, userId: session.user.id },
      },
      include: {
        chat: {
          include: {
            members: {
              where: { userId: { not: session.user.id } },
              select: { userId: true },
            },
          },
        },
      },
    });
    if (!membership || membership.chat.members.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const otherUserId = membership.chat.members[0].userId;
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "lastSeenAt" FROM "User" WHERE "id" = $1`,
        otherUserId
      )) as { lastSeenAt: Date | string | null }[];
      const lastSeenAt = rows[0]?.lastSeenAt
        ? new Date(rows[0].lastSeenAt).toISOString()
        : null;
      return NextResponse.json({ lastSeenAt });
    } catch {
      return NextResponse.json({ lastSeenAt: null });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
