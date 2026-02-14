import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getResolvedDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.replace(/^["']|["']$/g, "").trim() ?? "";
  if (!databaseUrl.startsWith("file:")) return databaseUrl;
  const relativePath = databaseUrl.replace(/^file:\/?/i, "").replace(/^\.\//, "").replace(/\\/g, "/");
  const absolutePath = resolve(process.cwd(), relativePath);
  try {
    mkdirSync(dirname(absolutePath), { recursive: true });
  } catch {}
  const normalized = absolutePath.replace(/\\/g, "/");
  return `file:${normalized}`;
}

const resolvedUrl = getResolvedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolvedUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
