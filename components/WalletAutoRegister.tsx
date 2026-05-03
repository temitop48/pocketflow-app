"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export default function WalletAutoRegister() {
  const { address, isConnected } = useAccount();
  const lastRegistered = useRef<string | null>(null);

  useEffect(() => {
    async function registerWallet() {
      if (!isConnected || !address) return;

      const wallet = address.toLowerCase();

      if (lastRegistered.current === wallet) return;

      try {
        await fetch("/api/sync/register-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ wallet }),
        });

        lastRegistered.current = wallet;
      } catch (error) {
        console.error("Failed to register wallet for sync:", error);
      }
    }

    registerWallet();
  }, [address, isConnected]);

  return null;
}