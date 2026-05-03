export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = String(body.wallet || "").toLowerCase();
    const counterparty = String(body.counterparty || "").toLowerCase();
    const amount = String(body.amount || "");
    const txHash = String(body.txHash || "").toLowerCase();
    const status = String(body.status || "confirmed");

    // ✅ NEW: eventKey (required)
    const eventKey = String(body.eventKey || txHash).toLowerCase();

    if (!wallet || !counterparty || !amount || !txHash || !eventKey) {
      return NextResponse.json(
        {
          error:
            "wallet, counterparty, amount, txHash, and eventKey are required.",
        },
        { status: 400 }
      );
    }

    const created = await db.transactionActivity.upsert({
      where: { eventKey }, // ✅ FIXED (was txHash)
      update: {
        wallet,
        counterparty,
        direction: "incoming",
        amount,
        txHash,
        status,
      },
      create: {
        wallet,
        counterparty,
        direction: "incoming",
        amount,
        txHash,
        eventKey, // ✅ REQUIRED
        status,
      },
    });

    return NextResponse.json({ ok: true, activity: created });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save incoming activity.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}