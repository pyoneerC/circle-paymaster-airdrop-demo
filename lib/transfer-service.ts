
import { createPublicClient, http, getContract, encodeFunctionData, encodePacked } from 'viem'
import { createBundlerClient } from 'viem/account-abstraction'
import { arbitrumSepolia } from 'viem/chains'
import { toKernelSmartAccount } from 'permissionless/accounts'
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
  const client = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
  })
  
  const bundlerClient = createBundlerClient({
    chain: arbitrumSepolia,
    transport: http(ARBITRUM_SEPOLIA_BUNDLER)
  })

  const owner = privateKeyToAccount(privateKey)
  const account = await toKernelSmartAccount(client, {
    owner,
    version: '0.3.1'
  })

  const usdc = getContract({
    client,
    address: ARBITRUM_SEPOLIA_USDC,
    abi: tokenAbi,
  })

  const balance = await usdc.read.balanceOf([account.address])
  if (balance < amount) {
    throw new Error(`Insufficient USDC balance. Have: ${formatUnits(balance, 6)}, Need: ${formatUnits(amount, 6)}`)
  }

  const permitData = await eip2612Permit({
    token: usdc,
    chain: arbitrumSepolia,
    ownerAddress: account.address,
    spenderAddress: ARBITRUM_SEPOLIA_PAYMASTER,
    value: amount
  })

  const permitSignature = await account.signTypedData({
    ...permitData,
    primaryType: 'Permit'
  })

  const calls = [{
    to: ARBITRUM_SEPOLIA_USDC,
    data: encodeFunctionData({
      abi: tokenAbi,
      functionName: 'transfer',
      args: [recipientAddress, amount]
    })
  }]

  const userOpHash = await bundlerClient.sendUserOperation({
    account,
    calls,
    paymaster: {
      address: ARBITRUM_SEPOLIA_PAYMASTER,
      data: encodePacked(
        ['bytes', 'address', 'uint256', 'bytes'],
        ['0x00', ARBITRUM_SEPOLIA_USDC, amount, permitSignature]
      )
    }
  })

  return await bundlerClient.waitForUserOperationReceipt({
    hash: userOpHash
  })
}
