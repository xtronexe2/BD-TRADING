import { useState, useEffect } from 'react'
import { Shield, Trophy } from 'lucide-react'
import { useGameRound } from '../../hooks/useGameRound'
import GameTimer from '../../components/games/GameTimer'
import BetPanel from '../../components/games/BetPanel'
import GameHistory from '../../components/games/GameHistory'
import { getWingoColorDisplay, isWingoBig } from '../../lib/fairness'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Bet } from '../../types'

export default function WingoPage() {
  const { profile } = useAuth()
  const { currentRound, timeLeft, history, phase } = useGameRound({ gameType: 'wingo', duration: 60 })
  const [myBets, setMyBets] = useState<Bet[]>([])
  const [betKey, setBetKey] = useState(0)

  useEffect(() => {
    if (!profile || !currentRound) return
    supabase
      .from('bets')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setMyBets(data as Bet[]) })
  }, [profile, currentRound, betKey])

  const canBet = phase === 'betting' && timeLeft > 5

  const lastResult = history[0]
  const lastColor = lastResult ? getWingoColorDisplay(lastResult.result) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl">
          🎯
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Win Go</h1>
          <p className="text-xs text-gray-400">Color prediction — 1 Minute</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5">
            <Shield size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">Provably Fair</span>
          </div>
        </div>
      </div>

      {lastResult && lastColor && (
        <div className="rounded-2xl p-4 text-center relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${
            lastColor.color === 'green' ? '#052e16, #14532d' :
            lastColor.color === 'red' ? '#2d0a0a, #450a0a' :
            '#1a0a2e, #2d1b4e'
          })`
        }}>
          <p className="text-xs text-gray-400 mb-1">Last Result</p>
          <div className="flex items-center justify-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg ${
              lastColor.color === 'green' ? 'bg-green-500' :
              lastColor.color === 'red' ? 'bg-red-500' :
              'bg-purple-500'
            }`}>
              {lastResult.result}
            </div>
            <div className="text-left">
              <p className={`font-bold text-lg ${
                lastColor.color === 'green' ? 'text-green-400' :
                lastColor.color === 'red' ? 'text-red-400' :
                'text-purple-400'
              }`}>{lastColor.label}</p>
              <p className="text-gray-400 text-sm">{isWingoBig(lastResult.result) ? 'Big' : 'Small'}</p>
            </div>
          </div>
        </div>
      )}

      {currentRound && (
        <GameTimer
          timeLeft={timeLeft}
          duration={60}
          period={currentRound.period}
          phase={phase}
        />
      )}

      {phase === 'result' && lastResult && lastColor && (
        <div className="rounded-2xl p-6 text-center bg-dark-card border border-neon-purple/30 animate-fade-in">
          <p className="text-neon-purple font-bold text-lg mb-2">Round Complete!</p>
          <p className="text-gray-400 text-sm">Check your wins below</p>
        </div>
      )}

      {currentRound && phase === 'betting' && (
        <BetPanel
          roundId={currentRound.id}
          gameType="wingo"
          canBet={canBet}
          onBetPlaced={() => setBetKey(k => k + 1)}
        />
      )}

      {myBets.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-yellow-400" />
            <h3 className="font-bold text-white">My Bets</h3>
          </div>
          <div className="space-y-2">
            {myBets.map(bet => (
              <div key={bet.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-100">
                <div>
                  <p className="text-sm text-white font-semibold capitalize">{bet.bet_value}</p>
                  <p className="text-xs text-gray-400">₹{bet.amount}</p>
                </div>
                <div className="text-right">
                  {bet.status === 'pending' && (
                    <span className="badge badge-purple">Pending</span>
                  )}
                  {bet.status === 'won' && (
                    <div>
                      <span className="badge badge-green">Won</span>
                      <p className="text-xs text-green-400 font-bold mt-1">+৳{bet.win_amount.toFixed(2)}</p>
                    </div>
                  )}
                  {bet.status === 'lost' && (
                    <span className="badge badge-red">Lost</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GameHistory history={history} gameType="wingo" />

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Shield size={16} className="text-green-400" />
          How Fairness Works
        </h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>1. Server seed is hashed before the round starts</p>
          <p>2. Client seed is combined with server seed</p>
          <p>3. Result is generated using HMAC-SHA256</p>
          <p>4. Server seed is revealed after round ends for verification</p>
        </div>
        {history[0] && (
          <div className="mt-3 p-3 bg-dark-100 rounded-xl">
            <p className="text-xs text-gray-500 font-mono break-all">
              Last hash: {history[0].server_seed_hash?.slice(0, 32)}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
