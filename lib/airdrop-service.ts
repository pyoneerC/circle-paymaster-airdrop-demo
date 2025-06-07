
import {
  createPublicClient,
  http,
  getContract,
  encodeFunctionData,
  encodePacked,
  parseAbi,
  parseErc6492Signature,
  formatUnits,
  hexToBigInt,
} from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { eip2612Permit, tokenAbi } from "./permit-helpers";
import { toKernelSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";

const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const ARBITRUM_SEPOLIA_PAYMASTER = "0x31BE08D380A21fc740883c0BC434FcFc88740b58";
const ARBITRUM_SEPOLIA_BUNDLER = `https://public.pimlico.io/v2/${arbitrumSepolia.id}/rpc`;

// You'll need to deploy these contracts and update these addresses
const AIRDROP_CLAIMER_ADDRESS = "0x..."; // Update after deployment
const BOUNTY_TOKEN_ADDRESS = "0x..."; // Update after deployment

const MAX_GAS_USDC = BigInt(1000000); // 1 USDC

const airdropClaimerAbi = [
  {
    inputs: [],
    name: "claimTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isEligible",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "hasClaimed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function checkEligibility(userAddress: string): Promise<boolean> {
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  const contract = getContract({
    client,
    address: AIRDROP_CLAIMER_ADDRESS as `0x${string}`,
    abi: airdropClaimerAbi,
  });

  return await contract.read.isEligible([userAddress as `0x${string}`]);
}

export async function claimAirdrop(privateKey: `0x${string}`) {
  // Create clients
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  const bundlerClient = createBundlerClient({
    client,
    transport: http(ARBITRUM_SEPOLIA_BUNDLER),
  });

  // Create accounts
  const owner = privateKeyToAccount(privateKey);
  const account = await toKernelSmartAccount({
    client: client,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    owners: [owner],
    version: "0.3.1",
  });

  // Setup USDC contract
  const usdc = getContract({
    client,
    address: ARBITRUM_SEPOLIA_USDC,
    abi: tokenAbi,
  });

  // Check USDC balance for gas
  const balance = await usdc.read.balanceOf([account.address]);
  const gasBuffer = BigInt(2_000_000); // 2 USDC for gas
  
  if (balance < gasBuffer) {
    throw new Error(
      `Insufficient USDC balance for gas fees. Need at least 2 USDC, have: ${formatUnits(balance, 6)}`
    );
  }

  // Construct and sign permit
  const permitData = await eip2612Permit({
    token: usdc,
    chain: arbitrumSepolia,
    ownerAddress: account.address,
    spenderAddress: ARBITRUM_SEPOLIA_PAYMASTER,
    value: MAX_GAS_USDC,
  });
  const signData = { ...permitData, primaryType: "Permit" as const };
  const wrappedPermitSignature = await account.signTypedData(signData);
  const { signature: permitSignature } = parseErc6492Signature(
    wrappedPermitSignature
  );

  // Prepare claim call
  const calls = [
    {
      to: AIRDROP_CLAIMER_ADDRESS as `0x${string}`,
      abi: airdropClaimerAbi,
      functionName: "claimTokens",
      args: [],
    },
  ];

  // Setup paymaster
  const paymaster = ARBITRUM_SEPOLIA_PAYMASTER;
  const paymasterData = encodePacked(
    ["uint8", "address", "uint256", "bytes"],
    [
      0, // Reserved for future use
      usdc.address, // Token address
      MAX_GAS_USDC, // Max spendable gas in USDC
      permitSignature, // EIP-2612 permit signature
    ]
  );

  // Get additional gas charge from paymaster
  const additionalGasCharge = hexToBigInt(
    (
      await client.call({
        to: paymaster,
        data: encodeFunctionData({
          abi: parseAbi(["function additionalGasCharge() returns (uint256)"]),
          functionName: "additionalGasCharge",
        }),
      })
    )?.data ?? "0x"
  );

  // Get current gas prices
  const { standard: fees } = (await bundlerClient.request({
    method: "pimlico_getUserOperationGasPrice" as any,
  })) as {
    standard: {
      maxFeePerGas: `0x${string}`;
      maxPriorityFeePerGas: `0x${string}`;
    };
  };
  const maxFeePerGas = hexToBigInt(fees.maxFeePerGas);
  const maxPriorityFeePerGas = hexToBigInt(fees.maxPriorityFeePerGas);

  // Estimate gas limits
  const {
    callGasLimit,
    preVerificationGas,
    verificationGasLimit,
    paymasterPostOpGasLimit,
    paymasterVerificationGasLimit,
  } = await bundlerClient.estimateUserOperationGas({
    account,
    calls,
    paymaster,
    paymasterData,
    paymasterPostOpGasLimit: additionalGasCharge,
    maxFeePerGas: 1n,
    maxPriorityFeePerGas: 1n,
  });

  // Send user operation
  const userOpHash = await bundlerClient.sendUserOperation({
    account,
    calls,
    callGasLimit,
    preVerificationGas,
    verificationGasLimit,
    paymaster,
    paymasterData,
    paymasterVerificationGasLimit,
    paymasterPostOpGasLimit: BigInt(
      Math.max(Number(paymasterPostOpGasLimit), Number(additionalGasCharge))
    ),
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  // Wait for receipt
  const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  return userOpReceipt;
}
