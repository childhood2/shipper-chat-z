import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SearchMessageResult = {
  messageId: string;
  chatId: string;
  content: string;
  createdAt: string;
  contactName: string | null;
  contactImage: string | null;
};

/** GET /api/chats/search?q=... — search messages in user's chats, most recent first */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const chatIds = await prisma.chatMember
      .findMany({
        where: { userId: session.user.id, isArchived: false },
        select: { chatId: true },
      })
      .then((rows) => rows.map((r) => r.chatId));

    if (chatIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const placeholders = chatIds.map(() => "?").join(",");
    const likePattern = `%${q.toLowerCase()}%`;
    const messages = (await prisma.$queryRawUnsafe<
      { id: string; chatId: string; content: string; createdAt: Date }[]
    >(
      `SELECT id, "chatId", content, "createdAt"
       FROM "Message"
       WHERE "chatId" IN (${placeholders})
         AND LOWER(content) LIKE ?
       ORDER BY "createdAt" DESC
       LIMIT 80`,
      ...chatIds,
      likePattern
    ));

    const uniqueChatIds = [...new Set(messages.map((m) => m.chatId))];
    const membersByChat = await prisma.chatMember.findMany({
      where: {
        chatId: { in: uniqueChatIds },
        userId: { not: session.user.id },
      },
      include: { user: { select: { name: true, image: true } } },
    });
    const contactByChatId: Record<
      string,
      { name: string | null; image: string | null }
    > = {};
    for (const mb of membersByChat) {
      contactByChatId[mb.chatId] = {
        name: mb.user?.name ?? null,
        image: mb.user?.image ?? null,
      };
    }

    const results: SearchMessageResult[] = messages.map((m) => ({
      messageId: m.id,
      chatId: m.chatId,
      content: m.content,
      createdAt: new Date(m.createdAt).toISOString(),
      contactName: contactByChatId[m.chatId]?.name ?? null,
      contactImage: contactByChatId[m.chatId]?.image ?? null,
    }));

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
