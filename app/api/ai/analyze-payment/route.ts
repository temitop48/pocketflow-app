import { NextRequest, NextResponse } from "next/server";
import { analyzePaymentSafety } from "@/lib/server/analyzePaymentSafety";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const limited = rateLimit(`ai:${ip}`, 30, 60_000);

    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many payment reviews. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();

    const wallet = String(body.wallet || "").trim().toLowerCase();
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

    if (!ADDRESS_REGEX.test(wallet)) {
      return badRequest("Valid wallet address is required.");
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
      return badRequest("Valid payment amount is required.");
    }

    if (
      balance !== undefined &&
      (!Number.isFinite(balance) || balance < 0 || balance > 1_000_000_000)
    ) {
      return badRequest("Invalid balance value.");
    }

    if (
      !Number.isFinite(minimumBalancePercent) ||
      minimumBalancePercent < 0 ||
      minimumBalancePercent > 100
    ) {
      return badRequest("Invalid guard percentage.");
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