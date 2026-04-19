import { useState } from 'react'
import { Minus, Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface BetPanelProps {
  roundId: string
  gameType: string
  canBet: boolean
  onBetPlaced: () => void
}

const PRESET_AMOUNTS = [10, 50, 100, 500]
const BET_TYPES_WINGO = [
  { type: 'color', value: 'green', label: 'Green', color: 'bg-green-500 hover:bg-green-400', mult: '2x' },
  { type: 'color', value: 'violet', label: 'Violet', color: 'bg-purple-500 hover:bg-purple-400', mult: '4.5x' },
  { type: 'color', value: 'red', label: 'Red', color: 'bg-red-500 hover:bg-red-400', mult: '2x' },
  { type: 'size', value: 'big', label: 'Big (5-9)', color: 'bg-orange-500 hover:bg-orange-400', mult: '2x' },
  { type: 'size', value: 'small', label: 'Small (0-4)', color: 'bg-blue-500 hover:bg-blue-400', mult: '2x' },
]

export default function BetPanel({ roundId, gameType, canBet, onBetPlaced }: BetPanelProps) {
  const { profile, refreshProfile } = useAuth()
  const [amount, setAmount] = useState(10)
  const [selectedBet, setSelectedBet] = useState<{ type: string; value: string; label: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const handleAdjust = (delta: number) => {
    setAmount(prev => Math.max(1, Math.min(prev + delta, profile?.main_balance ?? 0)))
  }

  const placeBet = async () => {
    if (!selectedBet || !profile || !canBet || loading) return
    if (amount > profile.main_balance) {
      setMessage({ text: 'Insufficient balance', ok: false })
      return
    }
    if (amount < 1) {
      setMessage({ text: 'Minimum bet is 1', ok: false })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error: betError } = await supabase.from('bets').insert({
      user_id: profile.id,
      round_id: roundId,
      game_type: gameType,
      bet_type: selectedBet.type,
      bet_value: selectedBet.value,
      amount,
      status: 'pending',
    })

    if (betError) {
      setMessage({ text: betError.message, ok: false })
      setLoading(false)
      return
    }

    const { error: balErr } = await supabase
      .from('profiles')
      .update({ main_balance: profile.main_balance - amount })
      .eq('id', profile.id)

    if (balErr) {
      setMessage({ text: balErr.message, ok: false })
      setLoading(false)
      return
    }

    await supabase.from('transactions').insert({
      user_id: profile.id,
      type: 'bet',
      amount: -amount,
      balance_type: 'main',
      description: `${gameType} bet: ${selectedBet.label}`,
      reference_id: roundId,
    })

    await refreshProfile()
    setMessage({ text: `Bet placed: ${selectedBet.label} for ৳${amount}!`, ok: true })
    setSelectedBet(null)
    setLoading(false)
    onBetPlaced()
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-4">
      <h3 className="font-bold text-white">Place Bet</h3>

      <div className="grid grid-cols-5 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button
            key={n}
            disabled={!canBet}
            onClick={() => setSelectedBet({ type: 'number', value: String(n), label: `Number ${n}` })}
            className={`prediction-btn text-sm font-bold py-3 rounded-xl border transition-all ${
              selectedBet?.value === String(n) && selectedBet.type === 'number'
                ? 'border-neon-purple bg-purple-500/30 text-white'
                : 'border-dark-border bg-dark-100 text-gray-300 hover:border-neon-purple/50'
            } ${!canBet ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {BET_TYPES_WINGO.map(bet => (
          <button
            key={`${bet.type}-${bet.value}`}
            disabled={!canBet}
            onClick={() => setSelectedBet(bet)}
            className={`prediction-btn flex flex-col items-center gap-1 py-3 rounded-xl border text-sm font-bold transition-all ${
              selectedBet?.value === bet.value && selectedBet.type === bet.type
                ? `${bet.color} border-white/30 text-white`
                : `border-dark-border bg-dark-100 text-gray-300 hover:border-white/20`
            } ${!canBet ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span>{bet.label}</span>
            <span className="text-xs opacity-70">{bet.mult}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleAdjust(-10)}
          className="w-10 h-10 rounded-xl bg-dark-100 border border-dark-border flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
        >
          <Minus size={16} />
        </button>

        <div className="flex-1 flex gap-2">
          {PRESET_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                amount === amt
                  ? 'bg-purple-500/30 border-neon-purple text-white'
                  : 'bg-dark-100 border-dark-border text-gray-400 hover:text-white'
              }`}
            >
              {amt}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleAdjust(10)}
          className="w-10 h-10 rounded-xl bg-dark-100 border border-dark-border flex items-center justify-center text-white hover:bg-dark-200 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Amount:</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={profile?.main_balance}
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            className="w-24 bg-dark-100 border border-dark-border rounded-lg px-3 py-1.5 text-white text-right font-mono text-sm"
          />
          <span className="text-gray-400">coins</span>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          message.ok
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          <AlertCircle size={14} />
          {message.text}
        </div>
      )}

      <button
        onClick={placeBet}
        disabled={!selectedBet || !canBet || loading}
        className="gradient-btn w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          selectedBet ? `Bet ${selectedBet.label} — ৳${amount}` : 'Select a bet option'
        )}
      </button>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Balance: ৳{(profile?.main_balance ?? 0).toFixed(2)}</span>
        {selectedBet && <span className="text-green-400">Selected: {selectedBet.label}</span>}
      </div>
    </div>
  )
}
