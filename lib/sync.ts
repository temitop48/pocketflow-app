import { db } from "@/lib/db";

export async function ensureWalletSyncState(wallet: string) {
  const normalizedWallet = wallet.toLowerCase();

  const existing = await db.walletSyncState.findUnique({
    where: { wallet: normalizedWallet },
  });

  if (existing) return existing;

  return db.walletSyncState.create({
    data: {
      wallet: normalizedWallet,
      lastScannedBlock: "0",
    },
  });
}