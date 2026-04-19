import { Link } from 'react-router-dom'
import { Trophy, Zap, TrendingUp, Users, Star, ChevronRight, Play, Clock, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/utils'

const lotteryGames = [
  {
    id: 'wingo',
    name: 'Win Go',
    description: 'Color prediction game',
    to: '/games/wingo',
    badge: 'HOT',
    badgeColor: 'bg-red-500',
    period: '1 Min',
    players: '12.4K',
    gradient: 'from-purple-600 to-pink-600',
    icon: '🎯',
  },
  {
    id: 'k3',
    name: 'K3 Lotre',
    description: 'Dice sum prediction',
    to: '/games/k3',
    badge: 'POPULAR',
    badgeColor: 'bg-blue-500',
    period: '1 Min',
    players: '8.2K',
    gradient: 'from-blue-600 to-cyan-600',
    icon: '🎲',
  },
  {
    id: '5d',
    name: '5D Lotre',
    description: 'Multi-digit lottery',
    to: '/games/5d',
    badge: '',
    badgeColor: '',
    period: '1 Min',
    players: '5.7K',
    gradient: 'from-green-600 to-teal-600',
    icon: '🔢',
  },
  {
    id: 'trx',
    name: 'TRX Win',
    description: 'Blockchain-based game',
    to: '/games/trx',
    badge: 'NEW',
    badgeColor: 'bg-green-500',
    period: '1 Min',
    players: '3.1K',
    gradient: 'from-orange-600 to-red-600',
    icon: '⛓️',
  },
]

const popularItems = [
  { rank: 1, name: 'WinGo 1Min', type: 'Lottery', prize: '₹9x', players: '12.4K', hot: true },
  { rank: 2, name: 'K3 Lotre', type: 'Dice', prize: '₹8x', players: '8.2K', hot: true },
  { rank: 3, name: 'TRX Win', type: 'Blockchain', prize: '₹9x', players: '3.1K', hot: false },
  { rank: 4, name: '5D Lotre', type: 'Multi', prize: '₹8x', players: '5.7K', hot: false },
]

const stats = [
  { label: 'Total Users', value: '234K+', icon: Users, color: 'text-blue-400' },
  { label: 'Daily Winners', value: '12.4K', icon: Trophy, color: 'text-yellow-400' },
  { label: 'Games Today', value: '48K+', icon: Zap, color: 'text-purple-400' },
  { label: 'Active Now', value: '3.2K', icon: TrendingUp, color: 'text-green-400' },
]

export default function HomePage() {
  const { user, profile } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 p-6 md:p-8">
          {user && profile ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-gray-400 text-sm">Welcome back,</p>
                <h2 className="text-2xl font-black text-white">{profile.username} 👋</h2>
                <div className="flex items-center gap-4 mt-3">
                  <div className="bg-white/10 rounded-xl px-4 py-2">
                    <p className="text-xs text-gray-400">Main Balance</p>
                    <p className="text-lg font-bold text-white">৳{formatCurrency(profile.main_balance)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-2">
                    <p className="text-xs text-gray-400">Winning</p>
                    <p className="text-lg font-bold text-green-400">৳{formatCurrency(profile.winning_balance)}</p>
                  </div>
                </div>
              </div>
              <Link to="/games/wingo" className="gradient-btn flex items-center gap-2 self-start sm:self-auto">
                <Play size={16} />
                Play Now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  Virtual Trading &<br />
                  <span className="text-gradient">Lottery Games</span>
                </h2>
                <p className="text-gray-400 mt-2 text-sm">Get 1000 free coins on signup!</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link to="/register" className="gradient-btn text-center">
                  Start Free
                </Link>
                <Link to="/login" className="px-6 py-3 rounded-xl border border-neon-purple/50 text-neon-purple text-sm font-semibold hover:bg-neon-purple/10 transition-colors text-center">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card flex flex-col gap-2">
            <Icon size={20} className={color} />
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Lottery Games Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            <h2 className="section-title">Lottery Games</h2>
          </div>
          <Link to="/activity" className="text-sm text-neon-purple flex items-center gap-1 hover:underline">
            All Games <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {lotteryGames.map(game => (
            <Link
              key={game.id}
              to={user ? game.to : '/login'}
              className="game-card group relative"
            >
              <div className={`h-28 bg-gradient-to-br ${game.gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <span className="text-4xl relative z-10">{game.icon}</span>
                {game.badge && (
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full text-white font-bold ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white text-sm">{game.name}</h3>
                <p className="text-xs text-gray-400">{game.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={10} />
                    {game.period}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={10} />
                    {game.players}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star size={20} className="text-yellow-400" />
          <h2 className="section-title">Popular Now</h2>
        </div>

        <div className="space-y-2">
          {popularItems.map(item => (
            <div key={item.rank} className="flex items-center gap-4 p-4 rounded-xl bg-dark-card border border-dark-border hover:border-neon-purple/30 transition-colors">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                item.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                item.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                item.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                'bg-dark-200 text-gray-500'
              }`}>
                {item.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  {item.hot && <span className="badge badge-red">HOT</span>}
                </div>
                <p className="text-xs text-gray-400">{item.type}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400 text-sm">{item.prize}</p>
                <p className="text-xs text-gray-500">{item.players} playing</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trading CTA */}
      <section>
        <Link
          to={user ? '/trading' : '/login'}
          className="block rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 100%)' }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-center opacity-20">
            <TrendingUp size={100} className="text-blue-400" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">New Feature</p>
            <h3 className="text-xl font-black text-white">Trading Simulator</h3>
            <p className="text-gray-400 text-sm mt-1">Trade crypto & forex with virtual coins</p>
            <div className="flex items-center gap-2 mt-4 text-blue-400 text-sm font-semibold">
              Start Trading <ChevronRight size={16} />
            </div>
          </div>
        </Link>
      </section>
    </div>
  )
}
