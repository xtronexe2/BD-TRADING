export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          updated_at: string
          phone: string | null
          level: number
          total_bets: number
          total_wins: number
          total_wagered: number
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string | null
          main_balance?: number
          winning_balance?: number
          bonus_balance?: number
          referral_code: string
          referred_by?: string | null
          total_referrals?: number
          is_admin?: boolean
          is_banned?: boolean
          created_at?: string
          updated_at?: string
          phone?: string | null
          level?: number
          total_bets?: number
          total_wins?: number
          total_wagered?: number
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      game_rounds: {
        Row: {
          id: string
          game_type: string
          period: string
          server_seed_hash: string
          client_seed: string
          result: number
          result_data: Json
          status: string
          duration: number
          created_at: string
          ended_at: string | null
          server_seed: string | null
        }
        Insert: {
          id?: string
          game_type: string
          period: string
          server_seed_hash: string
          client_seed: string
          result?: number
          result_data?: Json
          status?: string
          duration?: number
          created_at?: string
          ended_at?: string | null
          server_seed?: string | null
        }
        Update: Partial<Database['public']['Tables']['game_rounds']['Insert']>
      }
      bets: {
        Row: {
          id: string
          user_id: string
          round_id: string
          game_type: string
          bet_type: string
          bet_value: string
          amount: number
          win_amount: number
          status: string
          created_at: string
          settled_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          round_id: string
          game_type: string
          bet_type: string
          bet_value: string
          amount: number
          win_amount?: number
          status?: string
          created_at?: string
          settled_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['bets']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          balance_type: string
          description: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          balance_type: string
          description: string
          reference_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          bonus_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          bonus_amount?: number
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>
      }
      trade_positions: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: string
          entry_price: number
          current_price: number
          quantity: number
          leverage: number
          pnl: number
          pnl_percent: number
          status: string
          created_at: string
          closed_at: string | null
          close_price: number | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: string
          entry_price: number
          current_price?: number
          quantity: number
          leverage?: number
          pnl?: number
          pnl_percent?: number
          status?: string
          created_at?: string
          closed_at?: string | null
          close_price?: number | null
        }
        Update: Partial<Database['public']['Tables']['trade_positions']['Insert']>
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: string
          target: string
          target_user_id: string | null
          is_active: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: string
          target?: string
          target_user_id?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
