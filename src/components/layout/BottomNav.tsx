import { Home, Wallet, TrendingUp, User, LayoutGrid } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/activity', icon: LayoutGrid, label: 'Activity' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/trading', icon: TrendingUp, label: 'Trade' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={user || to === '/' ? to : '/login'}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className={`relative ${isActive ? 'text-neon-purple' : 'text-gray-500'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-purple" />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-neon-purple' : 'text-gray-500'}`}>
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
