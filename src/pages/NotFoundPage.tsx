import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <AlertTriangle size={36} className="text-red-400" />
        </div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <p className="text-xl text-gray-400 mb-2">Page Not Found</p>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 gradient-btn"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
