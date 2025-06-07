
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkEligibility, claimAirdrop } from '@/lib/airdrop-service'
import { Wallet, Gift, Zap, Circle, CheckCircle, Loader2, Sparkles, DollarSign, RefreshCw, TrendingUp, Trophy, Star } from 'lucide-react'

export default function AirdropClaimer() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00')
  const [isEligible, setIsEligible] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [claimedAmount, setClaimedAmount] = useState(0)

  // Mock wallet connection for demo
  const connectWallet = async () => {
    setIsLoading(true)
    // Simulate wallet connection delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    const mockAddress = '0x9c1b82160da6fb204cccb726ef6874b5d495e1a7'
    setWalletAddress(mockAddress)
    
    // Mock USDC balance (random between 5-50 USDC)
    const mockBalance = (Math.random() * 45 + 5).toFixed(2)
    setUsdcBalance(mockBalance)
    
    setIsLoading(false)

    // Auto-check eligibility after connection
    setTimeout(() => checkUserEligibility(mockAddress), 500)
  }

  const refreshBalance = async () => {
    if (!walletAddress) return
    
    setIsRefreshingBalance(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate balance update
    const newBalance = (Math.random() * 45 + 5).toFixed(2)
    setUsdcBalance(newBalance)
    setIsRefreshingBalance(false)
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
      // Simulate claim process with gas fee deduction
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate gas fee deduction (0.50-2.00 USDC)
      const gasFee = (Math.random() * 1.5 + 0.5).toFixed(2)
      const newBalance = (parseFloat(usdcBalance) - parseFloat(gasFee)).toFixed(2)
      setUsdcBalance(newBalance)
      setClaimedAmount(1000)
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
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-bounce delay-200"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-white/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-white/25 rounded-full animate-bounce delay-300"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-xl animate-pulse">
              <Circle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Circle <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent animate-pulse">Airdrop</span>
            </h1>
            {claimStatus === 'success' && (
              <div className="animate-bounce">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            )}
          </div>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Claim your free TEST tokens with gas fees paid in USDC. No ETH required!
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-white/60">
            <Zap className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Powered by Circle Paymaster • Demo Mode</span>
          </div>
        </div>

        {/* Balance Card - Show when wallet is connected */}
        {walletAddress && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="glass-card border-white/20 shadow-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/20">
                      <DollarSign className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">USDC Balance</h3>
                      <p className="text-3xl font-bold text-green-300">${usdcBalance}</p>
                      <p className="text-sm text-white/60">Available for gas fees</p>
                    </div>
                  </div>
                  <Button
                    onClick={refreshBalance}
                    disabled={isRefreshingBalance}
                    variant="outline"
                    size="sm"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {parseFloat(usdcBalance) < 2 && (
                  <Alert className="mt-4 bg-yellow-500/20 border-yellow-400/30 text-white">
                    <AlertDescription className="flex items-center gap-2">
                      ⚠️ Low balance! You might need more USDC for gas fees.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
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
                    className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6 h-auto font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                            You can claim <span className="font-bold text-yellow-300 animate-pulse">1,000 TEST tokens</span>
                          </p>
                          
                          {/* Estimated Gas Fee */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-blue-300" />
                                <span className="text-sm text-white/80">Reward Value</span>
                              </div>
                              <p className="text-lg font-bold text-blue-300">~$25.00</p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-yellow-300" />
                                <span className="text-sm text-white/80">Est. Gas Fee</span>
                              </div>
                              <p className="text-lg font-bold text-yellow-300">~$1.50</p>
                            </div>
                          </div>
                          
                          <div className="bg-white/10 rounded-lg p-3 inline-block">
                            <p className="text-sm text-white/80">
                              💡 Gas fees will be automatically deducted from your USDC balance
                            </p>
                          </div>
                        </div>
                      </div>

                      {claimStatus === 'idle' && (
                        <Button 
                          onClick={handleClaim}
                          disabled={isClaiming || parseFloat(usdcBalance) < 1}
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg py-6 h-auto font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Claiming Airdrop... (Gas Paid in USDC)
                            </>
                          ) : parseFloat(usdcBalance) < 1 ? (
                            <>
                              <DollarSign className="w-5 h-5 mr-2" />
                              Insufficient USDC for Gas
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
                        <div className="space-y-4 celebration">
                          <Alert className="bg-green-500/20 border-green-400/30 text-white">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <AlertDescription className="text-lg">
                              🎉 Congratulations! You've successfully claimed {claimedAmount.toLocaleString()} TEST tokens!
                            </AlertDescription>
                          </Alert>
                          
                          {/* Success stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-500/20 rounded-lg p-4 text-center">
                              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                              <p className="text-sm text-white/80">Tokens Received</p>
                              <p className="text-xl font-bold text-green-300">{claimedAmount.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                              <Zap className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                              <p className="text-sm text-white/80">Gas Saved</p>
                              <p className="text-xl font-bold text-blue-300">100%</p>
                            </div>
                          </div>
                        </div>
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

              {/* Enhanced Features */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2 group hover:transform hover:scale-105 transition-all duration-300">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30">
                      <Zap className="w-5 h-5 text-blue-300" />
                    </div>
                    <h3 className="font-semibold text-white">No ETH Required</h3>
                    <p className="text-sm text-white/70">Pay gas with USDC</p>
                  </div>
                  <div className="space-y-2 group hover:transform hover:scale-105 transition-all duration-300">
                    <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30">
                      <CheckCircle className="w-5 h-5 text-green-300" />
                    </div>
                    <h3 className="font-semibold text-white">Instant Claim</h3>
                    <p className="text-sm text-white/70">One-click claiming</p>
                  </div>
                  <div className="space-y-2 group hover:transform hover:scale-105 transition-all duration-300">
                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30">
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

        {/* Stats Footer */}
        {walletAddress && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <div className="glass-card border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Account Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-blue-300">${usdcBalance}</p>
                  <p className="text-sm text-white/70">USDC Balance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-300">{claimedAmount.toLocaleString()}</p>
                  <p className="text-sm text-white/70">TEST Tokens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-300">✓</p>
                  <p className="text-sm text-white/70">Eligible</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-white/60">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Circle Airdrop Demo. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            This is a demo application. Actual token distribution and eligibility may vary.
          </p>
          <p className="text-xs mt-1">
            Source code available on <a href="https://github.com/pyoneerC/circle-paymaster-airdrop-demo" className="text-blue-400 hover:underline">GitHub</a>.
          </p>
        </footer>
      </div>
    </div>
  )
}
