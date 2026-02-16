import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
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
    });
    if (!membership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        senderName: m.sender.name ?? m.sender.email ?? "Unknown",
        senderImage: m.sender.image ?? null,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
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
    });
    if (!membership) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    let body: { content?: string; type?: string; senderId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }
    const type =
      body.type === "audio" || body.type === "file" || body.type === "emoji" || body.type === "call"
        ? body.type
        : "text";

    let senderId = session.user.id;
    if (type === "call" && body.senderId) {
      const member = await prisma.chatMember.findUnique({
        where: { chatId_userId: { chatId, userId: body.senderId } },
      });
      if (member) senderId = body.senderId;
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          chatId,
          senderId,
          content,
          type,
        },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: { lastActivityAt: new Date() },
      }),
    ]);

    const sender = await prisma.user.findUnique({
      where: { id: message.senderId },
      select: { name: true, email: true, image: true },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      senderName: sender?.name ?? sender?.email ?? "Unknown",
      senderImage: sender?.image ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
