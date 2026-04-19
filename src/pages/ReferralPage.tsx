import { useState, useEffect } from 'react'
import { Gift, Users, Copy, Share2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { timeAgo } from '../lib/utils'

interface ReferralRecord {
  id: string
  referred_id: string
  bonus_amount: number
  status: string
  created_at: string
  profiles?: { username: string }
}

export default function ReferralPage() {
  const { profile } = useAuth()
  const [referrals, setReferrals] = useState<ReferralRecord[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('referrals')
      .select('*, profiles!referred_id(username)')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReferrals(data as ReferralRecord[]) })
  }, [profile])

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalBonus = referrals.reduce((sum, r) => sum + r.bonus_amount, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Gift size={20} className="text-yellow-400" />
        Referral Program
      </h1>

      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2e1a0a 50%, #1a0a0a 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Gift size={24} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Invite & Earn</h2>
            <p className="text-gray-400 text-sm mt-1">Get 200 coins for each friend you invite!</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 relative z-10">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{profile?.total_referrals ?? 0}</p>
            <p className="text-xs text-gray-400">Total Invites</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-400">৳{totalBonus}</p>
            <p className="text-xs text-gray-400">Bonus Earned</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-purple-400">{referrals.filter(r => r.status === 'completed').length}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-white">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-dark-100 border border-neon-purple/40 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-neon-purple tracking-widest">{profile?.referral_code}</p>
          </div>
          <button
            onClick={copy}
            className={`flex items-center gap-2 px-4 py-4 rounded-xl font-semibold text-sm transition-all ${
              copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'bg-purple-500/20 text-neon-purple border border-neon-purple/40 hover:bg-purple-500/30'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400">Referral Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-100 rounded-xl px-3 py-2 text-xs text-gray-400 truncate font-mono">
              {referralLink}
            </div>
            <button
              onClick={() => {
                navigator.share?.({ url: referralLink, title: 'Join BD Trading!' })
                  .catch(() => copy())
              }}
              className="p-2 rounded-xl bg-dark-100 text-gray-400 hover:text-white transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
        <h3 className="font-bold text-white mb-3">How It Works</h3>
        <div className="space-y-3">
          {[
            { step: 1, text: 'Share your referral code or link', icon: Share2 },
            { step: 2, text: 'Friend registers using your code', icon: Users },
            { step: 3, text: 'Both of you get bonus coins!', icon: Gift },
          ].map(({ step, text, icon: Icon }) => (
            <div key={step} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-neon-purple/30 flex items-center justify-center text-neon-purple font-bold text-sm">
                {step}
              </div>
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-gray-400" />
                <p className="text-sm text-gray-300">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-neon-purple" />
            Referred Users ({referrals.length})
          </h3>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No referrals yet. Share your code!</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {referrals.map(r => (
              <div key={r.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center text-white font-bold text-sm">
                  {(r.profiles?.username || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{r.profiles?.username || 'User'}</p>
                  <p className="text-xs text-gray-400">{timeAgo(r.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400 text-sm">+৳{r.bonus_amount}</p>
                  <span className={`badge ${r.status === 'completed' ? 'badge-green' : 'badge-purple'}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
