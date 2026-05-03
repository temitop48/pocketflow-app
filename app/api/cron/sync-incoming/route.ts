export const dynamic = "force-dynamic";
export const runtime = "nodejs";


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importIncomingForWallet } from "@/lib/importIncoming";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const wallets = await db.walletSyncState.findMany({
      select: { wallet: true },
    });

    const results = [];

    for (const item of wallets) {
      try {
        const result = await importIncomingForWallet(item.wallet);

        results.push({
          ok: true,
          ...result,
        });
      } catch (error) {
        results.push({
          wallet: item.wallet,
          ok: false,
          error: error instanceof Error ? error.message : "Sync failed.",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      walletCount: wallets.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}