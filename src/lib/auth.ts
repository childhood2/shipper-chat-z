import NextAuth, { type AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user?.password) return null;
        const ok = await compare(password, user.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: user.name ?? existing.name,
              image: user.image ?? existing.image,
              provider: "google",
            },
          });
        } else {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              provider: "google",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          } else {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.picture = user.image;
          }
        } catch {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        session.user.id = (token.id as string) ?? "";
        session.user.email = (token.email as string) ?? "";
        session.user.name = (token.name as string) ?? "";
        session.user.image = (token.picture as string | null) ?? null;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true, name: true },
          });
          if (dbUser) {
            session.user.image = dbUser.image ?? session.user.image;
            session.user.name = (dbUser.name as string) ?? session.user.name;
          }
        } catch {
          // keep token values
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
};

/** Returns true if session has a user id that exists in the DB; false if stale/invalid. */
export async function isSessionUserInDb(
  session: { user?: { id?: string } } | null
): Promise<boolean> {
  const id = session?.user?.id;
  if (!id) return false;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  } catch {
    return false;
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
