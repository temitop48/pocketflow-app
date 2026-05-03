export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { arcTestnet } from "@/lib/arc";
import { pocketFlowRegistryAbi, pocketFlowRegistryAddress } from "@/lib/contracts";

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet") as `0x${string}` | null;

    if (!wallet) {
      return NextResponse.json(
        { error: "wallet query parameter is required." },
        { status: 400 }
      );
    }

    const client = createPublicClient({
      chain: arcTestnet,
      transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL),
    });

    const data = (await client.readContract({
      address: pocketFlowRegistryAddress,
      abi: pocketFlowRegistryAbi,
      functionName: "getProfile",
      args: [wallet],
    })) as {
      visibility: number;
      profileHash: `0x${string}`;
      sharedProfileId: string;
      updatedAt: bigint;
    };

    return NextResponse.json({
      profile: {
        visibility: Number(data.visibility),
        profileHash: String(data.profileHash),
        sharedProfileId: String(data.sharedProfileId),
        updatedAt: Number(data.updatedAt),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch registry profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}