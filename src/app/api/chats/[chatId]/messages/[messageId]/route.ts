import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/chats/[chatId]/messages/[messageId] — delete a single message (must be in the chat and user must be a member). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId } = await params;

    const membership = await prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const message = await prisma.message.findFirst({
      where: { id: messageId, chatId },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
