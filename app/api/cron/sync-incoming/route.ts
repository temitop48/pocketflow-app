export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { importIncomingForWallet } from "@/lib/importIncoming";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const wallets = await db.walletSyncState.findMany({
      select: { wallet: true },
      orderBy: { updatedAt: "asc" },
      take: 25,
    });

    const results = [];

    for (const item of wallets) {
      try {
        const result = await importIncomingForWallet(item.wallet);

        results.push({
          ...result,
          wallet: item.wallet,
          ok: true,
        });
      } catch (error) {
        console.error("Cron wallet sync failed:", {
          wallet: item.wallet,
          error,
        });

        results.push({
          wallet: item.wallet,
          ok: false,
          error: error instanceof Error ? error.message : "Sync failed.",
        });
      }
    }

    const successCount = results.filter((item) => item.ok).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      ok: failureCount === 0,
      checkedWallets: wallets.length,
      successCount,
      failureCount,
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (error) {
    console.error("Cron sync failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron sync failed.",
        durationMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}