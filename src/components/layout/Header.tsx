import { Bell, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../lib/utils'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Header() {
  const { user, profile } = useAuth()
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    supabase
      .from('announcements')
      .select('title')
      .eq('is_active', true)
      .eq('target', 'all')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setAnnouncements((data as Array<{ title: string }>).map(a => a.title))
      })
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-card/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-gradient flex items-center justify-center">
              <span className="text-white font-black text-sm">BD</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              <span className="text-gradient">BD</span> Trading
            </span>
          </Link>
        </div>

        {announcements.length > 0 && (
          <div className="hidden md:flex items-center gap-2 flex-1 mx-6 overflow-hidden">
            <Bell size={14} className="text-neon-purple flex-shrink-0" />
            <div className="overflow-hidden relative">
              <div className="animate-marquee whitespace-nowrap text-sm text-gray-400">
                {announcements.join(' • ')}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {user && profile ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-gray-400">Balance</span>
                <span className="text-sm font-bold text-neon-gold">
                  ৳{formatCurrency(profile.main_balance + profile.winning_balance)}
                </span>
              </div>
              <button
                onClick={() => setShowChat(true)}
                className="w-9 h-9 rounded-xl bg-dark-100 border border-dark-border flex items-center justify-center text-gray-400 hover:text-neon-purple hover:border-neon-purple transition-colors"
              >
                <MessageCircle size={18} />
              </button>
              <Link to="/profile" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center text-white font-bold text-sm">
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold rounded-xl gradient-btn"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {showChat && (
        <AIChatModal onClose={() => setShowChat(false)} />
      )}
    </header>
  )
}

function AIChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    { role: 'ai', text: 'Hi! I\'m your BD Trading assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || 'Sorry, I could not process that.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'I\'m having trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-dark-card rounded-2xl border border-dark-border shadow-2xl flex flex-col" style={{ height: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-gradient flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">AI Assistant</p>
              <p className="text-xs text-green-400">Online</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-purple-gradient text-white rounded-br-sm'
                  : 'bg-dark-100 text-gray-200 rounded-bl-sm border border-dark-border'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-100 border border-dark-border rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-border flex gap-2">
          <input
            className="flex-1 input-field py-2 text-sm"
            placeholder="Ask anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-purple-gradient text-white text-sm font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
