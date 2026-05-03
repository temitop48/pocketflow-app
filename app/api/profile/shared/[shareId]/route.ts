export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    shareId: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { shareId } = await context.params;

    const profile = await db.sharedProfile.findUnique({
      where: { shareId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Shared profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch shared profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}