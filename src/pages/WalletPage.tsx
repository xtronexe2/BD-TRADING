import { useState, useEffect } from 'react'
import { Wallet, Gift, ArrowUpRight, ArrowDownLeft, Clock, Trophy, Coins } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency, timeAgo } from '../lib/utils'
import type { Transaction } from '../types'

export default function WalletPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'bet' | 'win' | 'bonus'>('all')

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTransactions(data as Transaction[])
        setLoading(false)
      })
  }, [profile])

  const total = (profile?.main_balance ?? 0) + (profile?.winning_balance ?? 0) + (profile?.bonus_balance ?? 0)

  const filtered = tab === 'all' ? transactions : transactions.filter(t => t.type === tab || t.balance_type === tab)

  const typeIcon = (type: string) => {
    if (type === 'bet') return <ArrowUpRight size={14} className="text-red-400" />
    if (type === 'win') return <ArrowDownLeft size={14} className="text-green-400" />
    if (type === 'bonus' || type === 'referral') return <Gift size={14} className="text-yellow-400" />
    return <Clock size={14} className="text-gray-400" />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Wallet size={20} className="text-neon-purple" />
        My Wallet
      </h1>

      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <p className="text-gray-400 text-sm mb-1">Total Balance</p>
        <p className="text-4xl font-black text-white mb-4">৳{formatCurrency(total)}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Coins size={16} className="text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Main</p>
            <p className="font-bold text-white text-sm">৳{formatCurrency(profile?.main_balance ?? 0)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Trophy size={16} className="text-green-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Winning</p>
            <p className="font-bold text-green-400 text-sm">৳{formatCurrency(profile?.winning_balance ?? 0)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Gift size={16} className="text-yellow-400 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Bonus</p>
            <p className="font-bold text-yellow-400 text-sm">৳{formatCurrency(profile?.bonus_balance ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-400 mb-1">Total Wagered</p>
          <p className="text-xl font-black text-white">৳{formatCurrency(profile?.total_wagered ?? 0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400 mb-1">Total Wins</p>
          <p className="text-xl font-black text-green-400">{profile?.total_wins ?? 0}</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
        <h3 className="font-bold text-white mb-1">Wallet Rules</h3>
        <div className="space-y-1 text-sm text-gray-400">
          <p>• <span className="text-blue-400">Main Balance</span>: Used for placing bets</p>
          <p>• <span className="text-green-400">Winning Balance</span>: Received from game wins</p>
          <p>• <span className="text-yellow-400">Bonus Balance</span>: From referrals (play-only)</p>
          <p>• This is a virtual platform — no real money</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border flex gap-2">
          {(['all', 'bet', 'win', 'bonus'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'tab-active' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {filtered.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-dark-100/50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {typeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                  <p className="text-xs text-gray-500">{timeAgo(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}৳{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.balance_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
