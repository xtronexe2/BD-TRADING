interface GameTimerProps {
  timeLeft: number
  duration: number
  period: string
  phase: 'betting' | 'settling' | 'result'
}

export default function GameTimer({ timeLeft, duration, period, phase }: GameTimerProps) {
  const progress = (timeLeft / duration) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isUrgent = timeLeft <= 10

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">Period</p>
          <p className="text-sm font-mono font-bold text-white">{period}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {phase === 'betting' ? 'Time Remaining' : phase === 'settling' ? 'Settling...' : 'Result!'}
          </p>
          {phase === 'betting' && (
            <div className={`flex items-center gap-1 font-mono font-black text-2xl ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              <span className="timer-digit bg-dark-100 rounded-lg px-2 py-1">
                {String(minutes).padStart(2, '0')}
              </span>
              <span className="text-gray-400">:</span>
              <span className={`timer-digit rounded-lg px-2 py-1 ${isUrgent ? 'bg-red-500/20' : 'bg-dark-100'}`}>
                {String(seconds).padStart(2, '0')}
              </span>
            </div>
          )}
          {phase !== 'betting' && (
            <p className="text-xl font-black text-neon-purple animate-pulse">
              {phase === 'settling' ? '⏳ Processing' : '🎉 Done!'}
            </p>
          )}
        </div>
      </div>

      <div className="w-full bg-dark-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-purple-gradient'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isUrgent && phase === 'betting' && (
        <p className="text-center text-xs text-red-400 mt-2 font-semibold animate-bounce">
          Last chance to bet!
        </p>
      )}
    </div>
  )
}
