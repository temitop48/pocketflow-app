"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { arcTestnet } from "@/lib/arc";
import { useState } from "react";

const config = getDefaultConfig({
  appName: "PocketFlow",
  projectId: "pocketflow-demo",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(
      process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.network"
    ),
  },
});

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}