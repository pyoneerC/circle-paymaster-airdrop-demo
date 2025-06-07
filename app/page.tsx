
"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Gift, CheckCircle, Coins } from "lucide-react";
import { createPublicClient, http, formatUnits } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { tokenAbi } from "@/lib/permit-helpers";
import { transferUSDC } from "@/lib/transfer-service";
import { claimAirdrop, checkEligibility } from "@/lib/airdrop-service";
import { toKernelSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";

const ARBITRUM_SEPOLIA_USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

export default function DeFiAirdropClaimer() {
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Transfer states (for the existing functionality)
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!account?.address) return;

      const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(),
      });
      const balance = await client.readContract({
        address: ARBITRUM_SEPOLIA_USDC,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [account.address],
      });
      const formattedBalance = Number(
        formatUnits(balance as bigint, 6),
      ).toFixed(2);
      setUsdcBalance(formattedBalance);
    };

    const checkUserEligibility = async () => {
      if (!account?.address) return;
      
      setCheckingEligibility(true);
      try {
        const eligible = await checkEligibility(account.address);
        setIsEligible(eligible);
        setHasClaimed(!eligible);
      } catch (error) {
        console.error("Error checking eligibility:", error);
        // For demo purposes, make everyone eligible
        setIsEligible(true);
        setHasClaimed(false);
      } finally {
        setCheckingEligibility(false);
      }
    };

    fetchBalance();
    checkUserEligibility();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchBalance();
      checkUserEligibility();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [account?.address]);

  const createAccount = async () => {
    try {
      setLoading(true);
      setStatus("Creating smart account...");
      
      // Create RPC client
      const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(),
      });
      
      // Generate private key and create owner account
      const privateKey = generatePrivateKey();
      const owner = privateKeyToAccount(privateKey);
      
      // Create smart account
      const smartAccount = await toKernelSmartAccount({
        client: client,
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
        owners: [owner],
        version: "0.3.1",
      });

      setAccount({
        address: smartAccount.address,
        owner: owner.address,
        privateKey: `0x${privateKey.slice(2)}`,
      });
      setStatus("Smart account created successfully!");
    } catch (error) {
      setStatus("Error creating smart account: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAirdrop = async () => {
    try {
      setLoading(true);
      setStatus("Checking USDC balance for gas fees...");

      // Check USDC balance first
      const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(),
      });
      
      const balance = (await client.readContract({
        address: ARBITRUM_SEPOLIA_USDC,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint;

      const gasBuffer = BigInt(2_000_000); // 2 USDC for gas
      
      if (balance < gasBuffer) {
        throw new Error(
          `Insufficient USDC balance for gas fees. Need at least 2 USDC for gas, have: ${formatUnits(balance, 6)} USDC. Please get USDC from the faucet first.`
        );
      }

      setStatus("Claiming your airdrop...");
      
      const receipt = await claimAirdrop(account.privateKey);
      
      if (receipt.success) {
        setStatus("🎉 Airdrop claimed successfully! You received 1,000 BTY tokens!");
        setHasClaimed(true);
        setIsEligible(false);
      } else {
        setStatus("Claim failed. Please try again.");
      }
    } catch (error: any) {
      if (error.message.includes("Already claimed")) {
        setStatus("You have already claimed your airdrop!");
        setHasClaimed(true);
        setIsEligible(false);
      } else {
        setStatus("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const transfer = async () => {
    try {
      setLoading(true);
      setStatus("Checking balance...");
      
      // Create client for balance check
      const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(),
      });
      
      // Check balance before transfer
      const balance = (await client.readContract({
        address: ARBITRUM_SEPOLIA_USDC,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint;

      // Convert input amount to USDC decimals (6 decimals)
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1_000_000));
      
      // Required gas buffer (2 USDC to be safe)
      const gasBuffer = BigInt(2_000_000); // 2 USDC in wei
      const totalNeeded = amountInWei + gasBuffer;

      // Check if balance is sufficient including gas buffer
      if (balance < totalNeeded) {
        const currentBalance = Number(formatUnits(balance, 6));
        const requestedAmount = Number(amount);
        const availableForTransfer = Math.max(0, currentBalance - 2); // Leave 2 USDC for gas
        throw new Error(
          `Insufficient balance for this transfer. ` +
            `\nCurrent balance: ${currentBalance} USDC` +
            `\nRequested transfer: ${requestedAmount} USDC` +
            `\nGas buffer needed: 2 USDC` +
            `\nMaximum you can transfer: ${availableForTransfer.toFixed(2)} USDC` +
            `\n\nPlease reduce your transfer amount or get more USDC from the faucet.`,
        );
      }

      setStatus("Initiating transfer...");
      const receipt = await transferUSDC(
        account.privateKey,
        recipientAddress,
        amountInWei,
      );

      if (receipt.success) {
        setStatus("Transfer completed successfully!");
        setRecipientAddress("");
        setAmount("");
      } else {
        setStatus("Transfer failed. Please try again.");
      }
    } catch (error: any) {
      if (error.message.includes("0x65c8fd4d")) {
        setStatus(
          "Error: Insufficient USDC balance for transfer and gas fees (need ~2 USDC for gas)",
        );
      } else {
        setStatus(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {account && (
        <div className="fixed top-4 right-4 bg-black/20 backdrop-blur-md rounded-lg border border-purple-500/20 shadow-lg p-3">
          <span className="text-sm font-medium text-white">USDC Balance: </span>
          <span className="font-mono text-green-400">${usdcBalance}</span>
        </div>
      )}
      
      <div className="container max-w-4xl mx-auto p-4 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎁 DeFi Protocol Airdrop
          </h1>
          <p className="text-gray-300 text-lg">
            Claim your free tokens with gas paid in USDC
          </p>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Smart Wallet & Airdrop Claimer</CardTitle>
            <CardDescription className="text-gray-300">
              Create your smart account and claim your airdrop using Circle Paymaster
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="airdrop" className="space-y-4">
              <TabsList className="bg-black/20 border-purple-500/20">
                <TabsTrigger value="airdrop" className="data-[state=active]:bg-purple-600">
                  <Gift className="w-4 h-4 mr-2" />
                  Airdrop
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-purple-600">
                  Account
                </TabsTrigger>
                <TabsTrigger value="transfer" disabled={!account} className="data-[state=active]:bg-purple-600">
                  <Coins className="w-4 h-4 mr-2" />
                  Transfer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="airdrop" className="space-y-6">
                {!account ? (
                  <div className="text-center space-y-4">
                    <div className="p-8 border-2 border-dashed border-purple-500/30 rounded-lg">
                      <Gift className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Connect Your Wallet First
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Create a smart wallet to check your airdrop eligibility
                      </p>
                      <Button
                        onClick={createAccount}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Smart Wallet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {checkingEligibility ? (
                      <div className="text-center p-8">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-400 mb-4" />
                        <p className="text-gray-300">Checking eligibility...</p>
                      </div>
                    ) : isEligible ? (
                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
                        <div className="flex items-center mb-4">
                          <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              🎉 Congratulations!
                            </h3>
                            <p className="text-gray-300">
                              You are eligible to claim 1,000 BTY tokens!
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-lg p-4 mb-4">
                          <h4 className="text-white font-medium mb-2">Airdrop Details:</h4>
                          <ul className="text-gray-300 space-y-1">
                            <li>• Token: Bounty Token (BTY)</li>
                            <li>• Amount: 1,000 BTY</li>
                            <li>• Gas fees paid with USDC</li>
                            <li>• Network: Arbitrum Sepolia</li>
                          </ul>
                        </div>

                        <Button
                          onClick={handleClaimAirdrop}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          🎁 Claim Airdrop (Gas Paid in USDC)
                        </Button>
                      </div>
                    ) : hasClaimed ? (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Already Claimed!
                        </h3>
                        <p className="text-gray-300">
                          You have already claimed your 1,000 BTY tokens.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Not Eligible
                        </h3>
                        <p className="text-gray-300">
                          Your wallet is not eligible for this airdrop.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                {!account ? (
                  <Button
                    onClick={createAccount}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Smart Account
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Smart Wallet Address</Label>
                      <Alert className="bg-black/20 border-purple-500/20">
                        <AlertDescription className="font-mono break-all text-gray-300">
                          {account.address}
                        </AlertDescription>
                      </Alert>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Owner Address</Label>
                      <Alert className="bg-black/20 border-purple-500/20">
                        <AlertDescription className="font-mono break-all text-gray-300">
                          {account.owner}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transfer" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-white">Recipient Address</Label>
                    <input
                      id="recipient"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-purple-500/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">Amount (USDC)</Label>
                    <input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-black/20 border border-purple-500/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <Button
                    onClick={transfer}
                    disabled={loading || !recipientAddress || !amount}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Transfer USDC
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {status && (
              <Alert className="mt-4 bg-black/20 border-purple-500/20">
                <AlertDescription className="text-gray-300">{status}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
