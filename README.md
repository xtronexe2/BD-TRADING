# BD TRADING — Complete Setup Guide

A mobile-first color trading & prediction web app (similar to WinGo) with:
- 🎯 Win Go color trading game (30s, 1min, 3min, 5min)
- 🎰 Daily Lucky Spin wheel
- 💰 Wallet with Deposit/Withdraw (Nagad, bKash, USDT)
- 👥 Referral/Invite system with commissions
- 📊 Activity center with bonuses
- 🔐 Auth via Supabase (phone & email)
- 🗄️ Full Supabase database backend

---

## Project Structure

```
bd-trading/
├── index.html           # Main app (all tabs)
├── pages/
│   ├── login.html       # Login page
│   └── register.html    # Register page
├── css/
│   └── main.css         # All styles
├── js/
│   ├── app.js           # Main app logic (game, spin, UI)
│   ├── supabase.js      # Supabase helpers
│   └── utils.js         # State & utilities
└── assets/
    └── favicon.svg
```

---

## Step 1 — Create a Supabase Project

1. Go to **https://supabase.com** → Sign up / Login
2. Click **"New Project"**
3. Enter a project name (e.g. `bd-trading`), password, and region (choose closest to Bangladesh)
4. Wait ~2 minutes for the project to spin up
5. Go to **Settings → API** and copy:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

---

## Step 2 — Run Supabase SQL Schema

In your Supabase dashboard, go to **SQL Editor** → **New Query**, paste and run each block:

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  uid TEXT UNIQUE,
  username TEXT,
  avatar TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  invite_code TEXT UNIQUE,
  referred_by TEXT,
  vip_level INTEGER DEFAULT 0,
  total_deposit DECIMAL(12,2) DEFAULT 0,
  total_withdraw DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,        -- WIN, LOSS, DEPOSIT, WITHDRAW, SPIN, BONUS
  amount DECIMAL(12,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Bets Table
```sql
CREATE TABLE bets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bet_type TEXT,             -- color, number, size
  bet_value TEXT,            -- green, red, violet, 0-9, big, small
  bet_amount DECIMAL(12,2),
  game_result INTEGER,
  win BOOLEAN,
  payout DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bets" ON bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Spins Table (Daily Spin tracking)
```sql
CREATE TABLE spins (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  spin_date DATE NOT NULL,
  prize TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, spin_date)
);

ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spins" ON spins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins" ON spins
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Step 3 — Connect Your App to Supabase

Open these two files and replace the placeholder values:

### `js/supabase.js` (line 2–3)
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### `pages/login.html` (in the script block)
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### `pages/register.html` (in the script block)
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**Replace `YOUR_PROJECT_ID` and `YOUR_ANON_KEY` with your actual values from Step 1.**

---

## Step 4 — Configure Supabase Auth

1. In Supabase dashboard → **Authentication → Settings**
2. Under **"Email Auth"** → enable **"Confirm email"**: turn it **OFF** (for easier dev)
3. Set **Site URL** to your Vercel domain (e.g. `https://bd-trading.vercel.app`)
4. Add **Redirect URLs**: same as site URL + `https://bd-trading.vercel.app/**`

---

## Step 5 — Deploy to GitHub

```bash
# Initialize git
cd bd-trading
git init
git add .
git commit -m "Initial BD TRADING release"

# Create a new repo on github.com then push:
git remote add origin https://github.com/YOUR_USERNAME/bd-trading.git
git branch -M main
git push -u origin main
```

---

## Step 6 — Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts → select your project → deploy
```

### Option B — Vercel Dashboard (easier)
1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"Add New Project"**
3. Select your `bd-trading` repo
4. Framework: **Other** (plain HTML/JS)
5. No build command needed — just click **Deploy**
6. Your app will be live at `https://bd-trading-xxx.vercel.app`

---

## Step 7 — Add `vercel.json` (Optional, for clean routing)

Create a file called `vercel.json` in the root:

```json
{
  "rewrites": [
    { "source": "/login", "destination": "/pages/login.html" },
    { "source": "/register", "destination": "/pages/register.html" }
  ]
}
```

---

## Features Overview

| Feature | Description |
|---------|-------------|
| Loading Splash | Animated logo splash before app loads |
| Win Go Game | 30s/1min/3min/5min color prediction |
| Bet System | Bet on Color (Green/Red/Violet) or Number (0-9) or Big/Small |
| Spin Wheel | Daily free spin with weighted prizes |
| Wallet | Balance, deposit, withdraw, history |
| Referral | Invite code, share link, commission tiers |
| Activity | Bonuses: attendance, gifts, jackpot, etc |
| Account | Profile, avatar, VIP, game history |
| Auth | Phone & email register/login via Supabase |

---

## Game Payouts

| Bet Type | Payout |
|----------|--------|
| Green | 2x |
| Red | 2x |
| Violet | 4.5x |
| Number (exact) | 9x |
| Big/Small | 2x |

*Note: 0 = Red+Violet, 5 = Green+Violet*

---

## Customization

### Change Brand Name
Search and replace `BD TRADING` in all files.

### Change Colors
In `css/main.css`, update the CSS variables in `:root`:
```css
--primary: #f0534a;         /* Main red */
--primary-light: #ff7a72;
--primary-dark: #c93d36;
```

### Add Real Payment Gateway
In `js/app.js` → `buildDepositPage()` function, connect to your payment API.

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (ES Modules)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Fonts**: Google Fonts (Baloo 2 + Nunito)
- **No build step required** — deploy as-is!

---

## Support

For any issues, please open a GitHub issue or contact the developer.
