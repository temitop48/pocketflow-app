// lib/tokens.ts

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: `0x${string}`;
};

// 🔹 Main token registry (what your app expects)
export const TOKENS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0x3600000000000000000000000000000000000000",
  },
} as const satisfies Record<string, Token>;

// 🔹 Optional: default export for quick access
export const usdcToken = TOKENS.USDC;

// 🔹 ERC20 ABI (used for balance + transfer)
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// 🔹 Helpful type
export type TokenKey = keyof typeof TOKENS;