import { Link } from 'react-router-dom'
import { Gamepad2, Clock, Trophy, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'
import type { Bet } from '../types'

const ALL_GAMES = [
  { name: 'Win Go', to: '/games/wingo', icon: '🎯', color: 'from-purple-600 to-pink-600', desc: 'Color prediction', badge: 'HOT' },
  { name: 'K3 Lotre', to: '/games/k3', icon: '🎲', color: 'from-blue-600 to-cyan-600', desc: 'Dice sum', badge: '' },
  { name: '5D Lotre', to: '/games/5d', icon: '🔢', color: 'from-green-600 to-teal-600', desc: 'Multi-digit', badge: '' },
  { name: 'TRX Win', to: '/games/trx', icon: '⛓️', color: 'from-orange-600 to-red-600', desc: 'Blockchain', badge: 'NEW' },
]

export default function ActivityPage() {
  const { user, profile } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('bets')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setBets(data as Bet[]) })
  }, [profile])

  const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + b.win_amount, 0)
  const totalLost = bets.filter(b => b.status === 'lost').reduce((s, b) => s + b.amount, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Zap size={20} className="text-neon-purple" />
        Activity
      </h1>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">All Lottery Games</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ALL_GAMES.map(g => (
            <Link
              key={g.to}
              to={user ? g.to : '/login'}
              className="game-card group"
            >
              <div className={`h-24 bg-gradient-to-br ${g.color} flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <span className="text-4xl relative z-10">{g.icon}</span>
                {g.badge && (
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white font-bold ${
                    g.badge === 'HOT' ? 'bg-red-500' : 'bg-green-500'
                  }`}>{g.badge}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white text-sm">{g.name}</h3>
                <p className="text-xs text-gray-400">{g.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {profile && (
        <section>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="stat-card text-center">
              <Gamepad2 size={16} className="text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{bets.length}</p>
              <p className="text-xs text-gray-400">Total Bets</p>
            </div>
            <div className="stat-card text-center">
              <Trophy size={16} className="text-green-400 mx-auto mb-1" />
              <p className="text-lg font-black text-green-400">৳{totalWon.toFixed(0)}</p>
              <p className="text-xs text-gray-400">Won</p>
            </div>
            <div className="stat-card text-center">
              <TrendingUp size={16} className="text-red-400 mx-auto mb-1" />
              <p className="text-lg font-black text-red-400">৳{totalLost.toFixed(0)}</p>
              <p className="text-xs text-gray-400">Lost</p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-neon-purple" />
                Bet History
              </h3>
            </div>
            {bets.length === 0 ? (
              <div className="p-8 text-center">
                <Gamepad2 size={32} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No bets yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {bets.map(bet => (
                  <div key={bet.id} className="flex items-center gap-3 p-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                      bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {bet.game_type === 'wingo' ? '🎯' : bet.game_type === 'k3' ? '🎲' : bet.game_type === '5d' ? '🔢' : '⛓️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium capitalize">{bet.game_type} — {bet.bet_value}</p>
                      <p className="text-xs text-gray-500">{timeAgo(bet.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">৳{bet.amount}</p>
                      {bet.status === 'won' && <p className="text-xs text-green-400 font-bold">+৳{bet.win_amount.toFixed(1)}</p>}
                      {bet.status === 'lost' && <p className="text-xs text-red-400">-৳{bet.amount}</p>}
                      {bet.status === 'pending' && <span className="badge badge-purple text-xs">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
