import { Home, Wallet, TrendingUp, User, LayoutGrid, Shield, Gift, Gamepad2, ChevronDown } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const mainNav = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/activity', icon: LayoutGrid, label: 'Activity' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/trading', icon: TrendingUp, label: 'Trading' },
  { to: '/referral', icon: Gift, label: 'Referral' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const games = [
  { to: '/games/wingo', label: 'Win Go', badge: 'HOT' },
  { to: '/games/k3', label: 'K3', badge: '' },
  { to: '/games/5d', label: '5D Lottery', badge: '' },
  { to: '/games/trx', label: 'TRX Win', badge: 'NEW' },
]

export default function Sidebar() {
  const { profile } = useAuth()
  const location = useLocation()
  const [gamesOpen, setGamesOpen] = useState(true)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-dark-card border-r border-dark-border z-30 overflow-y-auto">
      <div className="p-5 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-gradient flex items-center justify-center shadow-neon-purple">
            <span className="text-white font-black text-base">BD</span>
          </div>
          <div>
            <p className="font-bold text-white text-base">
              <span className="text-gradient">BD</span> Trading
            </p>
            <p className="text-xs text-gray-500">Virtual Trading Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {mainNav.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-purple-500/20 text-neon-purple border border-neon-purple/30'
                  : 'text-gray-400 hover:bg-dark-100 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-purple" />}
            </NavLink>
          )
        })}

        <div className="pt-2">
          <button
            onClick={() => setGamesOpen(!gamesOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-dark-100 hover:text-white transition-all duration-200"
          >
            <Gamepad2 size={18} />
            <span className="text-sm font-medium flex-1 text-left">Lottery Games</span>
            <ChevronDown size={16} className={`transition-transform ${gamesOpen ? 'rotate-180' : ''}`} />
          </button>

          {gamesOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-dark-border pl-3">
              {games.map(({ to, label, badge }) => {
                const isActive = location.pathname === to
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm ${
                      isActive
                        ? 'bg-purple-500/20 text-neon-purple'
                        : 'text-gray-400 hover:text-white hover:bg-dark-100'
                    }`}
                  >
                    <span>{label}</span>
                    {badge && (
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-md font-bold ${
                        badge === 'HOT' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {profile?.is_admin && (
          <NavLink
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              location.pathname === '/admin'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:bg-dark-100 hover:text-white'
            }`}
          >
            <Shield size={18} />
            <span className="text-sm font-medium">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {profile && (
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-100">
            <div className="w-9 h-9 rounded-xl bg-purple-gradient flex items-center justify-center text-white font-bold text-sm">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.username}</p>
              <p className="text-xs text-gray-400">Level {profile.level}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
