import { getWingoColorDisplay } from '../../lib/fairness'
import type { GameRound } from '../../types'

interface GameHistoryProps {
  history: GameRound[]
  gameType: string
}

export default function GameHistory({ history, gameType }: GameHistoryProps) {
  if (history.length === 0) return null

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
      <h3 className="font-bold text-white mb-3">Recent Results</h3>

      {gameType === 'wingo' && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {history.slice(0, 20).map((round) => {
              const { color } = getWingoColorDisplay(round.result)
              return (
                <div
                  key={round.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow ${
                    color === 'green' ? 'bg-green-500' :
                    color === 'red' ? 'bg-red-500' :
                    'bg-purple-500'
                  }`}
                >
                  {round.result}
                </div>
              )
            })}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-dark-border">
                  <th className="text-left pb-2">Period</th>
                  <th className="text-center pb-2">Number</th>
                  <th className="text-center pb-2">Color</th>
                  <th className="text-center pb-2">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/50">
                {history.slice(0, 10).map((round) => {
                  const { color, label } = getWingoColorDisplay(round.result)
                  const isBig = round.result >= 5
                  return (
                    <tr key={round.id} className="text-gray-300">
                      <td className="py-2 font-mono text-gray-500 text-xs">{round.period.slice(-6)}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs ${
                          color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : 'bg-purple-500'
                        }`}>
                          {round.result}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`badge ${
                          color === 'green' ? 'badge-green' : color === 'red' ? 'badge-red' : 'badge-purple'
                        }`}>
                          {label}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`badge ${isBig ? 'badge-red' : 'badge-green'}`}>
                          {isBig ? 'Big' : 'Small'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gameType === 'k3' && (
        <div className="space-y-2">
          {history.slice(0, 10).map((round) => {
            const data = round.result_data as { dice?: number[]; sum?: number }
            return (
              <div key={round.id} className="flex items-center justify-between p-2 rounded-xl bg-dark-100">
                <span className="text-gray-500 font-mono text-xs">{round.period.slice(-6)}</span>
                <div className="flex gap-1">
                  {(data.dice || [1, 1, 1]).map((d, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-white text-xs font-bold">
                      {d}
                    </div>
                  ))}
                </div>
                <span className="font-bold text-white text-sm">= {data.sum || round.result}</span>
              </div>
            )
          })}
        </div>
      )}

      {(gameType === '5d') && (
        <div className="space-y-2">
          {history.slice(0, 10).map((round) => {
            const data = round.result_data as { digits?: number[] }
            const digits = data.digits || round.result.toString().padStart(5, '0').split('').map(Number)
            return (
              <div key={round.id} className="flex items-center justify-between p-2 rounded-xl bg-dark-100">
                <span className="text-gray-500 font-mono text-xs">{round.period.slice(-6)}</span>
                <div className="flex gap-1">
                  {['A','B','C','D','E'].map((l, i) => (
                    <div key={l} className="flex flex-col items-center">
                      <span className="text-gray-500 text-xs">{l}</span>
                      <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-white text-xs font-bold">
                        {digits[i] ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {gameType === 'trx' && (
        <div className="flex gap-2 flex-wrap">
          {history.slice(0, 20).map((round) => {
            const isBig = round.result >= 5
            return (
              <div
                key={round.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  isBig ? 'bg-red-500' : 'bg-green-500'
                }`}
              >
                {round.result}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
