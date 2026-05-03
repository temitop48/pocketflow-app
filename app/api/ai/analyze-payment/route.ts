import { NextRequest, NextResponse } from "next/server";
import { analyzePaymentSafety } from "@/lib/server/analyzePaymentSafety";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = String(body.wallet || "").toLowerCase();
    const amount = Number(body.amount || 0);

    const balance =
      body.balance === undefined || body.balance === null
        ? undefined
        : Number(body.balance);

    const guardMode = Boolean(body.guardMode);

    const minimumBalancePercent =
      body.minimumBalancePercent === undefined ||
      body.minimumBalancePercent === null
        ? 20
        : Number(body.minimumBalancePercent);

    if (!wallet || !wallet.startsWith("0x")) {
      return NextResponse.json(
        { error: "Valid wallet address is required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required." },
        { status: 400 }
      );
    }

    if (balance !== undefined && !Number.isFinite(balance)) {
      return NextResponse.json(
        { error: "Invalid balance value." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(minimumBalancePercent)) {
      return NextResponse.json(
        { error: "Invalid guard percentage." },
        { status: 400 }
      );
    }

    const analysis = await analyzePaymentSafety({
      wallet,
      amount,
      balance,
      guardMode,
      minimumBalancePercent,
    });

    return NextResponse.json({
      ok: true,
      analysis,
    });
  } catch (error) {
    console.error("AI payment analysis failed:", error);

    return NextResponse.json(
      { error: "Failed to analyze payment safety." },
      { status: 500 }
    );
  }
}