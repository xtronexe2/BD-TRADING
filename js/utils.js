// ===== APP STATE =====
const AppState = {
  user: null,
  profile: null,
  currentTab: 'home',
  gameHistory: [],
  betPending: null,
  spinDone: false,
  
  // Game state
  currentPeriod: '',
  countdown: 30,
  gameRunning: false,
};

// ===== TOAST =====
let toastTimer;
function showToast(msg, duration = 2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const page = document.getElementById(`page-${tab}`);
  const btn = document.getElementById(`nav-${tab}`);
  if (page) page.classList.add('active');
  if (btn) btn.classList.add('active');
  
  AppState.currentTab = tab;

  // Refresh data on tab switch
  if (tab === 'wallet' && AppState.profile) refreshWallet();
  if (tab === 'account' && AppState.profile) refreshAccount();
  if (tab === 'activity') refreshActivity();
  if (tab === 'promotion') refreshPromotion();
}

// ===== FORMAT MONEY =====
function formatMoney(amount) {
  return '৳' + (parseFloat(amount) || 0).toFixed(2);
}

// ===== GENERATE PERIOD =====
function generatePeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const totalSeconds = Math.floor(now.getTime() / 1000);
  const periodNum = Math.floor(totalSeconds / 30);
  return `${y}${m}${d}${String(periodNum).slice(-6)}`;
}

// ===== RANDOM GAME RESULT =====
function generateResult() {
  const num = Math.floor(Math.random() * 10);
  const isBig = num >= 5;
  let color;
  if (num === 0) color = 'purple'; // 0 = red+purple
  else if (num === 5) color = 'purple'; // 5 = green+purple
  else if ([1,3,7,9].includes(num)) color = 'green';
  else color = 'red';
  return { num, isBig, color };
}

// ===== PAYOUT CALC =====
function calcPayout(betType, betValue, result, betAmount) {
  const { num, isBig, color } = result;
  let win = false;
  let multiplier = 0;

  if (betType === 'color') {
    if (betValue === 'green' && color === 'green') { win = true; multiplier = 2; }
    else if (betValue === 'red' && color === 'red') { win = true; multiplier = 2; }
    else if (betValue === 'violet' && color === 'purple') { win = true; multiplier = 4.5; }
    else if (betValue === 'green' && color === 'purple' && num === 5) { win = true; multiplier = 1.5; }
    else if (betValue === 'red' && color === 'purple' && num === 0) { win = true; multiplier = 1.5; }
  } else if (betType === 'number') {
    if (parseInt(betValue) === num) { win = true; multiplier = 9; }
  } else if (betType === 'size') {
    if (betValue === 'big' && isBig) { win = true; multiplier = 2; }
    else if (betValue === 'small' && !isBig) { win = true; multiplier = 2; }
  }

  const payout = win ? betAmount * multiplier : 0;
  return { win, payout };
}

// ===== LOCAL STORAGE HELPERS =====
function saveLocal(key, val) {
  try { localStorage.setItem(`bdt_${key}`, JSON.stringify(val)); } catch(e) {}
}
function loadLocal(key, def) {
  try {
    const v = localStorage.getItem(`bdt_${key}`);
    return v !== null ? JSON.parse(v) : def;
  } catch(e) { return def; }
}

// ===== AVATAR LIST =====
const AVATARS = [
  '👤','😎','🦸','🧑','👩','👦','🧔','👱','🧛','🧝',
  '🦊','🐯','🐺','🦁','🐻','🐼','🐨','🦅','🦋','🐬'
];

function getAvatarDisplay(profile) {
  if (!profile) return '👤';
  if (profile.avatar && profile.avatar.startsWith('http')) {
    return `<img src="${profile.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  }
  if (profile.avatar && AVATARS.includes(profile.avatar)) return profile.avatar;
  return '👤';
}

// ===== SPIN WHEEL SEGMENTS =====
const SPIN_SEGMENTS = [
  { label: '৳0',      color: '#f0534a', weight: 30 },
  { label: '৳10',     color: '#f59e0b', weight: 25 },
  { label: '৳0',      color: '#f0534a', weight: 20 },
  { label: '৳50',     color: '#10b981', weight: 10 },
  { label: '৳0',      color: '#f0534a', weight: 8  },
  { label: '৳20',     color: '#3b82f6', weight: 4  },
  { label: '৳0',      color: '#f0534a', weight: 2  },
  { label: '৳100',    color: '#8b5cf6', weight: 0.8},
  { label: '৳500',    color: '#f093fb', weight: 0.2},
];

function weightedRandom(segments) {
  const total = segments.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < segments.length; i++) {
    r -= segments[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

export {
  AppState, showToast, switchTab,
  formatMoney, generatePeriod, generateResult, calcPayout,
  saveLocal, loadLocal, getAvatarDisplay,
  SPIN_SEGMENTS, weightedRandom, AVATARS
};
