import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/users/me — update current user (e.g. avatar image). */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { image?: string; name?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const data: { image?: string; name?: string } = {};
    if (typeof body.image === "string") data.image = body.image;
    if (typeof body.name === "string") data.name = body.name.trim() || undefined;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, image: true, name: true },
    });

    return NextResponse.json({
      id: user.id,
      image: user.image ?? null,
      name: user.name ?? null,
    });
  } catch (e) {
    console.error("PATCH /api/users/me error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
