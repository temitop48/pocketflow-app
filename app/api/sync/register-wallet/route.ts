export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureWalletSyncState } from "@/lib/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body.wallet || "").toLowerCase();

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet is required." },
        { status: 400 }
      );
    }

    const record = await ensureWalletSyncState(wallet);

    return NextResponse.json({
      ok: true,
      wallet: record.wallet,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register wallet.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}