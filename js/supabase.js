// ===== SUPABASE CONFIG =====
// Replace these with your actual Supabase project values
const SUPABASE_URL = 'https://jexndaiggpsipivcrdyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleG5kYWlnZ3BzaXBpdmNyZHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTEwNDAsImV4cCI6MjA5MjIyNzA0MH0.aLjIV5flXaNTTqxtNaNas6NaYpB3dWl1-NSUVNnVOZY';

// Load Supabase via CDN (loaded in HTML)
let supabase = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

// ===== AUTH HELPERS =====
async function signUp(phone, password) {
  // Use phone as email: phone@bdtrading.app
  const email = `${phone}@bdtrading.app`;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(phone, password) {
  const email = `${phone}@bdtrading.app`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ===== PROFILE HELPERS =====
async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
  return data;
}

async function createProfile(userId, phone, inviteCode) {
  const uid = Math.floor(1000000 + Math.random() * 9000000).toString();
  const myInviteCode = Math.floor(100000000 + Math.random() * 900000000).toString();
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      phone,
      uid,
      balance: 0,
      invite_code: myInviteCode,
      referred_by: inviteCode || null,
      avatar: null,
      username: `Member${uid.slice(-6)}`,
      vip_level: 0,
      created_at: new Date().toISOString()
    });
  if (error) throw error;
  return { uid, myInviteCode };
}

// ===== SPIN HELPERS =====
async function getSpinStatus(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('spins')
    .select('*')
    .eq('user_id', userId)
    .eq('spin_date', today)
    .single();
  return data; // null = hasn't spun today
}

async function recordSpin(userId, prize) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('spins')
    .insert({ user_id: userId, spin_date: today, prize });
  if (error) throw error;
}

// ===== TRANSACTION HELPERS =====
async function getTransactions(userId) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

async function addTransaction(userId, type, amount, description) {
  const { error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, type, amount, description, created_at: new Date().toISOString() });
  if (error) throw error;
}

// ===== GAME BET HELPER =====
async function placeBet(userId, betType, betValue, betAmount, gameResult, win, payout) {
  const { error } = await supabase
    .from('bets')
    .insert({
      user_id: userId,
      bet_type: betType,
      bet_value: betValue,
      bet_amount: betAmount,
      game_result: gameResult,
      win,
      payout,
      created_at: new Date().toISOString()
    });
  if (error) throw error;
}

async function getBets(userId) {
  const { data } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  return data || [];
}

export {
  initSupabase, supabase,
  signUp, signIn, signOut, getCurrentUser,
  getProfile, updateProfile, createProfile,
  getSpinStatus, recordSpin,
  getTransactions, addTransaction,
  placeBet, getBets
};
