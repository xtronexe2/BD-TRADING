import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { generateServerSeed, generateClientSeed, hashServerSeed, generateResult } from '../lib/fairness'
import type { GameRound } from '../types'

interface UseGameRoundOptions {
  gameType: 'wingo' | 'k3' | '5d' | 'trx'
  duration: number
}

export function useGameRound({ gameType, duration }: UseGameRoundOptions) {
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [history, setHistory] = useState<GameRound[]>([])
  const [phase, setPhase] = useState<'betting' | 'settling' | 'result'>('betting')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundRef = useRef<GameRound | null>(null)

  const generatePeriod = () => {
    const now = new Date()
    const periodNum = Math.floor(now.getTime() / (duration * 1000))
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(periodNum).padStart(6, '0')}`
  }

  const createRound = useCallback(async () => {
    const serverSeed = generateServerSeed()
    const clientSeed = generateClientSeed()
    const serverSeedHash = hashServerSeed(serverSeed)
    const period = generatePeriod()

    const result = generateResult(serverSeed, clientSeed, 1, gameType)

    let resultData: Record<string, unknown> = {}
    if (gameType === 'wingo') {
      resultData = { number: result }
    } else if (gameType === 'k3') {
      const d1 = Math.floor(result / 9) % 6 + 1 || 1
      const d2 = Math.floor(result / 3) % 6 + 1 || 2
      const d3 = result % 6 + 1 || 3
      resultData = { dice: [d1, d2, d3], sum: d1 + d2 + d3 }
    } else if (gameType === '5d') {
      const digits = result.toString().padStart(5, '0').split('').map(Number)
      resultData = { digits, a: digits[0], b: digits[1], c: digits[2], d: digits[3], e: digits[4] }
    } else if (gameType === 'trx') {
      resultData = { number: result }
    }

    const { data, error } = await supabase
      .from('game_rounds')
      .insert({
        game_type: gameType,
        period,
        server_seed_hash: serverSeedHash,
        client_seed: clientSeed,
        result,
        result_data: resultData,
        status: 'active',
        duration,
        server_seed: serverSeed,
      })
      .select()
      .single()

    if (!error && data) {
      const round = data as unknown as GameRound
      setCurrentRound(round)
      roundRef.current = round
      setTimeLeft(duration)
      setPhase('betting')
    }
  }, [gameType, duration])

  const settleRound = useCallback(async () => {
    const round = roundRef.current
    if (!round) return

    setPhase('settling')

    await supabase
      .from('game_rounds')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', round.id)

    await supabase.rpc('settle_bets', { round_id: round.id })

    setPhase('result')

    const { data } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('game_type', gameType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) setHistory(data as unknown as GameRound[])

    setTimeout(() => {
      createRound()
    }, 3000)
  }, [gameType, createRound])

  useEffect(() => {
    supabase
      .from('game_rounds')
      .select('*')
      .eq('game_type', gameType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setHistory(data as unknown as GameRound[])
      })

    createRound()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameType])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          settleRound()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentRound, settleRound])

  return { currentRound, timeLeft, history, phase, createRound }
}
