import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  try {
    if (
      path.startsWith("/api/auth") ||
      path.startsWith("/api/health") ||
      path.startsWith("/api/shortcut-badge") ||
      path.startsWith("/_next") ||
      path.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    // Skip auth check if NEXTAUTH_SECRET is not set (e.g. during build or misconfigured)
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn("NEXTAUTH_SECRET not set, allowing request");
      return NextResponse.next();
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const isPublic = path === "/" || path === "/login" || path === "/register";
    if (isPublic) {
      return NextResponse.next();
    }

    if (!token?.id) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const login = new URL("/login", request.url);
      return NextResponse.redirect(login);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/chat", "/chat/:path*", "/api/users", "/api/users/:path*", "/api/chats", "/api/chats/:path*", "/api/upload", "/api/presence", "/login", "/register", "/"],
};
