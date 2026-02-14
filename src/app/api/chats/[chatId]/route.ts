import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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
      include: { chat: { include: { members: true } } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatMember.delete({
        where: {
          chatId_userId: { chatId, userId: session!.user!.id },
        },
      });
      const remaining = membership.chat.members.length - 1;
      if (remaining === 0) {
        await tx.message.deleteMany({ where: { chatId } });
        await tx.chat.delete({ where: { id: chatId } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
