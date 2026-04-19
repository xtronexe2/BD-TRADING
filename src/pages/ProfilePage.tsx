import { useState, useEffect } from 'react'
import { Shield, Trophy, Gamepad2, TrendingUp, Gift, FileEdit as Edit2, LogOut, ChevronRight, Star, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatCurrency, timeAgo } from '../lib/utils'
import type { Bet } from '../types'

export default function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [recentBets, setRecentBets] = useState<Bet[]>([])
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    supabase
      .from('bets')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setRecentBets(data as Bet[]) })
  }, [profile])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const saveProfile = async () => {
    if (!profile || !username.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ username }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setEditing(false)
  }

  const winRate = profile && profile.total_bets > 0
    ? ((profile.total_wins / profile.total_bets) * 100).toFixed(1)
    : '0.0'

  const level = profile?.level ?? 1
  const levelProgress = ((profile?.total_wagered ?? 0) % 1000) / 10

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-purple-gradient flex items-center justify-center text-white font-black text-xl shadow-neon-purple">
            {profile?.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  className="input-field py-1.5 text-base font-bold"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <button onClick={saveProfile} disabled={saving} className="px-3 py-1.5 bg-purple-gradient rounded-lg text-white text-sm font-semibold">
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-white">{profile?.username}</h2>
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-white">
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <p className="text-gray-400 text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-purple">Level {level}</span>
              {profile?.is_admin && <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Admin</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Level {level}</span>
            <span>{levelProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="h-2 rounded-full bg-purple-gradient" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Bets', value: profile?.total_bets ?? 0, icon: Gamepad2, color: 'text-blue-400' },
          { label: 'Win Rate', value: `${winRate}%`, icon: Trophy, color: 'text-yellow-400' },
          { label: 'Total Wins', value: profile?.total_wins ?? 0, icon: Star, color: 'text-green-400' },
          { label: 'Referrals', value: profile?.total_referrals ?? 0, icon: Gift, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card text-center">
            <Icon size={20} className={`${color} mx-auto mb-2`} />
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <p className="text-xs text-gray-400 mb-1">Main Balance</p>
          <p className="text-base font-black text-white">৳{formatCurrency(profile?.main_balance ?? 0)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-gray-400 mb-1">Winning</p>
          <p className="text-base font-black text-green-400">৳{formatCurrency(profile?.winning_balance ?? 0)}</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-xs text-gray-400 mb-1">Bonus</p>
          <p className="text-base font-black text-yellow-400">৳{formatCurrency(profile?.bonus_balance ?? 0)}</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-neon-purple" />
            Recent Bets
          </h3>
        </div>
        {recentBets.length === 0 ? (
          <div className="p-8 text-center">
            <Gamepad2 size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No bets yet. Start playing!</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {recentBets.map(bet => (
              <div key={bet.id} className="flex items-center gap-3 p-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  bet.status === 'won' ? 'bg-green-500/20' : bet.status === 'lost' ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}>
                  <Gamepad2 size={14} className={
                    bet.status === 'won' ? 'text-green-400' : bet.status === 'lost' ? 'text-red-400' : 'text-gray-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium capitalize">{bet.game_type} — {bet.bet_value}</p>
                  <p className="text-xs text-gray-500">{timeAgo(bet.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">৳{bet.amount}</p>
                  {bet.status === 'won' && <p className="text-xs text-green-400 font-bold">+৳{bet.win_amount.toFixed(2)}</p>}
                  {bet.status === 'lost' && <p className="text-xs text-red-400">Lost</p>}
                  {bet.status === 'pending' && <p className="text-xs text-gray-400">Pending</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-dark-border">
          {[
            { label: 'Wallet', to: '/wallet', icon: Shield },
            { label: 'Referral Program', to: '/referral', icon: Gift },
            { label: 'Trading', to: '/trading', icon: TrendingUp },
          ].map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 p-4 hover:bg-dark-100/50 transition-colors text-left"
            >
              <Icon size={18} className="text-neon-purple" />
              <span className="text-white font-medium">{label}</span>
              <ChevronRight size={16} className="text-gray-500 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-semibold"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  )
}
