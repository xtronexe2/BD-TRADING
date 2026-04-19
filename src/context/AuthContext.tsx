import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data as UserProfile)
  }

  const ensureProfile = async (u: User) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', u.id)
      .maybeSingle()

    if (!existing) {
      // Auto-create profile for Google OAuth users
      const username = u.user_metadata?.full_name?.replace(/\s+/g, '_').toLowerCase()
        || u.email?.split('@')[0]
        || 'user_' + u.id.slice(0, 6)

      const code = u.id.slice(0, 8).toUpperCase()
      await supabase.from('profiles').insert({
        id: u.id,
        username,
        email: u.email ?? '',
        avatar_url: u.user_metadata?.avatar_url ?? null,
        referral_code: code,
        main_balance: 1000,
        winning_balance: 0,
        bonus_balance: 50,
      })
    }
    await fetchProfile(u.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) ensureProfile(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await ensureProfile(session.user)
      } else {
        setProfile(null)
      }
      if (event === 'SIGNED_OUT') setProfile(null)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Failed to create account' }

    const userId = data.user.id
    const code = userId.slice(0, 8).toUpperCase()

    let referredBy = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .maybeSingle()
      if (referrer) referredBy = referrer.id
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      username,
      email,
      referral_code: code,
      referred_by: referredBy,
      main_balance: 1000,
      winning_balance: 0,
      bonus_balance: referredBy ? 100 : 50,
    })

    if (profileError) return { error: profileError.message }

    if (referredBy) {
      await supabase.from('referrals').insert({
        referrer_id: referredBy,
        referred_id: userId,
        bonus_amount: 200,
        status: 'completed',
      })
      await supabase.rpc('add_referral_bonus', { referrer_id: referredBy })
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
