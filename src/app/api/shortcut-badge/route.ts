import { NextRequest, NextResponse } from "next/server";
import {
  SHORTCUT_WIN_K_DATA_URL,
  SHORTCUT_CMD_K_DATA_URL,
} from "@/assets/shortcutBadges";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") ?? "win";
  const dataUrl =
    platform === "mac" ? SHORTCUT_CMD_K_DATA_URL : SHORTCUT_WIN_K_DATA_URL;
  const buffer = dataUrlToBuffer(dataUrl);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
