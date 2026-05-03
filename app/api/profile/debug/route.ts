export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profiles = await db.sharedProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load shared profiles.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}