import { NextResponse } from "next/server";

// Simple health check endpoint for Railway/deployment platforms
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
