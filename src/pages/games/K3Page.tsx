import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useGameRound } from '../../hooks/useGameRound'
import GameTimer from '../../components/games/GameTimer'
import GameHistory from '../../components/games/GameHistory'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const BET_OPTIONS = [
  { type: 'sum_range', value: 'small', label: 'Small (3-9)', color: 'bg-blue-500', mult: '2x' },
  { type: 'sum_range', value: 'big', label: 'Big (10-18)', color: 'bg-red-500', mult: '2x' },
  { type: 'parity', value: 'odd', label: 'Odd', color: 'bg-orange-500', mult: '2x' },
  { type: 'parity', value: 'even', label: 'Even', color: 'bg-green-500', mult: '2x' },
]

export default function K3Page() {
  const { profile, refreshProfile } = useAuth()
  const { currentRound, timeLeft, history, phase } = useGameRound({ gameType: 'k3', duration: 60 })
  const [amount, setAmount] = useState(10)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const canBet = phase === 'betting' && timeLeft > 5

  const placeBet = async (betType: string, betValue: string) => {
    if (!profile || !currentRound || !canBet || loading) return
    if (amount > profile.main_balance) { setMsg({ text: 'Insufficient balance', ok: false }); return }
    setLoading(true)
    setMsg(null)
    await supabase.from('bets').insert({ user_id: profile.id, round_id: currentRound.id, game_type: 'k3', bet_type: betType, bet_value: betValue, amount, status: 'pending' })
    await supabase.from('profiles').update({ main_balance: profile.main_balance - amount }).eq('id', profile.id)
    await refreshProfile()
    setMsg({ text: `Bet placed!`, ok: true })
    setSelected(null)
    setLoading(false)
  }

  const lastResult = history[0]
  const lastData = lastResult?.result_data as { dice?: number[]; sum?: number } | undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xl">🎲</div>
        <div>
          <h1 className="text-xl font-black text-white">K3 Lotre</h1>
          <p className="text-xs text-gray-400">Dice sum prediction — 1 Minute</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5">
            <Shield size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">Provably Fair</span>
          </div>
        </div>
      </div>

      {lastResult && lastData && (
        <div className="rounded-2xl p-4 text-center bg-dark-card border border-dark-border">
          <p className="text-xs text-gray-400 mb-3">Last Result</p>
          <div className="flex items-center justify-center gap-4">
            <div className="flex gap-2">
              {(lastData.dice || [1, 1, 1]).map((d, i) => (
                <div key={i} className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-white text-xl font-black">
                  {d}
                </div>
              ))}
            </div>
            <div>
              <p className="text-3xl font-black text-white">{lastData.sum || lastResult.result}</p>
              <p className="text-sm text-gray-400">{(lastData.sum || lastResult.result) >= 10 ? 'Big' : 'Small'}</p>
            </div>
          </div>
        </div>
      )}

      {currentRound && (
        <GameTimer timeLeft={timeLeft} duration={60} period={currentRound.period} phase={phase} />
      )}

      {currentRound && phase === 'betting' && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white">Place Bet</h3>
          <div className="grid grid-cols-2 gap-3">
            {BET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                disabled={!canBet}
                onClick={() => setSelected(opt.value)}
                className={`prediction-btn py-4 rounded-2xl font-bold transition-all ${opt.color} ${
                  selected === opt.value ? 'ring-2 ring-white scale-95' : 'opacity-80 hover:opacity-100'
                } ${!canBet ? 'opacity-30 cursor-not-allowed' : ''} text-white`}
              >
                <p className="text-base">{opt.label}</p>
                <p className="text-xs opacity-75 mt-0.5">{opt.mult}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-14 gap-1">
            {Array.from({ length: 16 }, (_, i) => i + 3).map(n => (
              <button
                key={n}
                disabled={!canBet}
                onClick={() => setSelected(`sum_${n}`)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selected === `sum_${n}`
                    ? 'bg-purple-500/30 border-neon-purple text-white'
                    : 'bg-dark-100 border-dark-border text-gray-400 hover:text-white'
                } ${!canBet ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {[10, 50, 100, 500].map(a => (
              <button key={a} onClick={() => setAmount(a)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${amount === a ? 'bg-purple-500/30 border-neon-purple text-white' : 'bg-dark-100 border-dark-border text-gray-400'}`}>{a}</button>
            ))}
          </div>

          {msg && (
            <div className={`p-3 rounded-xl text-sm ${msg.ok ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
              {msg.text}
            </div>
          )}

          <button
            onClick={() => {
              if (selected) {
                const parts = selected.split('_')
                placeBet(parts.length > 1 ? (parts[0] === 'sum' ? 'exact_sum' : parts[0]) : 'sum_range', selected)
              }
            }}
            disabled={!selected || loading}
            className="gradient-btn w-full disabled:opacity-40"
          >
            {loading ? 'Placing...' : selected ? `Bet ৳${amount}` : 'Select a bet'}
          </button>
        </div>
      )}

      <GameHistory history={history} gameType="k3" />
    </div>
  )
}
