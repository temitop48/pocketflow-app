export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";
import { arcTestnet } from "@/lib/arc";
import { usdcToken } from "@/lib/tokens";
import { db } from "@/lib/db";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const wallet = String(body.wallet || "").toLowerCase() as `0x${string}`;

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet is required." },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: arcTestnet,
      transport: http(
        process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"
      ),
    });

    const currentBlock = await client.getBlockNumber();
    const defaultLookback = 5000n;

    const fromBlock =
      currentBlock > defaultLookback ? currentBlock - defaultLookback : 0n;

    const logs = await client.getLogs({
      address: usdcToken.address,
      event: transferEvent,
      args: {
        to: wallet,
      },
      fromBlock,
      toBlock: currentBlock,
    });

    let imported = 0;

    for (const log of logs) {
      const txHash = log.transactionHash;
      const logIndex = Number(log.logIndex ?? 0n);
      const from = String(log.args.from || "").toLowerCase();
      const to = String(log.args.to || "").toLowerCase();
      const value = log.args.value ?? 0n;

      if (!txHash || !from || !to) continue;

      // only true incoming transfers
      if (to !== wallet) continue;

      // ignore self-transfers
      if (from === wallet) continue;

      const eventKey = `${txHash}-${logIndex}`;

      await db.transactionActivity.upsert({
        where: { eventKey },
        update: {},
        create: {
          wallet,
          counterparty: from,
          direction: "incoming",
          amount: formatUnits(value, usdcToken.decimals),
          txHash,
          eventKey,
          status: "confirmed",
          blockNumber: String(log.blockNumber ?? ""),
        },
      });

      imported += 1;
    }

    return NextResponse.json({
      ok: true,
      imported,
      scannedFromBlock: fromBlock.toString(),
      scannedToBlock: currentBlock.toString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to import incoming activity.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}