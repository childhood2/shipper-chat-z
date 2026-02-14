import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_AUDIO = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let chatId = (formData.get("chatId") as string) || "shared";
    const type = (formData.get("type") as string) || "file";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    if (type === "avatar") {
      const isImage =
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|gif|webp|avif)$/i.test(file.name || "");
      if (!isImage) {
        return NextResponse.json(
          { error: "Image required for avatar" },
          { status: 400 }
        );
      }
      chatId = `avatars/${session.user.id}`;
    }

    if (type === "audio") {
      const isAudio =
        ALLOWED_AUDIO.includes(file.type) || file.type.startsWith("audio/");
      if (!isAudio) {
        return NextResponse.json(
          { error: "Audio type required" },
          { status: 400 }
        );
      }
    }

    const ext =
      type === "audio"
        ? (file.name?.split(".").pop() || "webm")
        : type === "avatar"
          ? (file.name?.split(".").pop() || "jpg").toLowerCase()
          : path.extname(file.name || "").slice(1) || "bin";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", chatId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, safeName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${chatId}/${safeName}`;
    return NextResponse.json({
      url,
      fileName: file.name || safeName,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
