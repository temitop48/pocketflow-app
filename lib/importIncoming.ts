import {
  createPublicClient,
  formatUnits,
  http,
  parseAbi,
  parseAbiItem,
} from "viem";
import { arcTestnet } from "@/lib/arc";
import { usdcToken } from "@/lib/tokens";
import { db } from "@/lib/db";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const erc20BalanceAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
]);

type PublicClient = ReturnType<typeof createPublicClient>;

async function findRecentNativeIncomingTx(
  client: PublicClient,
  wallet: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint
) {
  const maxBlocksToSearch = BigInt(2000);
  const searchFrom =
    toBlock > maxBlocksToSearch ? toBlock - maxBlocksToSearch : fromBlock;

  for (let blockNumber = toBlock; blockNumber >= searchFrom; blockNumber--) {
    const block = await client.getBlock({
      blockNumber,
      includeTransactions: true,
    });

    for (const tx of block.transactions) {
      const txTo = tx.to?.toLowerCase();
      const txFrom = tx.from?.toLowerCase();

      if (!txTo || !txFrom) continue;
      if (txTo !== wallet) continue;
      if (txFrom === wallet) continue;
      if (tx.value <= BigInt(0)) continue;

      return {
        txHash: tx.hash,
        from: txFrom,
        blockNumber: blockNumber.toString(),
      };
    }

    if (blockNumber === BigInt(0)) break;
  }

  return null;
}

async function detectBalanceIncrease(
  client: PublicClient,
  wallet: `0x${string}`,
  fromBlock: bigint,
  currentBlock: bigint
) {
  const balance = await client.readContract({
    address: usdcToken.address,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: [wallet],
  });

  const currentBalance = balance.toString();

  const snapshot = await db.walletBalanceSnapshot.findUnique({
    where: { wallet },
  });

  if (!snapshot) {
    await db.walletBalanceSnapshot.create({
      data: {
        wallet,
        balance: currentBalance,
      },
    });

    return {
      detected: false,
      amount: "0",
      resolved: false,
    };
  }

  const previous = BigInt(snapshot.balance);
  const current = BigInt(currentBalance);

  await db.walletBalanceSnapshot.update({
    where: { wallet },
    data: {
      balance: currentBalance,
    },
  });

  if (current <= previous) {
    return {
      detected: false,
      amount: "0",
      resolved: false,
    };
  }

  const diff = current - previous;
  const amount = formatUnits(diff, usdcToken.decimals);

  const nativeTx = await findRecentNativeIncomingTx(
    client,
    wallet,
    fromBlock,
    currentBlock
  );

  const txHash = nativeTx?.txHash || "balance_adjustment";
  const counterparty = nativeTx?.from || "system";
  const blockNumber = nativeTx?.blockNumber || "";
  const eventKey = nativeTx
    ? `native-${nativeTx.txHash}`
    : `balance-${wallet}-${Date.now()}`;

  const existing = await db.transactionActivity.findUnique({
    where: { eventKey },
  });

  if (!existing) {
    await db.transactionActivity.create({
      data: {
        wallet,
        counterparty,
        direction: "incoming",
        amount,
        txHash,
        eventKey,
        status: "confirmed",
        blockNumber,
      },
    });
  }

  return {
    detected: true,
    amount,
    resolved: Boolean(nativeTx),
    txHash,
    counterparty,
  };
}

export async function importIncomingForWallet(wallet: string) {
  const normalizedWallet = wallet.toLowerCase() as `0x${string}`;

  const client = createPublicClient({
    chain: arcTestnet,
    transport: http(
      process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"
    ),
  });

  const currentBlock = await client.getBlockNumber();

  const syncState = await db.walletSyncState.findUnique({
    where: { wallet: normalizedWallet },
  });

  const defaultLookback = BigInt(50000);
  const maxBlockRange = BigInt(10000);
  const zero = BigInt(0);
  const one = BigInt(1);

  const savedBlock = syncState ? BigInt(syncState.lastScannedBlock) : zero;

  const fromBlock =
    savedBlock > zero
      ? savedBlock + one
      : currentBlock > defaultLookback
      ? currentBlock - defaultLookback
      : zero;

  const allLogs = [];
  let startBlock = fromBlock;

  while (startBlock <= currentBlock) {
    const batchEnd =
      startBlock + maxBlockRange > currentBlock
        ? currentBlock
        : startBlock + maxBlockRange;

    const logs = await client.getLogs({
      address: usdcToken.address,
      event: transferEvent,
      args: {
        to: normalizedWallet,
      },
      fromBlock: startBlock,
      toBlock: batchEnd,
    });

    allLogs.push(...logs);
    startBlock = batchEnd + one;
  }

  let imported = 0;

  for (const log of allLogs) {
    const txHash = log.transactionHash;
    const logIndex = Number(log.logIndex ?? zero);
    const from = String(log.args.from || "").toLowerCase();
    const to = String(log.args.to || "").toLowerCase();
    const value = log.args.value ?? zero;

    if (!txHash || !from || !to) continue;
    if (to !== normalizedWallet) continue;
    if (from === normalizedWallet) continue;

    const eventKey = `${txHash}-${logIndex}`;

    const existing = await db.transactionActivity.findUnique({
      where: { eventKey },
    });

    if (existing) continue;

    await db.transactionActivity.create({
      data: {
        wallet: normalizedWallet,
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

  await db.walletSyncState.upsert({
    where: { wallet: normalizedWallet },
    update: {
      lastScannedBlock: currentBlock.toString(),
    },
    create: {
      wallet: normalizedWallet,
      lastScannedBlock: currentBlock.toString(),
    },
  });

  const fallback = await detectBalanceIncrease(
    client,
    normalizedWallet,
    fromBlock,
    currentBlock
  );

  return {
    wallet: normalizedWallet,
    imported,
    fallbackDetected: fallback.detected,
    fallbackAmount: fallback.amount,
    fallbackResolved: fallback.resolved,
    fallbackTxHash: fallback.txHash,
    fallbackCounterparty: fallback.counterparty,
    scannedFromBlock: fromBlock.toString(),
    scannedToBlock: currentBlock.toString(),
    scannedLogCount: allLogs.length,
  };
}