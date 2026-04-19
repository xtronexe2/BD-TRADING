# 🎰 BD Trading Platform

একটি সম্পূর্ণ virtual trading ও lottery gaming platform — React + TypeScript + Supabase দিয়ে তৈরি।

---

## 📸 Features

- 🎮 **4 টি Games**: Win Go, K3 Lotre, 5D Lotre, TRX Win
- 📈 **Trading Simulator**: Crypto market simulation
- 👛 **Wallet System**: Main / Winning / Bonus balance
- 👥 **Referral System**: Referral code দিয়ে bonus উপার্জন
- 🔐 **Google OAuth**: Google account দিয়ে login
- 🛡️ **Admin Panel**: User management, announcements, game control
- 📱 **Mobile Responsive**: Bottom navigation সহ
- ⚡ **Real-time**: Supabase Realtime দিয়ে live updates

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Deploy | Vercel |

---

## 🚀 Step-by-step Setup Guide

### Step 1: Project Download ও Install

```bash
# 1. Project folder এ যাও
cd bd-trading

# 2. Dependencies install করো
npm install

# 3. .env file তৈরি করো (নিচে দেখো)
cp .env.example .env
```

---

### Step 2: Supabase Project Setup

1. [supabase.com](https://supabase.com) এ যাও → **New Project** তৈরি করো
2. Project তৈরি হলে **Settings → API** তে যাও
3. এই দুটো copy করো:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

### Step 3: .env File Configure করো

`.env` file এ এই values দাও:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

### Step 4: Database Migration Run করো

Supabase Dashboard → **SQL Editor** → New Query → এই দুটো file paste করে Run করো:

**File 1:** `supabase/migrations/20260419075036_create_bd_trading_schema.sql`
**File 2:** `supabase/migrations/20260419090000_google_oauth_support.sql`

---

### Step 5: Google OAuth Setup

#### A. Google Cloud Console এ:

1. [console.cloud.google.com](https://console.cloud.google.com) এ যাও
2. **New Project** তৈরি করো (যেকোনো নাম)
3. **APIs & Services → OAuth consent screen**:
   - User type: External
   - App name, email দাও → Save
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     https://your-vercel-domain.vercel.app
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
5. **Client ID** ও **Client Secret** copy করো

#### B. Supabase Dashboard এ:

1. **Authentication → Providers → Google** enable করো
2. Client ID ও Client Secret paste করো
3. Save করো

---

### Step 6: Admin User বানাও

Supabase **SQL Editor** এ run করো:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'তোমার-email@gmail.com';
```

Admin panel এ যেতে: `yoursite.com/admin-login`

---

### Step 7: Local Development Run করো

```bash
npm run dev
```

Browser এ যাও: `http://localhost:5173`

---

## 🌐 Vercel Deploy

### Method 1: GitHub দিয়ে (Recommended)

1. Project টা GitHub এ push করো:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/bd-trading.git
git push -u origin main
```

2. [vercel.com](https://vercel.com) এ যাও → **New Project** → GitHub repo import করো

3. **Environment Variables** যোগ করো (Vercel dashboard এ):
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = your_anon_key
   ```

4. **Deploy** করো!

### Method 2: Vercel CLI দিয়ে

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

### Vercel এ Google OAuth Redirect Fix

Vercel deploy করার পর Google Cloud Console এ এই URL যোগ করো (Authorized redirect URIs তে):
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

এবং Supabase Dashboard → **Authentication → URL Configuration** তে:
```
Site URL: https://your-vercel-domain.vercel.app
```

---

## 📁 Project Structure

```
bd-trading/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx        # Email + Google login
│   │   │   ├── RegisterPage.tsx     # Email + Google register
│   │   │   └── AdminLoginPage.tsx   # Admin-only login
│   │   ├── games/
│   │   │   ├── WingoPage.tsx
│   │   │   ├── K3Page.tsx
│   │   │   ├── FiveDPage.tsx
│   │   │   └── TrxWinPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── WalletPage.tsx
│   │   ├── TradingPage.tsx
│   │   ├── ReferralPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ActivityPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── NotFoundPage.tsx         # 404 page
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── BottomNav.tsx
│   │       └── Layout.tsx
│   ├── context/
│   │   └── AuthContext.tsx          # Auth + Google OAuth
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── utils.ts
│   │   └── fairness.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── database.ts
│   └── hooks/
│       └── useGameRound.ts
├── supabase/
│   └── migrations/
│       ├── 20260419075036_create_bd_trading_schema.sql
│       └── 20260419090000_google_oauth_support.sql
├── public/
│   └── favicon.svg
├── vercel.json                      # Vercel SPA routing fix
├── .env                             # Environment variables
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Security Notes

- `.env` file কখনো GitHub এ push করবে না (`.gitignore` তে আছে)
- Admin panel URL: `/admin-login` — Google account দিয়ে login করলে শুধু admin access পাবে
- সব database queries RLS (Row Level Security) দিয়ে protected
- Game results provably fair — admin manipulate করতে পারবে না

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Login হচ্ছে না | `.env` তে `VITE_SUPABASE_ANON_KEY` সঠিক কিনা দেখো |
| Google login কাজ করছে না | Supabase এ Google provider enable করো |
| Vercel এ 404 error | `vercel.json` আছে কিনা দেখো |
| Admin panel এ ঢুকতে পারছো না | SQL দিয়ে `is_admin = true` set করো |
| Build error | `npm install` আবার run করো |

---

## 📞 Routes Summary

| URL | Page | Auth Required |
|-----|------|--------------|
| `/` | Home | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/admin-login` | Admin Login | No |
| `/games/wingo` | Win Go | Yes |
| `/games/k3` | K3 Lotre | Yes |
| `/games/5d` | 5D Lotre | Yes |
| `/games/trx` | TRX Win | Yes |
| `/wallet` | Wallet | Yes |
| `/trading` | Trading | Yes |
| `/referral` | Referral | Yes |
| `/profile` | Profile | Yes |
| `/activity` | Activity | Yes |
| `/admin` | Admin Panel | Admin only |

---

Made with ❤️ — BD Trading Platform
