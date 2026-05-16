export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateCashflowScore } from "@/lib/score";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();

    if (!wallet || !ADDRESS_REGEX.test(wallet)) {
      return badRequest("Valid wallet query parameter is required.");
    }

    const activities = await db.transactionActivity.findMany({
      where: {
        OR: [{ wallet }, { counterparty: wallet }],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
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
    console.error("Score calculation failed:", error);

    return NextResponse.json(
      { error: "Failed to calculate score." },
      { status: 500 }
    );
  }
}