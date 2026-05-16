export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const startedAt = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: "PocketFlow",
      database: "connected",
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        service: "PocketFlow",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}