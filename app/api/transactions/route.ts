export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/server/rateLimit";
import { verifyErc20Transfer } from "@/lib/server/verifyErc20Transfer";

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

const VALID_DIRECTIONS = new Set(["incoming", "outgoing"]);
const VALID_STATUSES = new Set(["pending", "confirmed", "failed"]);
const VALID_AI_VERDICTS = new Set(["safe", "risky", "not_recommended"]);

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function cleanString(value: unknown, maxLength = 256) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function cleanLower(value: unknown, maxLength = 256) {
  return cleanString(value, maxLength).toLowerCase();
}

function isValidAmount(value: string) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0 && amount < 1_000_000_000;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const limited = rateLimit(`transactions:post:${ip}`, 20, 60_000);

    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Too many transaction writes. Please wait a moment.",
        },
        { status: 429 },
      );
    }

    const body = await req.json();

    const wallet = cleanLower(body.wallet, 64);
    const counterparty = cleanLower(body.counterparty, 64);
    const direction = cleanLower(body.direction, 24);
    const amount = cleanString(body.amount, 64);
    const txHash = cleanLower(body.txHash, 80);
    const status = cleanLower(body.status || "confirmed", 24);

    const eventKey = cleanLower(body.eventKey || txHash, 160);

    const blockNumber =
      body.blockNumber !== undefined && body.blockNumber !== null
        ? cleanString(body.blockNumber, 64)
        : null;

    const aiVerdict =
      body.aiVerdict !== undefined && body.aiVerdict !== null
        ? cleanLower(body.aiVerdict, 32)
        : null;

    const aiConfidence =
      body.aiConfidence !== undefined && body.aiConfidence !== null
        ? Number(body.aiConfidence)
        : null;

    const aiReason =
      body.aiReason !== undefined && body.aiReason !== null
        ? cleanString(body.aiReason, 600)
        : null;

    if (!ADDRESS_REGEX.test(wallet)) {
      return badRequest("Invalid wallet address.");
    }

    if (!ADDRESS_REGEX.test(counterparty)) {
      return badRequest("Invalid counterparty address.");
    }

    if (!VALID_DIRECTIONS.has(direction)) {
      return badRequest("Invalid transaction direction.");
    }

    if (!isValidAmount(amount)) {
      return badRequest("Invalid transaction amount.");
    }

    if (!HASH_REGEX.test(txHash)) {
      return badRequest("Invalid transaction hash.");
    }

    if (!eventKey || eventKey.length < 10 || eventKey.length > 160) {
      return badRequest("Invalid event key.");
    }

    if (!VALID_STATUSES.has(status)) {
      return badRequest("Invalid transaction status.");
    }

    if (aiVerdict && !VALID_AI_VERDICTS.has(aiVerdict)) {
      return badRequest("Invalid AI verdict.");
    }

    if (
      aiConfidence !== null &&
      (!Number.isInteger(aiConfidence) ||
        aiConfidence < 0 ||
        aiConfidence > 100)
    ) {
      return badRequest("Invalid AI confidence.");
    }

    if (direction === "outgoing" && txHash !== "balance_adjustment") {
      const verified = await verifyErc20Transfer({
        txHash: txHash as `0x${string}`,
        wallet: wallet as `0x${string}`,
        counterparty: counterparty as `0x${string}`,
        direction,
      });

      if (!verified.ok) {
        return NextResponse.json(
          {
            error:
              verified.error || "Transaction could not be verified onchain.",
          },
          { status: 400 },
        );
      }
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

    return NextResponse.json({
      ok: true,
      activity: created,
    });
  } catch (error) {
    console.error("Transaction write failed:", error);

    return NextResponse.json(
      { error: "Failed to save transaction." },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const limited = rateLimit(`transactions:get:${ip}`, 60, 60_000);

    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Too many transaction reads. Please wait a moment.",
        },
        { status: 429 },
      );
    }

    const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();

    const limitParam = req.nextUrl.searchParams.get("limit");

    const limit = limitParam ? Number(limitParam) : 50;

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.floor(limit), 1), 100)
      : 50;

    if (!wallet || !ADDRESS_REGEX.test(wallet)) {
      return badRequest("Valid wallet query parameter is required.");
    }

    const activities = await db.transactionActivity.findMany({
     where: { wallet },
     orderBy: { createdAt: "desc" },
     take: safeLimit + 1,
    });

    const hasMore = activities.length > safeLimit;
    const visibleActivities = activities.slice(0, safeLimit);

    return NextResponse.json({
     activities: visibleActivities,
     pagination: {
     limit: safeLimit,
     hasMore,
      },
    });

  } catch (error) {
    console.error("Transaction fetch failed:", error);

    return NextResponse.json(
      { error: "Failed to fetch transactions." },
      { status: 500 },
    );
  }
}
