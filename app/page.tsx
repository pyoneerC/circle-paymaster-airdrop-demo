'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkEligibility, claimAirdrop } from '@/lib/airdrop-service'
import { Wallet, Gift, Zap, Circle, CheckCircle, Loader2, Sparkles } from 'lucide-react'

export default function AirdropClaimer() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [isEligible, setIsEligible] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Mock wallet connection for demo
  const connectWallet = async () => {
    setIsLoading(true)
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    const mockAddress = '0x9c1b82160da6fb204cccb726ef6874b5d495e1a7'
    setWalletAddress(mockAddress)
    setIsLoading(false)

    // Auto-check eligibility after connection
    setTimeout(() => checkUserEligibility(mockAddress), 500)
  }

  const checkUserEligibility = async (address?: string) => {
    const addressToCheck = address || walletAddress
    if (!addressToCheck) return

    try {
      setIsLoading(true)
      // Simulate eligibility check
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsEligible(true)
    } catch (error) {
      console.error('Error checking eligibility:', error)
      setIsEligible(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!walletAddress) return

    setIsClaiming(true)
    setErrorMessage('')

    try {
      // Simulate claim process
      await new Promise(resolve => setTimeout(resolve, 3000))
      setClaimStatus('success')
    } catch (error) {
      console.error('Error claiming airdrop:', error)
      setClaimStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to claim airdrop')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-xl">
              <Circle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Circle <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">Airdrop</span>
            </h1>
          </div>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Claim your free TEST tokens with gas fees paid in USDC. No ETH required!
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-white/60">
            <Zap className="w-4 h-4" />
            <span className="text-sm">Powered by Circle Paymaster</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-2">Token Airdrop</CardTitle>
              <CardDescription className="text-white/70">
                Connect your wallet to check eligibility and claim your tokens
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {!walletAddress ? (
                <div className="text-center">
                  <Button 
                    onClick={connectWallet}
                    disabled={isLoading}
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6 h-auto font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Wallet Connected */}
                  <Alert className="bg-green-500/20 border-green-400/30 text-white">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription>
                      Wallet connected: <span className="font-mono text-sm">{walletAddress}</span>
                    </AlertDescription>
                  </Alert>

                  {/* Eligibility Status */}
                  {isEligible === true && (
                    <div className="text-center space-y-4">
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 p-6">
                        <div className="absolute inset-0 shimmer"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                            <span className="text-2xl font-bold text-white">🎉 You're Eligible!</span>
                            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                          </div>
                          <p className="text-white/90 text-lg mb-4">
                            You can claim <span className="font-bold text-yellow-300">1,000 TEST tokens</span>
                          </p>
                          <div className="bg-white/10 rounded-lg p-3 inline-block">
                            <p className="text-sm text-white/80">
                              💡 Gas fees will be automatically paid from your USDC balance
                            </p>
                          </div>
                        </div>
                      </div>

                      {claimStatus === 'idle' && (
                        <Button 
                          onClick={handleClaim}
                          disabled={isClaiming}
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg py-6 h-auto font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Claiming Airdrop... (Gas Paid in USDC)
                            </>
                          ) : (
                            <>
                              <Gift className="w-5 h-5 mr-2" />
                              Claim Airdrop (Gas Paid in USDC)
                            </>
                          )}
                        </Button>
                      )}

                      {claimStatus === 'success' && (
                        <Alert className="bg-green-500/20 border-green-400/30 text-white">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-lg">
                            🎉 Congratulations! You've successfully claimed 1,000 TEST tokens!
                          </AlertDescription>
                        </Alert>
                      )}

                      {claimStatus === 'error' && (
                        <Alert className="bg-red-500/20 border-red-400/30 text-white">
                          <AlertDescription>
                            ❌ {errorMessage || 'Failed to claim airdrop. Please try again.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="font-semibold text-white">No ETH Required</h3>
                    <p className="text-sm text-white/70">Pay gas with USDC</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-300" />
                    </div>
                    <h3 className="font-semibold text-white">Instant Claim</h3>
                    <p className="text-sm text-white/70">One-click claiming</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Circle className="w-5 h-5 text-purple-300" />
                    </div>
                    <h3 className="font-semibold text-white">Circle Powered</h3>
                    <p className="text-sm text-white/70">Trusted infrastructure</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}