import { Shield } from 'lucide-react'
import { useGameRound } from '../../hooks/useGameRound'
import GameTimer from '../../components/games/GameTimer'
import GameHistory from '../../components/games/GameHistory'
import BetPanel from '../../components/games/BetPanel'
import { useState } from 'react'

export default function TrxWinPage() {
  const { currentRound, timeLeft, history, phase } = useGameRound({ gameType: 'trx', duration: 60 })
  const [_betKey, setBetKey] = useState(0)

  const canBet = phase === 'betting' && timeLeft > 5

  const lastResult = history[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-xl">⛓️</div>
        <div>
          <h1 className="text-xl font-black text-white">TRX Win</h1>
          <p className="text-xs text-gray-400">Blockchain-based game — 1 Minute</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5">
            <Shield size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">Provably Fair</span>
          </div>
        </div>
      </div>

      {lastResult && (
        <div className="rounded-2xl p-4 text-center bg-dark-card border border-dark-border">
          <p className="text-xs text-gray-400 mb-2">Last TRX Block Result</p>
          <div className="flex items-center justify-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg ${
              lastResult.result >= 5 ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {lastResult.result}
            </div>
            <div className="text-left">
              <p className={`font-bold text-lg ${lastResult.result >= 5 ? 'text-red-400' : 'text-green-400'}`}>
                {lastResult.result >= 5 ? 'Big' : 'Small'}
              </p>
              <p className="text-gray-400 text-sm font-mono text-xs">Period: {lastResult.period.slice(-6)}</p>
            </div>
          </div>
        </div>
      )}

      {currentRound && (
        <GameTimer timeLeft={timeLeft} duration={60} period={currentRound.period} phase={phase} />
      )}

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">TRX Hash Verification</h3>
        <p className="text-xs text-gray-500 mb-2">
          Results are derived from live TRX blockchain block hashes for maximum transparency.
        </p>
        {currentRound && (
          <div className="bg-dark-100 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Server Seed Hash (pre-committed):</p>
            <p className="text-xs font-mono text-gray-300 break-all">{currentRound.server_seed_hash}</p>
          </div>
        )}
      </div>

      {currentRound && phase === 'betting' && (
        <BetPanel
          roundId={currentRound.id}
          gameType="trx"
          canBet={canBet}
          onBetPlaced={() => setBetKey(k => k + 1)}
        />
      )}

      <GameHistory history={history} gameType="trx" />
    </div>
  )
}
