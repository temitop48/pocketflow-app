export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";
import { arcTestnet } from "@/lib/arc";
import { usdcToken } from "@/lib/tokens";
import { db } from "@/lib/db";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const wallet = String(body.wallet || "").trim().toLowerCase();
    const txHash = String(body.txHash || "").trim().toLowerCase();

    if (!ADDRESS_REGEX.test(wallet)) {
      return NextResponse.json(
        { error: "Valid wallet address is required." },
        { status: 400 }
      );
    }

    if (!HASH_REGEX.test(txHash)) {
      return NextResponse.json(
        { error: "Valid transaction hash is required." },
        { status: 400 }
      );
    }

    const receipt = await client.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction was not successful." },
        { status: 400 }
      );
    }

    const logs = await client.getLogs({
      address: usdcToken.address,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    const transferDebug = logs
      .filter((log) => log.transactionHash.toLowerCase() === txHash)
      .map((log) => ({
        from: String(log.args.from || "").toLowerCase(),
        to: String(log.args.to || "").toLowerCase(),
        amount: formatUnits(log.args.value ?? BigInt(0), usdcToken.decimals),
        logIndex: Number(log.logIndex ?? 0),
      }));

    let imported = 0;

    for (const log of logs) {
      if (log.transactionHash.toLowerCase() !== txHash) continue;

      const from = String(log.args.from || "").toLowerCase();
      const to = String(log.args.to || "").toLowerCase();
      const value = log.args.value ?? BigInt(0);

      const isIncoming = to === wallet;
      const isOutgoing = from === wallet;

      if (!isIncoming && !isOutgoing) continue;

      const eventKey = `${txHash}-${Number(log.logIndex ?? 0)}`;

      await db.transactionActivity.upsert({
        where: { eventKey },
        update: {
          wallet,
          counterparty: isIncoming ? from : to,
          direction: isIncoming ? "incoming" : "outgoing",
          amount: formatUnits(value, usdcToken.decimals),
          txHash,
          status: "confirmed",
          blockNumber: receipt.blockNumber.toString(),
        },
        create: {
          wallet,
          counterparty: isIncoming ? from : to,
          direction: isIncoming ? "incoming" : "outgoing",
          amount: formatUnits(value, usdcToken.decimals),
          txHash,
          eventKey,
          status: "confirmed",
          blockNumber: receipt.blockNumber.toString(),
        },
      });

      imported += 1;
    }

    return NextResponse.json({
      ok: true,
      imported,
      txHash,
      receiptBlock: receipt.blockNumber.toString(),
      logsFound: logs.length,
      matchingLogsInTx: transferDebug.length,
      wallet,
      transferDebug,
    });
  } catch (error) {
    console.error("Import by hash failed:", error);

    return NextResponse.json(
      { error: "Failed to import transaction by hash." },
      { status: 500 }
    );
  }
}