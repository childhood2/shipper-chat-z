import { NextRequest, NextResponse } from "next/server";
import {
  SHORTCUT_WIN_K_DATA_URL,
  SHORTCUT_CMD_K_DATA_URL,
} from "@/assets/shortcutBadges";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") ?? "win";
  const dataUrl =
    platform === "mac" ? SHORTCUT_CMD_K_DATA_URL : SHORTCUT_WIN_K_DATA_URL;
  const body = dataUrlToUint8Array(dataUrl);
  const blob = new Blob([body], { type: "image/png" });
  return new NextResponse(blob, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
