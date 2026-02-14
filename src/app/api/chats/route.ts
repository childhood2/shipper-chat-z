import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.chatMember.findMany({
      where: { userId: session.user.id, isArchived: false },
      include: {
        chat: {
          include: {
            members: {
              where: { userId: { not: session.user.id } },
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                content: true,
                createdAt: true,
                senderId: true,
                sender: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { chat: { lastActivityAt: "desc" } },
    });

    const otherUserIds = memberships
      .map((m) => m.chat.members[0]?.user?.id)
      .filter((id): id is string => !!id);

    let lastSeenByUserId: Record<string, string | null> = {};
    if (otherUserIds.length > 0) {
      try {
        const placeholders = otherUserIds.map(() => "?").join(",");
        const rows = (await prisma.$queryRawUnsafe(
          `SELECT "id", "lastSeenAt" FROM "User" WHERE "id" IN (${placeholders})`,
          ...otherUserIds
        )) as { id: string; lastSeenAt: Date | null }[];
        lastSeenByUserId = Object.fromEntries(
          rows.map((r) => [r.id, r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : null])
        );
      } catch {
        // Column may not exist or DB error; leave all null
      }
    }

    const list = memberships.map((m) => {
      const other = m.chat.members[0]?.user;
      const last = m.chat.messages[0];
      const otherId = other?.id;
      const fromOther = (other?.name && String(other.name).trim()) || other?.email;
      const sender = last && "sender" in last ? (last as { sender?: { name: string | null; email: string } }).sender : undefined;
      const fromSender = sender && ((sender.name && String(sender.name).trim()) || sender.email);
      const displayName = fromOther || fromSender || null;
      const name = displayName ?? "Unknown contact";
      return {
        id: m.chat.id,
        otherUserId: otherId ?? null,
        name,
        email: other?.email ?? null,
        avatarUrl: other?.image ?? null,
        preview: last?.content ?? null,
        lastActivityAt: last?.createdAt ?? m.chat.lastActivityAt,
        lastSeenAt: (otherId ? lastSeenByUserId[otherId] : null) ?? null,
        isUnread: false,
        isArchived: m.isArchived,
      };
    });

    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { otherUserId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const otherUserId = body.otherUserId;
    if (!otherUserId || otherUserId === session.user.id) {
      return NextResponse.json(
        { error: "otherUserId required and must differ from current user" },
        { status: 400 }
      );
    }

    const other = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!other) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.chatMember.findFirst({
      where: {
        userId: session.user.id,
        chat: {
          members: {
            some: { userId: otherUserId },
          },
        },
      },
      include: {
        chat: {
          include: {
            members: {
              where: { userId: otherUserId },
              include: { user: { select: { id: true, name: true, email: true, image: true } } },
            },
          },
        },
      },
    });

    if (existing) {
      const otherUser = existing.chat.members[0]?.user;
      return NextResponse.json({
        chatId: existing.chat.id,
        otherUser: {
          id: otherUser?.id,
          name: otherUser?.name ?? otherUser?.email ?? "Unknown",
          email: otherUser?.email,
          avatarUrl: otherUser?.image ?? null,
        },
      });
    }

    const chat = await prisma.chat.create({
      data: {
        members: {
          create: [
            { userId: session.user.id },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        members: {
          where: { userId: otherUserId },
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    const otherUser = chat.members[0]?.user;
    return NextResponse.json({
      chatId: chat.id,
      otherUser: {
        id: otherUser?.id,
        name: otherUser?.name ?? otherUser?.email ?? "Unknown",
        email: otherUser?.email,
        avatarUrl: otherUser?.image ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
