export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = String(body.wallet || "").toLowerCase();
    const counterparty = String(body.counterparty || "").toLowerCase();
    const direction = String(body.direction || "");
    const amount = String(body.amount || "");
    const txHash = String(body.txHash || "").toLowerCase();
    const status = String(body.status || "confirmed");
    const eventKey = String(body.eventKey || txHash).toLowerCase();

    const blockNumber =
      body.blockNumber !== undefined && body.blockNumber !== null
        ? String(body.blockNumber)
        : null;

    const aiVerdict =
      body.aiVerdict !== undefined && body.aiVerdict !== null
        ? String(body.aiVerdict)
        : null;

    const aiConfidence =
      body.aiConfidence !== undefined && body.aiConfidence !== null
        ? Number(body.aiConfidence)
        : null;

    const aiReason =
      body.aiReason !== undefined && body.aiReason !== null
        ? String(body.aiReason)
        : null;

    if (!wallet || !counterparty || !direction || !amount || !txHash || !eventKey) {
      return NextResponse.json(
        { error: "Missing required transaction fields." },
        { status: 400 }
      );
    }

    const created = await db.transactionActivity.upsert({
      where: { eventKey },
      update: {
        wallet,
        counterparty,
        direction,
        amount,
        txHash,
        status,
        blockNumber,
        aiVerdict,
        aiConfidence,
        aiReason,
      },
      create: {
        wallet,
        counterparty,
        direction,
        amount,
        txHash,
        eventKey,
        status,
        blockNumber,
        aiVerdict,
        aiConfidence,
        aiReason,
      },
    });

    return NextResponse.json({ ok: true, activity: created });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      where: { wallet },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}