// ===== BD TRADING - app.js =====
import {
  initSupabase, supabase,
  signUp, signIn, signOut, getCurrentUser,
  getProfile, updateProfile, createProfile,
  getSpinStatus, recordSpin,
  getTransactions, addTransaction,
  placeBet, getBets
} from './supabase.js';

import {
  AppState, showToast, switchTab,
  formatMoney, generatePeriod, generateResult, calcPayout,
  saveLocal, loadLocal, getAvatarDisplay,
  SPIN_SEGMENTS, weightedRandom, AVATARS
} from './utils.js';

// ===== INIT =====
window.addEventListener('DOMContentLoaded', async () => {
  // Init Supabase
  initSupabase();

  // Build number buttons
  buildNumberButtons();
  // Build history balls
  renderHistoryBalls([]);
  // Build spin wheel
  drawSpinWheel();

  // Start banner carousel
  startBannerCarousel();

  // Check auth
  await checkAuth();

  // Hide splash after 2s
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      startGame();
    }, 650);
  }, 2000);
});

// ===== AUTH CHECK =====
async function checkAuth() {
  try {
    const user = await getCurrentUser();
    if (user) {
      AppState.user = user;
      const profile = await getProfile(user.id);
      if (profile) {
        AppState.profile = profile;
        updateAllUI();
      }
    }
  } catch(e) {
    console.log('Not logged in');
  }
}

// ===== NUMBER BUTTONS =====
function buildNumberButtons() {
  const row = document.getElementById('betNumbersRow');
  if (!row) return;
  const colors = ['red','green','red','green','purple','purple','red','green','red','green'];
  const classMap = { red:'red', green:'green', purple:'violet' };
  for (let i = 0; i <= 9; i++) {
    const btn = document.createElement('button');
    btn.className = `bet-num-btn ${classMap[colors[i]]}-btn`;
    btn.textContent = i;
    btn.onclick = () => openBetModal('number', String(i), `Number ${i}`);
    row.appendChild(btn);
  }
}

// ===== GAME ENGINE =====
let gameTimer;
let currentDuration = 30;

function startGame() {
  AppState.currentPeriod = generatePeriod();
  document.getElementById('wingoIssue').textContent = `Period: ${AppState.currentPeriod}`;

  // Load history from local
  const hist = loadLocal('gameHistory', []);
  AppState.gameHistory = hist;
  renderHistoryBalls(hist.slice(-20));
  renderRecentResults(hist.slice(-10));

  startCountdown(currentDuration);
}

function startCountdown(sec) {
  clearInterval(gameTimer);
  AppState.countdown = sec;
  AppState.gameRunning = true;
  updateTimerDisplay(sec);

  gameTimer = setInterval(() => {
    AppState.countdown--;
    updateTimerDisplay(AppState.countdown);

    if (AppState.countdown <= 0) {
      clearInterval(gameTimer);
      endRound();
    }
  }, 1000);
}

function updateTimerDisplay(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const digits = String(m).padStart(2,'0') + String(s).padStart(2,'0');
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`t${i}`);
    if (el) el.textContent = digits[i];
  }
}

async function endRound() {
  AppState.gameRunning = false;
  const result = generateResult();

  // Add to history
  AppState.gameHistory.unshift({ ...result, period: AppState.currentPeriod });
  if (AppState.gameHistory.length > 50) AppState.gameHistory.length = 50;
  saveLocal('gameHistory', AppState.gameHistory);

  renderHistoryBalls(AppState.gameHistory.slice(0, 20));
  renderRecentResults(AppState.gameHistory.slice(0, 10));

  // Process pending bet
  if (AppState.betPending && AppState.profile) {
    await processBet(result);
  }

  // New period
  AppState.currentPeriod = generatePeriod();
  document.getElementById('wingoIssue').textContent = `Period: ${AppState.currentPeriod}`;
  startCountdown(currentDuration);
}

// ===== BET PROCESSING =====
async function processBet(result) {
  const bet = AppState.betPending;
  AppState.betPending = null;

  const { win, payout } = calcPayout(bet.type, bet.value, result, bet.amount);

  // Update balance
  const newBal = parseFloat(AppState.profile.balance || 0) + (win ? payout - bet.amount : -bet.amount);
  AppState.profile.balance = Math.max(0, newBal);

  try {
    await updateProfile(AppState.user.id, { balance: AppState.profile.balance });
    await placeBet(AppState.user.id, bet.type, bet.value, bet.amount, result.num, win, payout);
    await addTransaction(AppState.user.id, win ? 'WIN' : 'LOSS',
      win ? payout : -bet.amount,
      `Win Go - ${bet.label} - ${win ? 'WIN' : 'LOSS'}`);
  } catch(e) {}

  updateBalanceUI();
  showResultModal(result, win, payout, bet.amount);
}

// ===== RENDER HISTORY BALLS =====
function renderHistoryBalls(history) {
  const wrap = document.getElementById('wingoHistory');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!history.length) {
    wrap.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:12px;padding:4px;">No history yet</div>';
    return;
  }
  history.forEach(h => {
    const ball = document.createElement('div');
    ball.className = `wingo-ball ${h.color}`;
    ball.textContent = h.num;
    wrap.appendChild(ball);
  });
}

// ===== RENDER RECENT RESULTS TABLE =====
function renderRecentResults(history) {
  const tbody = document.getElementById('recentResultsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!history.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-light)">No results yet</td></tr>`;
    return;
  }
  history.forEach(h => {
    const colorDot = h.color === 'green' ? '#10b981' : h.color === 'red' ? '#f0534a' : '#8b5cf6';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:7px 4px;color:var(--text-sub);font-size:11px;">${(h.period||'').slice(-6)}</td>
      <td style="padding:7px 4px;text-align:center;">
        <div style="width:24px;height:24px;border-radius:50%;background:${colorDot};color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto;">${h.num}</div>
      </td>
      <td style="padding:7px 4px;text-align:center;"><span style="background:${colorDot}22;color:${colorDot};padding:2px 8px;border-radius:100px;font-size:11px;font-weight:700;">${h.color}</span></td>
      <td style="padding:7px 4px;text-align:center;font-size:12px;font-weight:700;color:${h.isBig?'#3b82f6':'#10b981'}">${h.isBig?'Big':'Small'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== BET MODAL =====
let currentBetType, currentBetValue, currentBetLabel, selectedBetAmt;

window.openBetModal = function(type, value, label) {
  if (!AppState.user) {
    showToast('Please login first!');
    setTimeout(() => window.location.href = 'pages/login.html', 800);
    return;
  }
  if (!AppState.gameRunning || AppState.countdown <= 3) {
    showToast('Betting closed! Wait for next round.');
    return;
  }
  currentBetType = type;
  currentBetValue = value;
  currentBetLabel = label;
  selectedBetAmt = 10;

  const colorMap = { green:'#10b981', red:'#f0534a', violet:'#8b5cf6' };
  const col = colorMap[value] || 'var(--primary)';

  document.getElementById('betModalTitle').textContent = `Bet on ${label}`;
  document.getElementById('betChoice').textContent = label;
  document.getElementById('betChoice').style.color = col;

  // Reset amount buttons
  document.querySelectorAll('.bet-amt-opt').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-amt="10"]')?.classList.add('selected');

  document.getElementById('betModal').classList.add('open');
};

window.selectBetAmt = function(el) {
  document.querySelectorAll('.bet-amt-opt').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedBetAmt = parseInt(el.dataset.amt);
};

window.closeBetModal = function() {
  document.getElementById('betModal').classList.remove('open');
};

window.confirmBet = async function() {
  const bal = parseFloat(AppState.profile?.balance || 0);
  if (bal < selectedBetAmt) {
    showToast('Insufficient balance!');
    return;
  }
  AppState.betPending = { type: currentBetType, value: currentBetValue, label: currentBetLabel, amount: selectedBetAmt };
  closeBetModal();
  showToast(`Bet placed: ৳${selectedBetAmt} on ${currentBetLabel}`);
};

// ===== RESULT MODAL =====
function showResultModal(result, win, payout, betAmount) {
  const colorName = result.color === 'green' ? '🟢 Green' : result.color === 'red' ? '🔴 Red' : '🟣 Violet';
  document.getElementById('resultIcon').textContent = win ? '🎉' : '😔';
  document.getElementById('resultTitle').textContent = win ? `You Won!` : `Better Luck Next Time`;
  document.getElementById('resultTitle').style.color = win ? 'var(--green)' : 'var(--primary)';
  document.getElementById('resultDesc').innerHTML = `
    Result: <strong>${result.num}</strong> · ${colorName} · ${result.isBig ? 'Big' : 'Small'}<br>
    ${win ? `<span style="color:var(--green);font-weight:800;">+${formatMoney(payout - betAmount)}</span>` : `<span style="color:var(--primary);font-weight:800;">-${formatMoney(betAmount)}</span>`}<br>
    Balance: ${formatMoney(AppState.profile.balance)}
  `;
  document.getElementById('resultModal').classList.add('open');
}

window.closeResultModal = function() {
  document.getElementById('resultModal').classList.remove('open');
};

// ===== SPIN WHEEL =====
function drawSpinWheel() {
  const canvas = document.getElementById('spinWheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 120, cy = 120, r = 116;
  const total = SPIN_SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let startAngle = -Math.PI / 2;

  SPIN_SEGMENTS.forEach(seg => {
    const slice = (seg.weight / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    const midAngle = startAngle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(midAngle);
    const ly = cy + (r * 0.65) * Math.sin(midAngle);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midAngle + Math.PI / 2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(seg.label, 0, 0);
    ctx.restore();

    startAngle += slice;
  });
}

window.openSpinModal = function() {
  if (!AppState.user) {
    showToast('Please login first!');
    setTimeout(() => window.location.href = 'pages/login.html', 800);
    return;
  }
  document.getElementById('spinOverlay').classList.add('open');
  checkSpinStatus();
};

window.document.getElementById && document.getElementById('spinClose')?.addEventListener('click', () => {
  document.getElementById('spinOverlay').classList.remove('open');
});

async function checkSpinStatus() {
  if (!AppState.user) return;
  try {
    const spin = await getSpinStatus(AppState.user.id);
    if (spin) {
      AppState.spinDone = true;
      document.getElementById('spinBtn').disabled = true;
      document.getElementById('spinBtn').style.opacity = '0.5';
      document.getElementById('spinResult').innerHTML = `Today's prize: <span class="prize">${spin.prize}</span>`;
      document.getElementById('spinCount').textContent = 'Come back tomorrow!';
      document.getElementById('spinBadge').textContent = 'DONE';
      document.getElementById('spinBadge').style.background = 'rgba(255,255,255,0.15)';
    } else {
      AppState.spinDone = false;
      document.getElementById('spinBtn').disabled = false;
      document.getElementById('spinBtn').style.opacity = '1';
      document.getElementById('spinResult').textContent = 'Press SPIN to try your luck!';
      document.getElementById('spinCount').textContent = '1 free spin per day';
      document.getElementById('spinBadge').textContent = 'FREE';
    }
  } catch(e) {}
}

document.getElementById('spinBtn')?.addEventListener('click', doSpin);

async function doSpin() {
  if (AppState.spinDone) { showToast('Already spun today!'); return; }
  const btn = document.getElementById('spinBtn');
  btn.disabled = true;

  const prizeIdx = weightedRandom(SPIN_SEGMENTS);
  const prize = SPIN_SEGMENTS[prizeIdx];
  const total = SPIN_SEGMENTS.reduce((s, x) => s + x.weight, 0);

  // Calculate angle to land on prize
  let angleOffset = 0;
  for (let i = 0; i < prizeIdx; i++) angleOffset += (SPIN_SEGMENTS[i].weight / total) * 360;
  const midAngle = angleOffset + (prize.weight / total) * 360 / 2;
  const spins = 5 * 360;
  const targetAngle = spins + (360 - midAngle) - 90;

  const wheel = document.getElementById('spinWheel');
  wheel.style.transition = 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)';
  wheel.style.transform = `rotate(${targetAngle}deg)`;

  setTimeout(async () => {
    AppState.spinDone = true;
    document.getElementById('spinResult').innerHTML = `You won: <span class="prize">${prize.label}</span> 🎉`;
    document.getElementById('spinCount').textContent = 'Come back tomorrow!';
    document.getElementById('spinBadge').textContent = 'DONE';
    document.getElementById('spinBadge').style.background = 'rgba(255,255,255,0.15)';

    try {
      await recordSpin(AppState.user.id, prize.label);
      // Give prize if monetary
      const amount = parseFloat(prize.label.replace('৳',''));
      if (amount > 0 && AppState.profile) {
        AppState.profile.balance = parseFloat(AppState.profile.balance || 0) + amount;
        await updateProfile(AppState.user.id, { balance: AppState.profile.balance });
        await addTransaction(AppState.user.id, 'SPIN', amount, `Daily spin prize: ${prize.label}`);
        updateBalanceUI();
      }
    } catch(e) {}
  }, 4200);
}

// ===== BANNER CAROUSEL =====
function startBannerCarousel() {
  const slides = document.querySelectorAll('.banner-slide');
  const dots = document.querySelectorAll('.banner-dot');
  let idx = 0;
  setInterval(() => {
    slides[idx].classList.remove('active');
    dots[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
    dots[idx].classList.add('active');
  }, 3500);
}

// ===== GAME TAB SWITCH =====
window.switchGameTab = function(btn, game) {
  document.querySelectorAll('.game-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const durations = { wingo: 30, wingo1: 60, wingo3: 180, wingo5: 300 };
  currentDuration = durations[game] || 30;
  clearInterval(gameTimer);
  AppState.betPending = null;
  startCountdown(currentDuration);
};

// ===== UPDATE UI =====
function updateAllUI() {
  updateBalanceUI();
  updateAccountUI();
  refreshPromotion();
}

function updateBalanceUI() {
  const bal = formatMoney(AppState.profile?.balance || 0);
  const els = ['homeBalance','walletBalance','accountBalance'];
  els.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = bal; });

  // Wallet details
  const b = parseFloat(AppState.profile?.balance || 0);
  ['walletAvail','walletWithdraw','mainWalletAmt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatMoney(b);
  });
  if (document.getElementById('mainWalletPct')) document.getElementById('mainWalletPct').textContent = '100%';
  if (document.getElementById('walletMainAmt')) document.getElementById('walletMainAmt').textContent = b.toFixed(0);
}

function updateAccountUI() {
  const p = AppState.profile;
  if (!p) return;
  document.getElementById('accountName').textContent = p.username || 'Member';
  document.getElementById('accountUID').textContent = p.uid || '-';
  document.getElementById('accountVIP').textContent = p.vip_level || 0;
  document.getElementById('accountLastLogin').textContent = new Date().toLocaleString();
  document.getElementById('avatarDisplay').innerHTML = getAvatarDisplay(p);
}

// ===== REFRESH FUNCTIONS =====
window.refreshWallet = async function() {
  if (!AppState.user) return;
  try {
    const profile = await getProfile(AppState.user.id);
    if (profile) { AppState.profile = profile; updateBalanceUI(); }
    const txns = await getTransactions(AppState.user.id);
    renderTransactions(txns);
  } catch(e) {}
};

window.refreshAccount = async function() {
  if (!AppState.user) return;
  try {
    const profile = await getProfile(AppState.user.id);
    if (profile) { AppState.profile = profile; updateAllUI(); }
  } catch(e) {}
};

function refreshActivity() {
  // Demo data
  document.getElementById('actTodayBonus').textContent = '৳0.00';
  document.getElementById('actTotalBonus').textContent = '৳0.00';
}

function refreshPromotion() {
  const p = AppState.profile;
  if (!p) {
    document.getElementById('promoCode').textContent = 'Login required';
    return;
  }
  document.getElementById('promoCode').textContent = p.invite_code || 'N/A';
}

// ===== RENDER TRANSACTIONS =====
function renderTransactions(txns) {
  const wrap = document.getElementById('recentTransactions');
  if (!wrap) return;
  if (!txns || !txns.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-light)"><div style="font-size:32px;margin-bottom:8px;">📭</div><div style="font-size:13px;">No transactions yet</div></div>`;
    return;
  }
  const iconMap = { WIN:'🏆', LOSS:'🎲', DEPOSIT:'📥', WITHDRAW:'📤', SPIN:'🎰', BONUS:'🎁' };
  const colorMap = { WIN:'win', LOSS:'loss', DEPOSIT:'win', WITHDRAW:'loss', SPIN:'win', BONUS:'win' };
  wrap.innerHTML = `<div class="card" style="padding:0 14px;">${
    txns.slice(0,20).map(t => `
      <div class="txn-item">
        <div class="txn-icon" style="background:rgba(240,83,74,0.08)">${iconMap[t.type]||'💳'}</div>
        <div class="txn-info">
          <div class="txn-type">${t.description || t.type}</div>
          <div class="txn-date">${new Date(t.created_at).toLocaleString()}</div>
        </div>
        <div class="txn-amount ${colorMap[t.type]||''}">${t.amount>0?'+':''}${formatMoney(t.amount)}</div>
      </div>
    `).join('')
  }</div>`;
}

// ===== COPY FUNCTIONS =====
window.copyInviteCode = function() {
  const code = document.getElementById('promoCode').textContent;
  navigator.clipboard?.writeText(code).then(() => showToast('Invite code copied!')).catch(() => showToast('Code: ' + code));
};

window.copyUID = function() {
  const uid = document.getElementById('accountUID').textContent;
  navigator.clipboard?.writeText(uid).then(() => showToast('UID copied!')).catch(() => {});
};

window.shareLink = function() {
  const code = AppState.profile?.invite_code || '';
  const url = `${window.location.origin}${window.location.pathname}?ref=${code}`;
  if (navigator.share) {
    navigator.share({ title: 'BD TRADING', text: `Join BD TRADING & earn! Use my code: ${code}`, url });
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast('Link copied!'));
  }
};

// ===== LOGOUT =====
window.handleLogout = async function() {
  if (!confirm('Are you sure you want to logout?')) return;
  try {
    await signOut();
  } catch(e) {}
  AppState.user = null;
  AppState.profile = null;
  showToast('Logged out successfully');
  setTimeout(() => window.location.href = 'pages/login.html', 800);
};

// ===== SUB PAGE SYSTEM =====
const SUB_PAGES = {
  deposit: buildDepositPage,
  withdraw: buildWithdrawPage,
  depositHistory: buildDepositHistoryPage,
  withdrawHistory: buildWithdrawHistoryPage,
  gameHistory: buildGameHistoryPage,
  transactions: buildTransactionsPage,
  changeAvatar: buildChangeAvatarPage,
  customerService: buildCustomerServicePage,
  notifications: buildNotificationsPage,
  promoRules: buildPromoRulesPage,
  vip: buildVIPPage,
  about: buildAboutPage,
  settings: buildSettingsPage,
  feedback: buildFeedbackPage,
  guide: buildGuidePage,
  safe: buildSafePage,
  gameStats: buildGameStatsPage,
  attendance: buildAttendancePage,
  gifts: buildGiftsPage,
};

window.openSubPage = function(name) {
  const container = document.getElementById('subPages');
  const id = `sp-${name}`;
  let existing = document.getElementById(id);
  if (existing) { existing.classList.add('open'); return; }

  const page = document.createElement('div');
  page.className = 'sub-page';
  page.id = id;
  const builder = SUB_PAGES[name];
  if (builder) page.innerHTML = builder();
  else page.innerHTML = buildGenericPage(name);
  container.appendChild(page);
  setTimeout(() => page.classList.add('open'), 10);
};

window.closeSubPage = function(name) {
  const page = document.getElementById(`sp-${name}`);
  if (page) page.classList.remove('open');
};

function subHeader(title, name, action) {
  return `
    <div class="sub-page-header">
      <button class="sub-page-back" onclick="closeSubPage('${name}')">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div class="sub-page-title">${title}</div>
      ${action || ''}
    </div>`;
}

function buildGenericPage(name) {
  const title = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  return `
    ${subHeader(title, name)}
    <div style="padding:40px 20px;text-align:center;color:var(--text-sub);">
      <div style="font-size:48px;margin-bottom:16px;">🚧</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Coming Soon</div>
      <div style="font-size:13px;">This feature will be available soon.</div>
    </div>`;
}

// ===== DEPOSIT PAGE =====
function buildDepositPage() {
  return `
    ${subHeader('Deposit', 'deposit', `<button class="sub-page-action" onclick="openSubPage('depositHistory')">History</button>`)}
    <div style="background:var(--primary-grad);padding:20px 16px;">
      <div style="font-size:12px;color:rgba(255,255,255,0.75);">💼 Balance</div>
      <div style="font-size:28px;font-weight:800;color:white;font-family:'Baloo 2',cursive;margin-top:4px;">${formatMoney(AppState.profile?.balance||0)}</div>
    </div>
    <div style="padding:16px;">
      <div class="section-title" style="margin-bottom:12px;">Select Payment Method</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;">
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;border:2px solid var(--primary);background:rgba(240,83,74,0.05);">
          <div style="font-size:20px;margin-bottom:4px;">🟠</div>
          <div style="font-size:13px;font-weight:700;">Nagad</div>
        </div>
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;">
          <div style="font-size:20px;margin-bottom:4px;">🦚</div>
          <div style="font-size:13px;font-weight:700;">bKash</div>
        </div>
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;">
          <div style="font-size:20px;margin-bottom:4px;">💚</div>
          <div style="font-size:13px;font-weight:700;">USDT</div>
        </div>
      </div>
      <div class="section-title" style="margin-bottom:12px;">Select Channel</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        ${['RolezPay · ৳100-30K','GoPay · ৳100-25K','LuckyPay · ৳100-50K','OKPay · ৳100-25K',
           'StarPago · ৳100-30K','OpPay · ৳100-25K'].map((ch,i) => `
          <div style="background:white;border-radius:var(--radius-sm);padding:12px;cursor:pointer;border:1.5px solid ${i===0?'var(--primary)':'var(--border)'};${i===0?'background:rgba(240,83,74,0.04)':''}" onclick="selectChannel(this)">
            <div style="font-size:12px;font-weight:700;">${ch.split(' · ')[0]}</div>
            <div style="font-size:11px;color:var(--text-sub);">Balance: ${ch.split(' · ')[1]}</div>
          </div>`).join('')}
      </div>
      <div class="input-group">
        <label class="input-label">Deposit Amount</label>
        <div class="input-wrap">
          <div class="input-prefix">৳</div>
          <input type="number" id="depositAmtInput" placeholder="Min ৳100" min="100" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
        ${[100,500,1000,5000].map(a => `<button onclick="setDepositAmt(${a})" style="padding:8px;border-radius:var(--radius-sm);border:1.5px solid var(--border);background:white;font-size:13px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;">৳${a>=1000?a/1000+'K':a}</button>`).join('')}
      </div>
      <button class="btn-gray" id="depositBtn" onclick="submitDeposit()">Deposit</button>
      <div style="margin-top:16px;background:#f9fafb;border-radius:var(--radius-sm);padding:14px;">
        <div style="font-size:12px;color:var(--text-sub);line-height:1.8;">
          ♦ Minimum deposit: <span style="color:var(--primary);">৳100</span><br>
          ♦ Deposit time: <span style="color:var(--primary);">00:00–23:50</span><br>
          ♦ Amount range: <span style="color:var(--primary);">৳100 – ৳100,000</span><br>
          ♦ Please confirm account before depositing.
        </div>
      </div>
    </div>`;
}

window.setDepositAmt = function(amt) {
  const inp = document.getElementById('depositAmtInput');
  if (inp) { inp.value = amt; document.getElementById('depositBtn').className = 'btn-primary'; }
};
window.selectChannel = function(el) {
  el.closest('[style*="grid"]').querySelectorAll('div').forEach(d => { d.style.borderColor = 'var(--border)'; d.style.background='white'; });
  el.style.borderColor = 'var(--primary)';
  el.style.background = 'rgba(240,83,74,0.04)';
};
window.submitDeposit = function() {
  const amt = document.getElementById('depositAmtInput')?.value;
  if (!amt || amt < 100) { showToast('Minimum deposit is ৳100'); return; }
  showToast('Deposit request submitted! Our team will verify shortly.');
};

// ===== WITHDRAW PAGE =====
function buildWithdrawPage() {
  const bal = AppState.profile?.balance || 0;
  return `
    ${subHeader('Withdraw', 'withdraw', `<button class="sub-page-action" onclick="openSubPage('withdrawHistory')">History</button>`)}
    <div style="background:var(--primary-grad);padding:20px 16px;">
      <div style="font-size:12px;color:rgba(255,255,255,0.75);">💼 Available balance</div>
      <div style="font-size:28px;font-weight:800;color:white;font-family:'Baloo 2',cursive;margin-top:4px;display:flex;align-items:center;gap:8px;">
        ${formatMoney(bal)}
        <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </div>
    </div>
    <div style="padding:16px;">
      <div class="section-title" style="margin-bottom:12px;">Withdraw To</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;overflow-x:auto;padding-bottom:4px;">
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;border:2px solid var(--primary);background:rgba(240,83,74,0.05);">
          <div style="font-size:20px;margin-bottom:4px;">💳</div>
          <div style="font-size:13px;font-weight:700;">E-Wallet</div>
        </div>
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;min-width:80px;">
          <div style="text-align:center;">
            <div style="font-size:20px;margin-bottom:4px;">💚</div>
            <div style="font-size:13px;font-weight:700;">USDT</div>
          </div>
        </div>
        <div class="card" style="padding:12px 16px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;min-width:80px;border:1.5px dashed var(--border);">
          <div style="text-align:center;color:var(--text-light);">
            <div style="font-size:20px;margin-bottom:4px;">➕</div>
            <div style="font-size:13px;">Add</div>
          </div>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Withdraw Amount (৳)</label>
        <div class="input-wrap">
          <div class="input-prefix">৳</div>
          <input type="number" id="withdrawAmtInput" placeholder="Enter amount" />
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <span style="font-size:12px;color:var(--text-sub);">Withdrawable: <span style="color:var(--primary);font-weight:700;">${formatMoney(bal)}</span></span>
        <button style="font-size:12px;color:var(--primary);background:none;border:none;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;" onclick="document.getElementById('withdrawAmtInput').value=${bal}">All</button>
      </div>
      <div style="margin-bottom:16px;font-size:12px;color:var(--text-sub);">Withdrawal amount received: <span style="font-weight:700;">৳0.00</span></div>
      <button class="btn-gray" onclick="submitWithdraw()">Withdraw</button>
      <div style="margin-top:16px;background:#f9fafb;border-radius:var(--radius-sm);padding:14px;">
        <div style="font-size:12px;color:var(--text-sub);line-height:1.8;">
          ♦ Need to bet <span style="color:var(--primary);">৳0.00</span> to withdraw<br>
          ♦ Withdraw time: <span style="color:var(--primary);">00:00–23:50</span><br>
          ♦ Remaining today: <span style="color:var(--primary);">3 times</span><br>
          ♦ Amount range: <span style="color:var(--primary);">৳100 – ৳25,000</span>
        </div>
      </div>
    </div>`;
}

window.submitWithdraw = function() {
  const amt = parseFloat(document.getElementById('withdrawAmtInput')?.value || 0);
  const bal = parseFloat(AppState.profile?.balance || 0);
  if (!amt || amt < 100) { showToast('Minimum withdrawal is ৳100'); return; }
  if (amt > bal) { showToast('Insufficient balance!'); return; }
  showToast('Withdrawal request submitted!');
};

// ===== GAME HISTORY =====
function buildGameHistoryPage() {
  const bets = loadLocal('gameHistory', []);
  return `
    ${subHeader('Game History', 'gameHistory')}
    <div style="padding:16px;">
      ${!bets.length ? `<div style="text-align:center;padding:40px;color:var(--text-light);"><div style="font-size:40px;margin-bottom:12px;">🎲</div>No bets yet</div>` :
        `<div class="card" style="padding:0 14px;">${
          bets.slice(0,30).map(b => `
            <div class="txn-item">
              <div class="txn-icon" style="background:${b.color==='green'?'#10b98122':b.color==='red'?'#f0534a22':'#8b5cf622'}">
                <div style="width:28px;height:28px;border-radius:50%;background:${b.color==='green'?'#10b981':b.color==='red'?'#f0534a':'#8b5cf6'};display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:800;">${b.num}</div>
              </div>
              <div class="txn-info">
                <div class="txn-type">${b.color.charAt(0).toUpperCase()+b.color.slice(1)} · ${b.isBig?'Big':'Small'}</div>
                <div class="txn-date">${b.period||''}</div>
              </div>
            </div>`).join('')
        }</div>`}
    </div>`;
}

// ===== TRANSACTIONS PAGE =====
function buildTransactionsPage() {
  return `
    ${subHeader('Transactions', 'transactions')}
    <div style="padding:16px;" id="txnListWrap">
      <div style="text-align:center;padding:24px;color:var(--text-light);">Loading...</div>
    </div>`;
  // Loaded async via script below
}

// ===== CHANGE AVATAR =====
function buildChangeAvatarPage() {
  return `
    ${subHeader('Change Avatar', 'changeAvatar')}
    <div style="padding:16px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${AVATARS.map((a,i) => `
          <div onclick="selectAvatar('${a}')" style="aspect-ratio:1;background:white;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:var(--shadow);cursor:pointer;border:2px solid ${AppState.profile?.avatar===a?'var(--primary)':'transparent'};transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform=''">
            ${a}
          </div>`).join('')}
      </div>
    </div>`;
}

window.selectAvatar = async function(avatar) {
  if (!AppState.user) return;
  AppState.profile.avatar = avatar;
  try { await updateProfile(AppState.user.id, { avatar }); } catch(e) {}
  document.getElementById('avatarDisplay').innerHTML = getAvatarDisplay(AppState.profile);
  showToast('Avatar updated!');
  closeSubPage('changeAvatar');
};

// ===== CUSTOMER SERVICE =====
function buildCustomerServicePage() {
  return `
    ${subHeader('Customer Service', 'customerService')}
    <div style="padding:40px 20px;text-align:center;">
      <div style="font-size:64px;margin-bottom:16px;">🎧</div>
      <div style="font-size:18px;font-weight:800;margin-bottom:8px;">24/7 Support</div>
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:28px;line-height:1.6;">Our team is always here to help you. Contact us via any channel below.</div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <a href="https://t.me/bdtrading_support" target="_blank" style="text-decoration:none;">
          <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;">
            <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#0088cc,#229ed9);display:flex;align-items:center;justify-content:center;font-size:22px;">📱</div>
            <div style="text-align:left;"><div style="font-weight:700;">Telegram</div><div style="font-size:12px;color:var(--text-sub);">@bdtrading_support</div></div>
            <svg style="margin-left:auto;color:var(--text-light);" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </a>
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:14px;" onclick="showToast('Live chat coming soon!')">
          <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f0534a,#ff7a72);display:flex;align-items:center;justify-content:center;font-size:22px;">💬</div>
          <div style="text-align:left;"><div style="font-weight:700;">Live Chat</div><div style="font-size:12px;color:var(--text-sub);">Online 24/7</div></div>
          <svg style="margin-left:auto;color:var(--text-light);" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>`;
}

// ===== NOTIFICATIONS =====
function buildNotificationsPage() {
  return `
    ${subHeader('Notifications', 'notifications')}
    <div style="padding:16px;">
      <div class="card" style="padding:14px 16px;margin-bottom:10px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(240,83,74,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📢</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;margin-bottom:4px;">Welcome to BD TRADING!</div>
            <div style="font-size:12px;color:var(--text-sub);line-height:1.5;">Start trading and win big. Deposit now to get started!</div>
            <div style="font-size:11px;color:var(--text-light);margin-top:6px;">Just now</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ===== PROMO RULES =====
function buildPromoRulesPage() {
  const rules = [
    ['01','There are 6 subordinate levels in inviting friends. When A invites B, B becomes level 1 subordinate of A. When B invites C, C is level 1 of B and level 2 of A.'],
    ['02','When inviting friends to register, you must send the invitation link or enter the invite code so your friends become level 1 subordinates.'],
    ['03','The invitee registers via invite code and completes a deposit. Commission is received immediately after.'],
    ['04','Yesterday\'s commission calculation starts at 01:00 every morning. After calculation, rewards are sent to wallet.'],
  ];
  return `
    ${subHeader('Rules', 'promoRules')}
    <div style="padding:16px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="color:var(--primary);font-size:18px;font-weight:800;">【Promotion Partner】Program</div>
        <div style="font-size:13px;color:var(--text-sub);margin-top:4px;">This activity is valid for a long time</div>
      </div>
      ${rules.map(([n,t]) => `
        <div style="margin-bottom:16px;background:white;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);">
          <div style="background:var(--primary-grad);text-align:center;padding:8px;color:white;font-weight:800;font-size:15px;">${n}</div>
          <div style="padding:14px;font-size:13px;color:var(--text-sub);line-height:1.7;">${t}</div>
        </div>`).join('')}
    </div>`;
}

// ===== VIP PAGE =====
function buildVIPPage() {
  const levels = [
    { lv:0, name:'Bronze', req:0, bonus:'1%', color:'#cd7f32' },
    { lv:1, name:'Silver', req:5000, bonus:'2%', color:'#9ca3af' },
    { lv:2, name:'Gold', req:20000, bonus:'3%', color:'#f59e0b' },
    { lv:3, name:'Platinum', req:100000, bonus:'5%', color:'#3b82f6' },
    { lv:4, name:'Diamond', req:500000, bonus:'8%', color:'#8b5cf6' },
  ];
  const cur = AppState.profile?.vip_level || 0;
  return `
    ${subHeader('VIP Club', 'vip')}
    <div style="background:linear-gradient(135deg,#ffd700,#ffaa00);padding:24px 20px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">👑</div>
      <div style="font-size:20px;font-weight:800;color:white;">VIP Level ${cur}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">${levels[cur]?.name||'Bronze'}</div>
    </div>
    <div style="padding:16px;">
      ${levels.map(l => `
        <div style="background:white;border-radius:var(--radius);padding:14px 16px;margin-bottom:10px;box-shadow:var(--shadow);display:flex;align-items:center;gap:12px;${l.lv===cur?'border:2px solid var(--primary)':''}">
          <div style="width:44px;height:44px;border-radius:50%;background:${l.color};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;">V${l.lv}</div>
          <div style="flex:1;">
            <div style="font-weight:700;">${l.name}</div>
            <div style="font-size:12px;color:var(--text-sub);">Required: ৳${l.req.toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:14px;font-weight:800;color:var(--primary);">${l.bonus}</div>
            <div style="font-size:11px;color:var(--text-sub);">Bonus</div>
          </div>
          ${l.lv===cur?'<div style="background:var(--primary);color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;">Current</div>':''}
        </div>`).join('')}
    </div>`;
}

// ===== ABOUT PAGE =====
function buildAboutPage() {
  return `
    ${subHeader('About Us', 'about')}
    <div style="padding:24px 20px;text-align:center;">
      <div style="width:80px;height:80px;background:var(--primary-grad);border-radius:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 24px rgba(240,83,74,0.35);">
        <svg viewBox="0 0 54 54" fill="none" width="48" height="48"><circle cx="27" cy="27" r="25" fill="white" opacity="0.2"/><path d="M20 27L25 22L30 27L35 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 32L25 27L30 32L35 27" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="27" r="3" fill="white"/></svg>
      </div>
      <div style="font-family:'Baloo 2',cursive;font-size:24px;font-weight:800;margin-bottom:4px;">BD TRADING</div>
      <div style="font-size:12px;color:var(--text-sub);margin-bottom:24px;">Version 1.0.0</div>
      <div class="card" style="padding:16px;text-align:left;">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">About BD TRADING</div>
        <div style="font-size:13px;color:var(--text-sub);line-height:1.7;">BD TRADING is Bangladesh's premier online color trading & prediction platform. We offer fair, transparent, and exciting trading games with fast deposits and withdrawals via local payment methods like Nagad and bKash.</div>
      </div>
    </div>`;
}

// ===== SETTINGS PAGE =====
function buildSettingsPage() {
  return `
    ${subHeader('Settings', 'settings')}
    <div style="padding:16px;">
      <div class="account-menu-card">
        <div class="account-menu-item" onclick="showToast('Password changed!')">
          <div class="ami-icon" style="background:#fef2f2;">🔑</div>
          <div class="ami-text"><div class="ami-name">Change Password</div></div>
          <svg class="ami-chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </div>
        <div class="account-menu-item" onclick="showToast('Phone updated!')">
          <div class="ami-icon" style="background:#f0fdf4;">📱</div>
          <div class="ami-text"><div class="ami-name">Phone Number</div><div class="ami-sub">${AppState.profile?.phone||'Not set'}</div></div>
          <svg class="ami-chevron" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>`;
}

// ===== SAFE PAGE =====
function buildSafePage() {
  return `
    ${subHeader('Safe', 'safe')}
    <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:24px 20px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🔒</div>
      <div style="font-size:14px;font-weight:700;color:#92400e;">Half-hour interest rate: 0.0%</div>
      <div style="font-size:28px;font-weight:800;color:#92400e;margin:8px 0;font-family:'Baloo 2',cursive;">৳0.00</div>
      <div style="font-size:12px;color:#b45309;">Earnings calculated once every 30 minutes</div>
    </div>
    <div style="padding:16px;">
      <div class="input-group"><label class="input-label">Deposit to Safe</label>
        <div class="input-wrap"><div class="input-prefix">৳</div><input type="number" placeholder="Enter amount" /></div>
      </div>
      <button class="btn-primary" onclick="showToast('Safe deposit coming soon!')">Deposit to Safe</button>
    </div>`;
}

// ===== DEPOSIT/WITHDRAW HISTORY =====
function buildDepositHistoryPage() {
  return `
    ${subHeader('Deposit History', 'depositHistory')}
    <div style="padding:40px 20px;text-align:center;color:var(--text-light);">
      <div style="font-size:40px;margin-bottom:12px;">📥</div>
      <div style="font-size:14px;">No deposit history</div>
    </div>`;
}
function buildWithdrawHistoryPage() {
  return `
    ${subHeader('Withdrawal History', 'withdrawHistory')}
    <div style="padding:40px 20px;text-align:center;color:var(--text-light);">
      <div style="font-size:40px;margin-bottom:12px;">📤</div>
      <div style="font-size:14px;">No withdrawal history</div>
    </div>`;
}

// ===== GAME STATS PAGE =====
function buildGameStatsPage() {
  const hist = loadLocal('gameHistory', []);
  const total = hist.length;
  const wins = AppState.profile ? 0 : 0;
  return `
    ${subHeader('Game Statistics', 'gameStats')}
    <div style="padding:16px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:var(--primary);font-family:'Baloo 2',cursive;">${total}</div>
          <div style="font-size:12px;color:var(--text-sub);">Total Rounds</div>
        </div>
        <div class="card" style="padding:16px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:var(--green);font-family:'Baloo 2',cursive;">${wins}</div>
          <div style="font-size:12px;color:var(--text-sub);">Total Wins</div>
        </div>
      </div>
    </div>`;
}

// ===== ATTENDANCE PAGE =====
function buildAttendancePage() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const rewards = [5,10,15,20,30,50,100];
  return `
    ${subHeader('Attendance Bonus', 'attendance')}
    <div style="background:var(--primary-grad);padding:20px 16px;text-align:center;">
      <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-bottom:4px;">Consecutive check-in streak</div>
      <div style="font-size:36px;font-weight:800;color:white;font-family:'Baloo 2',cursive;">0 Days</div>
    </div>
    <div style="padding:16px;">
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:16px;">
        ${days.map((d,i) => `
          <div style="background:white;border-radius:var(--radius-sm);padding:8px 4px;text-align:center;box-shadow:var(--shadow);">
            <div style="font-size:10px;color:var(--text-sub);margin-bottom:4px;">${d}</div>
            <div style="font-size:11px;font-weight:800;color:var(--primary);">৳${rewards[i]}</div>
          </div>`).join('')}
      </div>
      <button class="btn-primary" onclick="showToast('Checked in! Come back tomorrow.')">Check In Today</button>
    </div>`;
}

// ===== GIFTS PAGE =====
function buildGiftsPage() {
  return `
    ${subHeader('Gift Redemption', 'gifts')}
    <div style="padding:24px 20px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:56px;margin-bottom:12px;">🎁</div>
        <div style="font-size:14px;color:var(--text-sub);">Enter a redemption code to receive gift rewards</div>
      </div>
      <div class="input-group">
        <label class="input-label">Redemption Code</label>
        <div class="input-wrap">
          <input type="text" id="giftCodeInput" placeholder="Enter gift code" style="text-transform:uppercase;" />
        </div>
      </div>
      <button class="btn-primary" onclick="redeemGift()">Redeem</button>
    </div>`;
}
window.redeemGift = function() {
  const code = document.getElementById('giftCodeInput')?.value;
  if (!code) { showToast('Please enter a code'); return; }
  showToast('Invalid code. Try again.');
};

// ===== GUIDE PAGE =====
function buildGuidePage() {
  return `
    ${subHeader("Beginner's Guide", 'guide')}
    <div style="padding:16px;">
      ${[
        ['🎯','How to Play Win Go','Select Green, Red, Violet or a Number and click to bet. Wait for the timer to end. If your prediction is correct, you win!'],
        ['💰','How to Deposit','Go to Wallet > Deposit, select a payment method (Nagad/bKash/USDT), enter amount and complete the transaction.'],
        ['📤','How to Withdraw','Go to Wallet > Withdraw, enter amount and select your e-wallet. Withdrawals are processed within 24 hours.'],
        ['🎰','Daily Spin','Visit Promotion tab daily to spin the wheel and win free prizes!'],
        ['👥','Invite & Earn','Share your invite code with friends. Earn commission on every bet they place!'],
      ].map(([i,t,d]) => `
        <div class="card" style="padding:16px;margin-bottom:12px;display:flex;gap:12px;">
          <div style="font-size:28px;flex-shrink:0;">${i}</div>
          <div><div style="font-size:14px;font-weight:700;margin-bottom:6px;">${t}</div><div style="font-size:12px;color:var(--text-sub);line-height:1.6;">${d}</div></div>
        </div>`).join('')}
    </div>`;
}

// ===== FEEDBACK PAGE =====
function buildFeedbackPage() {
  return `
    ${subHeader('Feedback', 'feedback')}
    <div style="padding:20px;">
      <div class="input-group">
        <label class="input-label">Subject</label>
        <div class="input-wrap"><input type="text" placeholder="Brief subject" /></div>
      </div>
      <div class="input-group">
        <label class="input-label">Message</label>
        <textarea placeholder="Describe your issue or suggestion..." style="width:100%;min-height:120px;padding:12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-family:'Nunito',sans-serif;font-size:14px;resize:vertical;outline:none;"></textarea>
      </div>
      <button class="btn-primary" onclick="showToast('Feedback submitted! Thank you.')">Submit Feedback</button>
    </div>`;
}

// ===== GLOBAL EXPORTS =====
window.switchTab = switchTab;
window.showToast = showToast;
