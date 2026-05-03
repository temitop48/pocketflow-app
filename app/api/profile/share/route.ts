export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateCashflowScore } from "@/lib/score";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body.wallet || "").toLowerCase();
    const visibility = String(body.visibility || "shared");

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet is required." },
        { status: 400 }
      );
    }

    const activities = await db.transactionActivity.findMany({
      where: {
        OR: [{ wallet }, { counterparty: wallet }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const normalized = activities.map((item) => ({
      direction:
        item.wallet === wallet
          ? item.direction
          : item.direction === "outgoing"
          ? "incoming"
          : "outgoing",
      amount: item.amount,
      createdAt: item.createdAt,
    }));

    const score = calculateCashflowScore(normalized);

    const shareId = randomUUID();

    const sharedProfile = await db.sharedProfile.create({
      data: {
        wallet,
        shareId,
        score: score.score,
        label: score.label,
        trend: score.trend,
        summary: score.summary,
        visibility,
      },
    });

    console.log("Created shared profile:", sharedProfile);

    return NextResponse.json({
      ok: true,
      shareId: sharedProfile.shareId,
      profile: sharedProfile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create shared profile.";
    console.error("Share profile creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}