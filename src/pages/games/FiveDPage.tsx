import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useGameRound } from '../../hooks/useGameRound'
import GameTimer from '../../components/games/GameTimer'
import GameHistory from '../../components/games/GameHistory'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const POSITIONS = ['A', 'B', 'C', 'D', 'E']

export default function FiveDPage() {
  const { profile, refreshProfile } = useAuth()
  const { currentRound, timeLeft, history, phase } = useGameRound({ gameType: '5d', duration: 60 })
  const [amount, setAmount] = useState(10)
  const [selected, setSelected] = useState<{ pos: string; val: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const canBet = phase === 'betting' && timeLeft > 5

  const placeBet = async () => {
    if (!profile || !currentRound || !canBet || !selected || loading) return
    if (amount > profile.main_balance) { setMsg({ text: 'Insufficient balance', ok: false }); return }
    setLoading(true)
    await supabase.from('bets').insert({ user_id: profile.id, round_id: currentRound.id, game_type: '5d', bet_type: `position_${selected.pos}`, bet_value: selected.val, amount, status: 'pending' })
    await supabase.from('profiles').update({ main_balance: profile.main_balance - amount }).eq('id', profile.id)
    await refreshProfile()
    setMsg({ text: 'Bet placed!', ok: true })
    setSelected(null)
    setLoading(false)
  }

  const lastResult = history[0]
  const lastData = lastResult?.result_data as { digits?: number[] } | undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center text-xl">🔢</div>
        <div>
          <h1 className="text-xl font-black text-white">5D Lotre</h1>
          <p className="text-xs text-gray-400">Multi-digit lottery — 1 Minute</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5">
            <Shield size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">Provably Fair</span>
          </div>
        </div>
      </div>

      {lastResult && lastData && (
        <div className="rounded-2xl p-4 bg-dark-card border border-dark-border">
          <p className="text-xs text-gray-400 text-center mb-3">Last Result</p>
          <div className="flex items-center justify-center gap-2">
            {POSITIONS.map((pos, i) => (
              <div key={pos} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-semibold">{pos}</span>
                <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-white font-black text-lg">
                  {(lastData.digits || [])[i] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentRound && (
        <GameTimer timeLeft={timeLeft} duration={60} period={currentRound.period} phase={phase} />
      )}

      {currentRound && phase === 'betting' && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-4">
          <h3 className="font-bold text-white">Select Position & Number</h3>

          {POSITIONS.map(pos => (
            <div key={pos} className="space-y-2">
              <p className="text-sm text-gray-400 font-semibold">Position {pos}</p>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    disabled={!canBet}
                    onClick={() => setSelected({ pos, val: String(i) })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selected?.pos === pos && selected?.val === String(i)
                        ? 'bg-green-500/30 border-green-400 text-white'
                        : 'bg-dark-100 border-dark-border text-gray-400 hover:text-white'
                    } ${!canBet ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          ))}

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

          <button onClick={placeBet} disabled={!selected || loading} className="gradient-btn w-full disabled:opacity-40">
            {loading ? 'Placing...' : selected ? `Bet ${selected.pos}=${selected.val} for ৳${amount}` : 'Select position and number'}
          </button>
        </div>
      )}

      <GameHistory history={history} gameType="5d" />
    </div>
  )
}
