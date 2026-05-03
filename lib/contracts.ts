export const pocketFlowRegistryAddress =
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export const pocketFlowRegistryAbi = [
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "visibility", type: "uint8" },
          { name: "profileHash", type: "bytes32" },
          { name: "sharedProfileId", type: "string" },
          { name: "updatedAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "setVisibility",
    stateMutability: "nonpayable",
    inputs: [{ name: "visibility", type: "uint8" }],
    outputs: [],
  },
  {
    type: "function",
    name: "setSharedProfileId",
    stateMutability: "nonpayable",
    inputs: [{ name: "sharedProfileId", type: "string" }],
    outputs: [],
  },
] as const;