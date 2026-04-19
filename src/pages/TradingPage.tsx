import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, Minus, BarChart2, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import type { TradePosition } from '../types'

const SYMBOLS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', base: 65000, icon: '₿', color: '#f7931a' },
  { symbol: 'ETH/USDT', name: 'Ethereum', base: 3200, icon: 'Ξ', color: '#627eea' },
  { symbol: 'BNB/USDT', name: 'Binance Coin', base: 580, icon: 'B', color: '#f3ba2f' },
  { symbol: 'SOL/USDT', name: 'Solana', base: 170, icon: 'S', color: '#9945ff' },
  { symbol: 'XRP/USDT', name: 'Ripple', base: 0.62, icon: 'X', color: '#346aa9' },
  { symbol: 'EUR/USD', name: 'Euro / Dollar', base: 1.085, icon: '€', color: '#003087' },
]

function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>(() => {
    const init: Record<string, { price: number; change: number }> = {}
    SYMBOLS.forEach(s => { init[s.symbol] = { price: s.base, change: 0 } })
    return init
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev }
        SYMBOLS.forEach(s => {
          const old = prev[s.symbol].price
          const pct = (Math.random() - 0.499) * 0.003
          const newPrice = old * (1 + pct)
          next[s.symbol] = {
            price: newPrice,
            change: ((newPrice - s.base) / s.base) * 100,
          }
        })
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return prices
}

export default function TradingPage() {
  const { profile, refreshProfile } = useAuth()
  const prices = useLivePrices()
  const [positions, setPositions] = useState<TradePosition[]>([])
  const [selected, setSelected] = useState(SYMBOLS[0])
  const [amount, setAmount] = useState(100)
  const [leverage, setLeverage] = useState(1)
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadPositions = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('trade_positions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', tab === 'open' ? 'open' : 'closed')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setPositions(data as TradePosition[])
  }

  useEffect(() => { loadPositions() }, [profile, tab])

  const openTrade = async (type: 'long' | 'short') => {
    if (!profile || loading) return
    if (amount > profile.main_balance) { setMsg('Insufficient balance'); return }
    setLoading(true)
    setMsg('')
    const price = prices[selected.symbol].price

    await supabase.from('trade_positions').insert({
      user_id: profile.id,
      symbol: selected.symbol,
      type,
      entry_price: price,
      current_price: price,
      quantity: (amount * leverage) / price,
      leverage,
      pnl: 0,
      pnl_percent: 0,
      status: 'open',
    })

    await supabase.from('profiles').update({ main_balance: profile.main_balance - amount }).eq('id', profile.id)
    await refreshProfile()
    await loadPositions()
    setMsg(`${type === 'long' ? 'Long' : 'Short'} position opened!`)
    setLoading(false)
  }

  const closeTrade = async (pos: TradePosition) => {
    const currentPrice = prices[pos.symbol]?.price ?? pos.current_price
    const pnl = pos.type === 'long'
      ? (currentPrice - pos.entry_price) * pos.quantity
      : (pos.entry_price - currentPrice) * pos.quantity
    const closingAmount = pos.quantity * pos.entry_price / pos.leverage + pnl

    await supabase.from('trade_positions').update({
      status: 'closed',
      close_price: currentPrice,
      pnl,
      pnl_percent: (pnl / (pos.quantity * pos.entry_price / pos.leverage)) * 100,
      closed_at: new Date().toISOString(),
    }).eq('id', pos.id)

    if (closingAmount > 0 && profile) {
      await supabase.from('profiles').update({
        winning_balance: profile.winning_balance + closingAmount,
      }).eq('id', profile.id)
    }

    await refreshProfile()
    await loadPositions()
  }

  const currentPrice = prices[selected.symbol]?.price ?? selected.base
  const currentChange = prices[selected.symbol]?.change ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <BarChart2 size={20} className="text-blue-400" />
        Trading Simulator
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-x-auto">
        {SYMBOLS.map(s => {
          const p = prices[s.symbol]
          const isPos = p.change >= 0
          return (
            <button
              key={s.symbol}
              onClick={() => setSelected(s)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                selected.symbol === s.symbol
                  ? 'border-neon-purple bg-purple-500/10'
                  : 'border-dark-border bg-dark-card hover:border-dark-300'
              }`}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: s.color + '33', color: s.color }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{s.symbol}</p>
                <p className={`text-xs font-semibold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                  {isPos ? '+' : ''}{p.change.toFixed(2)}%
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl p-4 bg-dark-card border border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">{selected.symbol}</h2>
            <p className="text-sm text-gray-400">{selected.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">${formatCurrency(currentPrice)}</p>
            <p className={`text-sm font-semibold ${currentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(3)}%
            </p>
          </div>
        </div>

        <div className="h-20 flex items-end gap-0.5 mb-4">
          {Array.from({ length: 40 }, (_, i) => {
            const height = 30 + Math.random() * 70
            const isGreen = Math.random() > 0.45
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${isGreen ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Amount (coins)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setAmount(Math.max(1, amount - 10))} className="w-9 h-9 rounded-lg bg-dark-100 border border-dark-border flex items-center justify-center text-white"><Minus size={14} /></button>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
                  className="flex-1 input-field py-2 text-center font-bold"
                />
                <button onClick={() => setAmount(amount + 10)} className="w-9 h-9 rounded-lg bg-dark-100 border border-dark-border flex items-center justify-center text-white"><Plus size={14} /></button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Leverage</label>
              <select value={leverage} onChange={e => setLeverage(Number(e.target.value))} className="input-field py-2 w-24">
                {[1, 2, 5, 10, 25, 50].map(l => <option key={l} value={l}>{l}x</option>)}
              </select>
            </div>
          </div>

          {msg && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl p-2">{msg}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openTrade('long')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              <ChevronUp size={18} />
              Long / Buy
            </button>
            <button
              onClick={() => openTrade('short')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <ChevronDown size={18} />
              Short / Sell
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Balance: ৳{formatCurrency(profile?.main_balance ?? 0)} | Position: ৳{formatCurrency(amount * leverage)}
          </p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-dark-border">
          {(['open', 'closed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${tab === t ? 'text-neon-purple border-b-2 border-neon-purple' : 'text-gray-400'}`}
            >
              {t} Positions
            </button>
          ))}
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart2 size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No {tab} positions</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {positions.map(pos => {
              const live = prices[pos.symbol]?.price ?? pos.current_price
              const pnl = pos.type === 'long'
                ? (live - pos.entry_price) * pos.quantity
                : (pos.entry_price - live) * pos.quantity
              const pnlPct = (pnl / (pos.quantity * pos.entry_price / pos.leverage)) * 100

              return (
                <div key={pos.id} className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    pos.type === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pos.type === 'long' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{pos.symbol}</p>
                    <p className="text-xs text-gray-400">
                      Entry: ${formatCurrency(pos.entry_price)} • {pos.leverage}x
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}
                    </p>
                    <p className={`text-xs ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                    </p>
                  </div>
                  {tab === 'open' && (
                    <button
                      onClick={() => closeTrade(pos)}
                      className="w-8 h-8 rounded-xl bg-dark-100 border border-dark-border flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
