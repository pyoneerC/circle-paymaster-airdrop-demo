import { createPublicClient, http, getContract, encodeFunctionData,   encodePacked, parseAbi, parseErc6492Signature, formatUnits, hexToBigInt } from 'viem'
import { createBundlerClient } from 'viem/account-abstraction'
import { arbitrumSepolia } from 'viem/chains'
import { toEcdsaKernelSmartAccount } from 'permissionless/accounts'
import { privateKeyToAccount } from 'viem/accounts'
import { eip2612Permit, tokenAbi } from './permit-helpers'

const ARBITRUM_SEPOLIA_USDC = '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
const ARBITRUM_SEPOLIA_PAYMASTER = '0x31BE08D380A21fc740883c0BC434FcFc88740b58'
const ARBITRUM_SEPOLIA_BUNDLER = `https://public.pimlico.io/v2/${arbitrumSepolia.id}/rpc`

export async function transferUSDC(
  privateKey: `0x${string}`,
  recipientAddress: string,
  amount: bigint
) {
  // Create clients
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
  })
  const bundlerClient = createBundlerClient({
    client,
    transport: http(ARBITRUM_SEPOLIA_BUNDLER)
  })

  // Create accounts
  const owner = privateKeyToAccount(privateKey)
  const account = await toEcdsaKernelSmartAccount({
    client,
    owner,
    version: '0.3.1'
  })

  // Setup USDC contract
  const usdc = getContract({
    client,
    address: ARBITRUM_SEPOLIA_USDC,
    abi: tokenAbi,
  })

  // Verify USDC balance first
  const balance = await usdc.read.balanceOf([account.address])
  if (balance < amount) {
    throw new Error(`Insufficient USDC balance. Have: ${formatUnits(balance, 6)}, Need: ${formatUnits(amount, 6)}`)
  }

  // Construct and sign permit
  const permitData = await eip2612Permit({
    token: usdc,
    chain: arbitrumSepolia,
    ownerAddress: account.address,
    spenderAddress: ARBITRUM_SEPOLIA_PAYMASTER,
    value: amount
  })

  const signData = { ...permitData, primaryType: 'Permit' as const }
  const permitSignature = await account.signTypedData(signData)

  // Prepare transfer call
  const calls = [{
    to: usdc.address,
    data: encodeFunctionData({
      abi: tokenAbi,
      functionName: 'transfer',
      args: [recipientAddress, amount]
    })
  }]

  // Send user operation with new paymaster format
  const userOpHash = await bundlerClient.sendUserOperation({
    account,
    calls,
    paymaster: {
      address: ARBITRUM_SEPOLIA_PAYMASTER,
      data: encodePacked(
        ['bytes', 'address', 'uint256', 'bytes'],
        ['0x00', usdc.address, amount, permitSignature]
      )
    }
  })

  // Wait for receipt
  const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash
  })

  return userOpReceipt
}