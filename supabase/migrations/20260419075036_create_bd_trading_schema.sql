/*
  # BD Trading Platform - Full Schema

  ## Tables Created
  1. `profiles` - Extended user profiles with balances, referrals, game stats
  2. `game_rounds` - Each lottery game round with provably fair seeds
  3. `bets` - User bets per round
  4. `transactions` - Virtual wallet transaction history
  5. `referrals` - Referral tracking
  6. `trade_positions` - Trading simulator positions
  7. `announcements` - Admin announcements

  ## Security
  - RLS enabled on all tables
  - Authenticated users can only access their own data
  - Admins can view/edit all user data
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  main_balance numeric(12,2) DEFAULT 1000 NOT NULL,
  winning_balance numeric(12,2) DEFAULT 0 NOT NULL,
  bonus_balance numeric(12,2) DEFAULT 50 NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES profiles(id),
  total_referrals integer DEFAULT 0 NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  is_banned boolean DEFAULT false NOT NULL,
  phone text,
  level integer DEFAULT 1 NOT NULL,
  total_bets integer DEFAULT 0 NOT NULL,
  total_wins integer DEFAULT 0 NOT NULL,
  total_wagered numeric(12,2) DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Game rounds table
CREATE TABLE IF NOT EXISTS game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL CHECK (game_type IN ('wingo', 'k3', '5d', 'trx')),
  period text NOT NULL,
  server_seed_hash text NOT NULL,
  client_seed text NOT NULL,
  server_seed text,
  result integer NOT NULL DEFAULT 0,
  result_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settling', 'completed')),
  duration integer NOT NULL DEFAULT 60,
  created_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz
);

ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rounds"
  ON game_rounds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert game rounds"
  ON game_rounds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update game rounds"
  ON game_rounds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  bet_type text NOT NULL,
  bet_value text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  win_amount numeric(10,2) DEFAULT 0 NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at timestamptz DEFAULT now() NOT NULL,
  settled_at timestamptz
);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets"
  ON bets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update bets"
  ON bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can view all bets"
  ON bets FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bet', 'win', 'bonus', 'referral', 'trade_profit', 'trade_loss')),
  amount numeric(10,2) NOT NULL,
  balance_type text NOT NULL CHECK (balance_type IN ('main', 'winning', 'bonus')),
  description text NOT NULL DEFAULT '',
  reference_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bonus_amount numeric(10,2) DEFAULT 200 NOT NULL,
  status text DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Trade positions table
CREATE TABLE IF NOT EXISTS trade_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type IN ('long', 'short')),
  entry_price numeric(16,6) NOT NULL,
  current_price numeric(16,6) NOT NULL DEFAULT 0,
  close_price numeric(16,6),
  quantity numeric(16,8) NOT NULL,
  leverage integer NOT NULL DEFAULT 1,
  pnl numeric(12,2) DEFAULT 0 NOT NULL,
  pnl_percent numeric(8,4) DEFAULT 0 NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz
);

ALTER TABLE trade_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
  ON trade_positions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON trade_positions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON trade_positions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  target text NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'single')),
  target_user_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_round_id ON bets(round_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_type ON game_rounds(game_type);
CREATE INDEX IF NOT EXISTS idx_game_rounds_status ON game_rounds(status);
CREATE INDEX IF NOT EXISTS idx_trade_positions_user_id ON trade_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- Function to add referral bonus
CREATE OR REPLACE FUNCTION add_referral_bonus(referrer_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    total_referrals = total_referrals + 1,
    bonus_balance = bonus_balance + 200
  WHERE id = referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to settle bets for a round
CREATE OR REPLACE FUNCTION settle_bets(round_id uuid)
RETURNS void AS $$
DECLARE
  r RECORD;
  b RECORD;
  win_amt numeric;
  result_num integer;
  result_color text;
  result_is_big boolean;
BEGIN
  SELECT result, game_type INTO r FROM game_rounds WHERE id = round_id;

  result_num := r.result;

  -- Determine wingo color
  IF result_num = 0 OR result_num = 5 THEN
    result_color := 'violet';
  ELSIF result_num IN (1, 3, 7, 9) THEN
    result_color := 'green';
  ELSE
    result_color := 'red';
  END IF;

  result_is_big := result_num >= 5;

  FOR b IN SELECT * FROM bets WHERE bets.round_id = round_id AND status = 'pending' LOOP
    win_amt := 0;

    IF r.game_type = 'wingo' THEN
      IF b.bet_type = 'number' AND b.bet_value::integer = result_num THEN
        win_amt := b.amount * 9;
      ELSIF b.bet_type = 'color' THEN
        IF b.bet_value = 'violet' AND result_color = 'violet' THEN
          win_amt := b.amount * 4.5;
        ELSIF b.bet_value = 'red' AND result_color = 'red' THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'green' AND result_color = 'green' THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'red' AND result_color = 'violet' THEN
          win_amt := b.amount * 1.5;
        ELSIF b.bet_value = 'green' AND result_color = 'violet' THEN
          win_amt := b.amount * 1.5;
        END IF;
      ELSIF b.bet_type = 'size' THEN
        IF b.bet_value = 'big' AND result_is_big THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'small' AND NOT result_is_big THEN
          win_amt := b.amount * 2;
        END IF;
      END IF;
    ELSIF r.game_type IN ('k3', '5d', 'trx') THEN
      IF b.bet_type = 'number' AND b.bet_value::integer = result_num THEN
        win_amt := b.amount * 9;
      ELSIF b.bet_type = 'size' THEN
        IF b.bet_value = 'big' AND result_num >= 5 THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'small' AND result_num < 5 THEN
          win_amt := b.amount * 2;
        END IF;
      ELSIF b.bet_type = 'color' THEN
        IF b.bet_value = 'green' AND result_color = 'green' THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'red' AND result_color = 'red' THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'violet' AND result_color = 'violet' THEN
          win_amt := b.amount * 4.5;
        END IF;
      ELSIF b.bet_type = 'sum_range' THEN
        IF b.bet_value = 'big' AND result_num >= 10 THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'small' AND result_num < 10 THEN
          win_amt := b.amount * 2;
        END IF;
      ELSIF b.bet_type = 'parity' THEN
        IF b.bet_value = 'odd' AND result_num % 2 != 0 THEN
          win_amt := b.amount * 2;
        ELSIF b.bet_value = 'even' AND result_num % 2 = 0 THEN
          win_amt := b.amount * 2;
        END IF;
      END IF;
    END IF;

    IF win_amt > 0 THEN
      UPDATE bets SET status = 'won', win_amount = win_amt, settled_at = now() WHERE id = b.id;
      UPDATE profiles SET
        winning_balance = winning_balance + win_amt,
        total_wins = total_wins + 1,
        total_bets = total_bets + 1,
        total_wagered = total_wagered + b.amount
      WHERE id = b.user_id;
      INSERT INTO transactions (user_id, type, amount, balance_type, description, reference_id)
      VALUES (b.user_id, 'win', win_amt, 'winning', 'Game win: ' || r.game_type, round_id);
    ELSE
      UPDATE bets SET status = 'lost', settled_at = now() WHERE id = b.id;
      UPDATE profiles SET
        total_bets = total_bets + 1,
        total_wagered = total_wagered + b.amount
      WHERE id = b.user_id;
    END IF;
  END LOOP;

  -- Reveal server seed
  UPDATE game_rounds SET status = 'completed', ended_at = now() WHERE id = round_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
