import { createPublicClient, http, parseAbiItem } from "viem";
import { arcTestnet } from "@/lib/chains";
import { usdcToken } from "@/lib/tokens";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL),
});

type VerifyTransferInput = {
  txHash: `0x${string}`;
  wallet: `0x${string}`;
  counterparty: `0x${string}`;
  direction: "incoming" | "outgoing";
};

export async function verifyErc20Transfer({
  txHash,
  wallet,
  counterparty,
  direction,
}: VerifyTransferInput) {
  const receipt = await publicClient.getTransactionReceipt({
    hash: txHash,
  });

  if (receipt.status !== "success") {
    return {
      ok: false,
      error: "Transaction was not successful.",
    };
  }

  const logs = await publicClient.getLogs({
    address: usdcToken.address,
    event: transferEvent,
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  const matchedLog = logs.find((log) => {
    const from = String(log.args.from || "").toLowerCase();
    const to = String(log.args.to || "").toLowerCase();

    if (direction === "outgoing") {
      return (
        from === wallet.toLowerCase() &&
        to === counterparty.toLowerCase() &&
        log.transactionHash.toLowerCase() === txHash.toLowerCase()
      );
    }

    return (
      to === wallet.toLowerCase() &&
      from === counterparty.toLowerCase() &&
      log.transactionHash.toLowerCase() === txHash.toLowerCase()
    );
  });

  if (!matchedLog) {
    return {
      ok: false,
      error: "No matching USDC transfer found for this transaction.",
    };
  }

  return {
    ok: true,
    blockNumber: receipt.blockNumber.toString(),
  };
}