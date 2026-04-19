export interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url: string | null
  main_balance: number
  winning_balance: number
  bonus_balance: number
  referral_code: string
  referred_by: string | null
  total_referrals: number
  is_admin: boolean
  is_banned: boolean
  created_at: string
  phone: string | null
  level: number
  total_bets: number
  total_wins: number
  total_wagered: number
}

export interface GameRound {
  id: string
  game_type: string
  period: string
  server_seed_hash: string
  client_seed: string
  result: number
  result_data: Record<string, unknown>
  status: 'pending' | 'active' | 'settling' | 'completed'
  duration: number
  created_at: string
  ended_at: string | null
  server_seed: string | null
}

export interface Bet {
  id: string
  user_id: string
  round_id: string
  game_type: string
  bet_type: string
  bet_value: string
  amount: number
  win_amount: number
  status: 'pending' | 'won' | 'lost'
  created_at: string
  settled_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  type: 'bet' | 'win' | 'bonus' | 'referral' | 'trade_profit' | 'trade_loss'
  amount: number
  balance_type: 'main' | 'winning' | 'bonus'
  description: string
  reference_id: string | null
  created_at: string
}

export interface TradePosition {
  id: string
  user_id: string
  symbol: string
  type: 'long' | 'short'
  entry_price: number
  current_price: number
  quantity: number
  leverage: number
  pnl: number
  pnl_percent: number
  status: 'open' | 'closed'
  created_at: string
  closed_at: string | null
  close_price: number | null
}

export interface MarketAsset {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent: number
  high24h: number
  low24h: number
  volume: number
  icon: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success'
  target: 'all' | 'single'
  target_user_id: string | null
  is_active: boolean
  created_by: string
  created_at: string
}

export type GameType = 'wingo' | 'k3' | '5d' | 'trx'
export type BetType = 'number' | 'color' | 'size'
export type ColorBet = 'red' | 'green' | 'violet'
export type SizeBet = 'big' | 'small'
