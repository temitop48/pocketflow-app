export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateCashflowScore } from "@/lib/score";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query parameter is required." },
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

    const result = calculateCashflowScore(normalized);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to calculate score.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}