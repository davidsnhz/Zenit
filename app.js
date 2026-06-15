/* ================================================================
   ZENIT – app.js
   ================================================================ */
'use strict';

/* ─────────────────────────────────────────────
   FIREBASE CONFIG
   ───────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY", authDomain: "TU_AUTH_DOMAIN", projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET", messagingSenderId: "TU_MESSAGING_SENDER_ID", appId: "TU_APP_ID"
};

/* ─────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────── */
const SCHEMA_VERSION = 1;
const XP_PER_LEVEL = [0, 500, 1200, 2100, 3200, 4500, 6000, 7800, 9800, 12000, 15000];
const LEAGUES = ['Bronce', 'Plata', 'Oro', 'Zafiro', 'Leyenda'];
const LEAGUE_ICONS = { Bronce: '🥉', Plata: '🥈', Oro: '🥇', Zafiro: '💎', Leyenda: '👑' };
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const WISDOM = [
  '"Lo que no te mata te hace más fuerte. - Nietzsche"',
  '"Sufre el dolor de la disciplina o el de la decepción."',
  '"No cuentes los días, haz que los días cuenten."',
  '"El éxito es la suma de pequeños esfuerzos repetidos."',
  '"Tu único competidor eres tú del ayer."',
  '"La constancia supera al talento cuando el talento no es constante."'
];

const EXERCISE_DB = [
  { name: 'Press de Banca', muscle: 'Pecho' }, { name: 'Press Inclinado', muscle: 'Pecho' },
  { name: 'Peso Muerto', muscle: 'Espalda' }, { name: 'Dominadas', muscle: 'Espalda' },
  { name: 'Press Militar', muscle: 'Hombros' }, { name: 'Elevaciones Laterales', muscle: 'Hombros' },
  { name: 'Curl con Barra', muscle: 'Bíceps' }, { name: 'Press Francés', muscle: 'Tríceps' },
  { name: 'Sentadilla Libre', muscle: 'Piernas' }, { name: 'Prensa de Pierna', muscle: 'Piernas' },
  { name: 'Hip Thrust', muscle: 'Glúteos' }, { name: 'Plancha', muscle: 'Core' },
  { name: 'Correr', muscle: 'Cardio' }
];
const MUSCLE_FILTERS = ['Todos','Pecho','Espalda','Hombros','Bíceps','Tríceps','Piernas','Glúteos','Core','Cardio'];
const SIMULATED_USERS = [
  { name: 'Alejandro R.', xp: 0 }, { name: 'María G.', xp: 0 }, { name: 'Carlos P.', xp: 0 },
  { name: 'Sofía L.', xp: 0 }, { name: 'Diego M.', xp: 0 }
];

/* ─────────────────────────────────────────────
   STATE MODULE
   ───────────────────────────────────────────── */
function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION, level: 1, xp: 0,
    leagueXP: 0, league: 'Bronce',
    friendCode: generateCode(), friends: [],
    leagueSimulatedUsers: SIMULATED_USERS.map(u => ({ ...u, xp: Math.floor(Math.random() * 600) + 50 })),
    gymDays: [], restDays: [],
    weeklyRoutine: DAYS.map(d => ({ day: d, exercises: [] })),
    muscleRoutine: [{ name: 'Grupo 1', exercises: [] }],
    goals: [], tasks: [], recentExercises: [], exerciseHistory: {},
    settings: { theme: 'dark', restDuration: 90, haptics: true, weightUnit: 'kg', notifications: { enabled: false, time: '20:00' } }
  };
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const StateModule = (() => {
  let state = null;
  function load() {
    try { const raw = localStorage.getItem('zenit_state'); state = raw ? deepMerge(defaultState(), JSON.parse(raw)) : defaultState(); } 
    catch { state = defaultState(); }
    return state;
  }
  function save() { try { localStorage.setItem('zenit_state', JSON.stringify(state)); } catch (e) { UIModule.toast('Error al guardar', 'error'); } }
  function get() { return state; }
  function set(updates) { Object.assign(state, updates); save(); }
  function saveField(path, value) { const keys = path.split('.'); let obj = state; for (let i = 0; i < keys.length - 1; i++) { obj = obj[keys[i]]; } obj[keys[keys.length - 1]] = value; save(); }
  function deepMerge(target, source) { const out = { ...target }; for (const key in source) { if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) { out[key] = deepMerge(target[key] || {}, source[key]); } else { out[key] = source[key]; } } return out; }
  return { load, save, get, set, saveField };
})();

/* ─────────────────────────────────────────────
   TOOLTIP MODULE
   ───────────────────────────────────────────── */
const TooltipModule = (() => {
  let el;
  function init() {
    el = document.createElement('div');
    el.id = 'heatmap-tooltip';
    document.body.appendChild(el);
  }
  function show(e, text) {
    el.textContent = text;
    const target = e.target || e;
    const rect = target.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top}px`;
    el.classList.add('visible');
  }
  function hide() { el.classList.remove('visible'); }
  return { init, show, hide };
})();

/* ─────────────────────────────────────────────
   FIREBASE & UI MODULE
   ───────────────────────────────────────────── */
const FirebaseModule = (() => {
  let app, auth, db, currentUser = null;
  function init() {
    try {
      if (FIREBASE_CONFIG.apiKey === 'TU_API_KEY') return;
      app = firebase.initializeApp(FIREBASE_CONFIG); auth = firebase.auth(); db = firebase.firestore();
      auth.onAuthStateChanged(user => { currentUser = user; UIModule.updateAuthUI(user); });
    } catch (e) { console.warn('Firebase no disponible:', e.message); }
  }
  async function loginWithGoogle() {
    if (!auth) { UIModule.toast('Firebase no configurado', 'error'); return; }
    try { const provider = new firebase.auth.GoogleAuthProvider(); await auth.signInWithPopup(provider); } catch (e) { UIModule.toast('Error al iniciar sesión', 'error'); }
  }
  async function logout() { if (!auth) return; try { await auth.signOut(); currentUser = null; UIModule.updateAuthUI(null); UIModule.toast('Sesión cerrada', 'info'); } catch (e) { UIModule.toast('Error al cerrar', 'error'); } }
  return { init, loginWithGoogle, logout };
})();

const UIModule = (() => {
  const toastContainer = () => document.getElementById('toast-container');
  function toast(msg, type = 'info', duration = 2800) {
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg;
    toastContainer().appendChild(el); setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; setTimeout(() => el.remove(), 400); }, duration);
  }
  function confirm(msg, onConfirm) {
    const overlay = document.createElement('div'); overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center';
    overlay.innerHTML = `<div style="background:var(--surface);border-radius:24px 24px 0 0;width:100%;padding:24px 20px 40px"><p style="font-size:15px;font-weight:600;text-align:center;margin-bottom:20px">${msg}</p><div style="display:flex;gap:10px"><button id="cf-cancel" style="flex:1;padding:12px;border-radius:12px;background:var(--surface2);border:1px solid var(--border);font-weight:700;cursor:pointer">Cancelar</button><button id="cf-ok" style="flex:1;padding:12px;border-radius:12px;background:var(--danger);color:#fff;font-weight:700;cursor:pointer">Confirmar</button></div></div>`;
    document.body.appendChild(overlay); overlay.querySelector('#cf-cancel').addEventListener('click', () => overlay.remove()); overlay.querySelector('#cf-ok').addEventListener('click', () => { overlay.remove(); onConfirm(); });
  }
  function openSidebar() { document.getElementById('sidebar-overlay').classList.add('open'); document.getElementById('sidebar').classList.add('open'); }
  function closeSidebar() { document.getElementById('sidebar-overlay').classList.remove('open'); document.getElementById('sidebar').classList.remove('open'); }
  function openModal(id) { const el = document.getElementById(id); el.style.display = 'flex'; requestAnimationFrame(() => el.classList.add('open')); }
  function closeModal(id) { const el = document.getElementById(id); el.classList.remove('open'); setTimeout(() => { el.style.display = 'none'; }, 350); }
  function updateAuthUI(user) {
    const avatarBtn = document.getElementById('avatar-btn'); const sbAvatar = document.getElementById('sb-avatar');
    const sbName = document.getElementById('sb-name'); const sbEmail = document.getElementById('sb-email'); const loginBtn = document.getElementById('login-btn');
    const userIcon = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    const sbUserIcon = `<svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    if (user) {
      if (user.photoURL) { avatarBtn.innerHTML = `<img src="${user.photoURL}" alt=""/>`; sbAvatar.innerHTML = `<img src="${user.photoURL}" alt=""/>`; } 
      else { const initials = (user.displayName || user.email || 'U').charAt(0).toUpperCase(); avatarBtn.textContent = initials; sbAvatar.textContent = initials; }
      sbName.textContent = user.displayName || 'Usuario'; sbEmail.textContent = user.email;
      loginBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Cerrar sesión`;
      loginBtn.className = 'auth-btn logout'; loginBtn.dataset.action = 'logout';
    } else {
      avatarBtn.innerHTML = userIcon; sbAvatar.innerHTML = sbUserIcon; sbName.textContent = 'Usuario'; sbEmail.textContent = 'Sin sesión iniciada';
      loginBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Iniciar sesión con Google`;
      loginBtn.className = 'auth-btn'; loginBtn.dataset.action = 'login';
    }
  }
  return { toast, confirm, openSidebar, closeSidebar, openModal, closeModal, updateAuthUI };
})();

/* ─────────────────────────────────────────────
   XP / STREAK MODULES
   ───────────────────────────────────────────── */
const XPModule = (() => {
  function addXP(amount, leagueAmount = 0) {
    const s = StateModule.get();
    s.xp += amount; s.leagueXP += leagueAmount;
    let lvl = s.level;
    while (lvl < XP_PER_LEVEL.length - 1 && s.xp >= XP_PER_LEVEL[lvl]) { lvl++; UIModule.toast(`¡Nivel ${lvl} alcanzado! 🎉`, 'success', 3500); }
    s.level = lvl;
    if (s.leagueXP >= 2000 && s.league !== 'Leyenda') { const idx = LEAGUES.indexOf(s.league); if (idx < LEAGUES.length - 1) s.league = LEAGUES[idx + 1]; }
    StateModule.save(); DashboardModule.render(); CommunityModule.renderLeague();
  }
  function getXPProgress(xp, level) { const current = xp - (XP_PER_LEVEL[level - 1] || 0); const needed = (XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1]) - (XP_PER_LEVEL[level - 1] || 0); return { current, needed, pct: Math.min(100, Math.round(current / needed * 100)) }; }
  return { addXP, getXPProgress };
})();

const StreakModule = (() => {
  function compute() {
    const s = StateModule.get(); const allDays = [...new Set([...s.gymDays, ...s.restDays])].sort();
    if (!allDays.length) return { streak: 0, maxStreak: 0 };
    let streak = 0, maxStreak = 0, consecutive = 0, restConsecutive = 0; const today = todayStr(); let d = new Date();
    for (let i = 0; i < 365; i++) {
      const str = dateToStr(d); const isGym = s.gymDays.includes(str); const isRest = s.restDays.includes(str);
      if (isGym || isRest) { consecutive++; if (isGym) restConsecutive = 0; else restConsecutive++; if (restConsecutive >= 5) break; } 
      else { if (str === today) { d.setDate(d.getDate() - 1); continue; } break; }
      d.setDate(d.getDate() - 1);
    }
    streak = consecutive; maxStreak = Math.max(streak, maxStreak);
    return { streak, maxStreak };
  }
  function todayStr() { return dateToStr(new Date()); }
  function dateToStr(d) { return d.toISOString().split('T')[0]; }
  return { compute, todayStr, dateToStr };
})();

/* ─────────────────────────────────────────────
   DASHBOARD MODULE
   ───────────────────────────────────────────── */
const DashboardModule = (() => {
  function render() { renderGreeting(); renderWeekStrip(); renderStreak(); renderHabits(); renderGoals(); }
  function getWeekNumber(d) { d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); return Math.ceil((((d - new Date(Date.UTC(d.getUTCFullYear(),0,1))) / 86400000) + 1)/7); }
  function renderGreeting() {
    const h = new Date().getHours(); const greet = h >= 8 && h < 14 ? 'Buenos días' : h >= 14 && h < 22 ? 'Buenas tardes' : 'Buenas noches';
    document.getElementById('dash-subtitle').textContent = `${greet} · Semana ${getWeekNumber(new Date())} del año`;
    if(!window.quoteSet) { document.getElementById('wisdom-quote').textContent = WISDOM[Math.floor(Math.random() * WISDOM.length)]; window.quoteSet = true; }
  }
  function renderWeekStrip() {
    const strip = document.getElementById('week-strip'); const s = StateModule.get(); const today = new Date(); const todayStr = StreakModule.todayStr();
    const dayOfWeek = (today.getDay() + 6) % 7; const monday = new Date(today); monday.setDate(today.getDate() - dayOfWeek);
    strip.innerHTML = ''; const labels = ['L','M','X','J','V','S','D'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i); const str = StreakModule.dateToStr(d);
      const isGym = s.gymDays.includes(str); const isRest = s.restDays.includes(str) && !isGym; const isToday = str === todayStr;
      const el = document.createElement('div'); el.className = 'week-day' + (isGym ? ' gym' : '') + (isRest ? ' rest' : '') + (isToday ? ' today' : '');
      el.innerHTML = `<span class="wd-label">${labels[i]}</span><span class="wd-num">${d.getDate()}</span>`; strip.appendChild(el);
    }
  }
  function renderStreak() {
    const { streak } = StreakModule.compute(); const s = StateModule.get(); const { current, needed, pct } = XPModule.getXPProgress(s.xp, s.level);
    document.getElementById('streak-label-dash').textContent = streak > 0 ? `¡Llevas ${streak} días de racha!` : 'Empieza hoy tu racha.';
    document.getElementById('xp-bar').style.width = pct + '%';
    const xpLabel = document.getElementById('xp-bar-label'); if (xpLabel) xpLabel.textContent = `Nivel ${s.level} · ${current} / ${needed} XP`;
    document.getElementById('sb-level').textContent = `Nivel ${s.level} · ${s.league}`;
  }
  function renderHabits() {
    const s = StateModule.get(); const list = document.getElementById('dash-habits-list'); const todayStr = StreakModule.todayStr();
    if (!s.tasks.length) { list.innerHTML = '<span class="hint-text">Añade tus tareas diarias en la pestaña Metas.</span>'; return; }
    list.innerHTML = s.tasks.map((t, i) => {
      const done = t.completedDates && t.completedDates.includes(todayStr);
      return `<div class="habit-item" data-i="${i}"><div class="habit-check ${done ? 'done' : ''}"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><span class="habit-name ${done ? 'done' : ''}">${escHtml(t.name)}</span></div>`;
    }).join('');
    list.querySelectorAll('.habit-item').forEach(el => { 
      el.addEventListener('click', (e) => {
        const check = el.querySelector('.habit-check');
        if (check) check.classList.add('anim-pop');
        setTimeout(() => HabitsModule.toggleHabit(+el.dataset.i), 200);
      }); 
    });
  }
  function renderGoals() {
    const s = StateModule.get(); const list = document.getElementById('dash-goals-list');
    if (!s.goals.length) { list.innerHTML = '<span class="hint-text">Gestiona tus propósitos en la pestaña Metas.</span>'; return; }
    list.innerHTML = s.goals.map(g => `<div class="habit-item" style="cursor:default;"><div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" stroke="var(--text-sec)" stroke-width="3" fill="none" stroke-linecap="round"><line x1="6" y1="12" x2="18" y2="12"/></svg></div><span class="habit-name">${escHtml(g.text)}</span></div>`).join('');
  }
  function markToday(type) {
    const s = StateModule.get(); const today = StreakModule.todayStr();
    if (type === 'gym') {
      if (!s.gymDays.includes(today)) { s.gymDays.push(today); XPModule.addXP(50, 100); UIModule.toast('+50 XP — ¡Gran trabajo!', 'success'); haptic(); } 
      else { UIModule.toast('Ya registraste un entreno hoy', 'info'); }
    } else {
      if (!s.restDays.includes(today) && !s.gymDays.includes(today)) { s.restDays.push(today); XPModule.addXP(30, 50); UIModule.toast('+30 XP — Descanso registrado', 'info'); haptic(); } 
      else { UIModule.toast('Ya registraste un día hoy', 'info'); }
    }
    StateModule.save(); render(); ConstanciaModule.render();
  }
  return { render, markToday };
})();

/* ─────────────────────────────────────────────
   HABITS & GOALS MODULE
   ───────────────────────────────────────────── */
const HabitsModule = (() => {
  function render() {
    const s = StateModule.get(); const todayStr = StreakModule.todayStr(); const list = document.getElementById('habits-list');
    list.innerHTML = s.tasks.map((t, i) => {
      const done = t.completedDates && t.completedDates.includes(todayStr);
      return `<div class="active-item-card"><div class="habit-check ${done ? 'done' : ''}" data-hi="${i}"><svg width="14" height="14" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="habit-name ${done ? 'done' : ''}">${escHtml(t.name)}</span><button class="ai-del" data-del-h="${i}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--text-sec)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
    }).join('');
    list.querySelectorAll('.habit-check').forEach(el => el.addEventListener('click', (e) => {
      el.classList.add('anim-pop');
      setTimeout(() => toggleHabit(+el.dataset.hi), 200);
    }));
    list.querySelectorAll('[data-del-h]').forEach(el => el.addEventListener('click', () => { UIModule.confirm('¿Eliminar tarea?', () => { s.tasks.splice(+el.dataset.delH, 1); StateModule.save(); render(); DashboardModule.render(); }); }));
  }
  function toggleHabit(i) {
    const s = StateModule.get(); const todayStr = StreakModule.todayStr(); const task = s.tasks[i];
    if (!task.completedDates) task.completedDates = []; const idx = task.completedDates.indexOf(todayStr);
    if (idx === -1) { task.completedDates.push(todayStr); XPModule.addXP(10, 20); haptic(); } else { task.completedDates.splice(idx, 1); }
    StateModule.save(); render(); DashboardModule.render(); ConstanciaModule.render();
  }
  function addHabit(name) {
    if (!name.trim()) return;
    StateModule.get().tasks.push({ name: name.trim(), completedDates: [] }); StateModule.save(); render(); DashboardModule.render(); UIModule.toast('Tarea añadida', 'success');
  }
  return { render, addHabit, toggleHabit };
})();

const GoalsModule = (() => {
  function render() {
    const s = StateModule.get(); const list = document.getElementById('goals-list');
    list.innerHTML = s.goals.map((g, i) => `<div class="active-item-card"><div style="flex:1"><div style="font-size:14px;font-weight:700;">${escHtml(g.text)}</div>${g.date ? `<div style="font-size:12px;color:var(--text-sec);margin-top:4px;">Límite: ${formatDate(g.date)}</div>` : ''}</div><button class="ai-del" data-del-g="${i}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--text-sec)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`).join('');
    list.querySelectorAll('[data-del-g]').forEach(el => el.addEventListener('click', () => { UIModule.confirm('¿Eliminar meta?', () => { s.goals.splice(+el.dataset.delG, 1); StateModule.save(); render(); DashboardModule.render(); }); }));
  }
  function addGoal(text, date) {
    if (!text.trim()) return;
    StateModule.get().goals.push({ text: text.trim(), date: date || null }); StateModule.save(); render(); DashboardModule.render(); UIModule.toast('Meta añadida', 'success');
  }
  return { render, addGoal };
})();

/* ─────────────────────────────────────────────
   POMODORO MODULE
   ───────────────────────────────────────────── */
const PomodoroModule = (() => {
  let timer = null, timeLeft = 25 * 60, isRunning = false, currentDuration = 25 * 60;
  function init() {
    document.getElementById('pomo-btn-start').addEventListener('click', start);
    document.getElementById('pomo-btn-pause').addEventListener('click', pause);
    document.getElementById('pomo-btn-reset').addEventListener('click', reset);
    document.getElementById('pomo-btn-break').addEventListener('click', startBreak);
    const slider = document.getElementById('pomo-slider');
    slider.addEventListener('input', (e) => {
      if (isRunning) return;
      document.getElementById('pomo-slider-val').textContent = e.target.value + ' min';
      currentDuration = parseInt(e.target.value) * 60;
      timeLeft = currentDuration; updateDisplay();
    });
    updateDisplay();
  }
  function start() {
    if (isRunning) return; isRunning = true;
    document.getElementById('pomo-btn-start').style.display = 'none';
    document.getElementById('pomo-btn-pause').style.display = 'flex';
    document.getElementById('pomo-slider').disabled = true; document.getElementById('pomo-slider').style.opacity = '0.5';
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') Notification.requestPermission();
    timer = setInterval(() => { timeLeft--; updateDisplay(); if (timeLeft <= 0) { completeTimer(); } }, 1000);
  }
  function pause() {
    if (!isRunning) return; isRunning = false; clearInterval(timer);
    document.getElementById('pomo-btn-start').style.display = 'flex';
    document.getElementById('pomo-btn-pause').style.display = 'none';
  }
  function reset() {
    pause(); timeLeft = currentDuration; document.getElementById('pomo-break-opts').style.display = 'none';
    document.getElementById('pomo-slider').disabled = false; document.getElementById('pomo-slider').style.opacity = '1'; updateDisplay();
  }
  function startBreak() {
    currentDuration = 5 * 60; reset(); start(); document.getElementById('pomo-break-opts').style.display = 'none';
    document.getElementById('pomo-slider').value = 5; document.getElementById('pomo-slider-val').textContent = '5 min';
  }
  function completeTimer() {
    pause(); haptic();
    if ('Notification' in window && Notification.permission === 'granted') { new Notification('¡Tiempo terminado!', { body: currentDuration === 5 * 60 ? 'El descanso ha terminado. ¡A trabajar!' : 'Tu pomodoro ha terminado. Tómate un descanso.', icon: 'logo.png' }); }
    UIModule.toast('¡Tiempo terminado!', 'success');
    if (currentDuration !== 5 * 60) { document.getElementById('pomo-break-opts').style.display = 'flex'; }
  }
  function updateDisplay() {
    const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
    document.getElementById('pomo-timer').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return { init };
})();

/* ─────────────────────────────────────────────
   COMMUNITY & SETTINGS MODULES
   ───────────────────────────────────────────── */
const CommunityModule = (() => {
  function render() { renderLeague(); renderFriends(); }
  function renderLeague() {
    const s = StateModule.get(); document.getElementById('league-icon').textContent = LEAGUE_ICONS[s.league] || '🥉';
    document.getElementById('league-name').textContent = `Liga ${s.league}`;
    const now = new Date(); const daysUntilMon = (8 - now.getDay()) % 7 || 7;
    document.getElementById('league-sub').textContent = `${daysUntilMon} día${daysUntilMon !== 1 ? 's' : ''} hasta el reinicio`;
    
    const users = s.leagueSimulatedUsers.map(u => ({ ...u, isMe: false })); 
    
    // Alineado de XP para que sea el número global del usuario
    users.push({ name: 'Tú', xp: s.xp, isMe: true });
    
    users.sort((a, b) => b.xp - a.xp);
    document.getElementById('leaderboard').innerHTML = users.map((u, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankStr = i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`;
      return `<div class="lb-item ${u.isMe ? 'me' : ''}"><div class="lb-rank ${rankClass}">${rankStr}</div><div class="lb-avatar">${(u.name||'U').charAt(0)}</div><div class="lb-name">${escHtml(u.name)}${u.isMe ? ' (tú)' : ''}</div><div class="lb-xp">${u.xp} XP</div></div>`;
    }).join('');
  }
  function renderFriends() {
    const s = StateModule.get(); document.getElementById('friend-code-display').textContent = s.friendCode; const list = document.getElementById('friends-list');
    if (!s.friends.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-sec);font-weight:600">Añade amigos con su código</div>'; return; }
    list.innerHTML = s.friends.map((f, i) => `<div class="friend-item"><div class="fi-avatar">${(f.name || f.code).charAt(0).toUpperCase()}</div><div class="fi-info"><div class="fi-code">${escHtml(f.name || f.code)}</div><div class="fi-xp">${f.xp || 0} XP esta semana</div></div><button class="fi-del" data-del="${i}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--danger)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`).join('');
    list.querySelectorAll('[data-del]').forEach(el => el.addEventListener('click', () => { s.friends.splice(+el.dataset.del, 1); StateModule.save(); renderFriends(); }));
  }
  function addFriend(code) {
    const s = StateModule.get(); code = code.trim().toUpperCase();
    if (code.length !== 8) { UIModule.toast('Código inválido (8 caracteres)', 'error'); return; }
    if (code === s.friendCode) { UIModule.toast('Ese es tu propio código', 'error'); return; }
    if (s.friends.find(f => f.code === code)) { UIModule.toast('Amigo ya añadido', 'info'); return; }
    
    // Solicitar nombre personalizado al usuario
    let customName = prompt("Introduce un nombre para este amigo:");
    if (!customName || !customName.trim()) { customName = "Amigo"; }

    s.friends.push({ code, name: customName, xp: Math.floor(Math.random() * 500) + 50 }); 
    StateModule.save(); renderFriends(); UIModule.toast('Amigo añadido', 'success');
  }
  return { render, renderLeague, renderFriends, addFriend };
})();

const SettingsModule = (() => {
  function init() {
    const s = StateModule.get(); const set = s.settings;
    document.getElementById('weight-unit-select').value = set.weightUnit; document.getElementById('rest-duration-select').value = set.restDuration;
    document.getElementById('haptics-toggle').checked = set.haptics; document.getElementById('notif-toggle').checked = set.notifications.enabled;
    document.getElementById('notif-time-input').value = set.notifications.time; document.getElementById('theme-toggle').checked = set.theme === 'dark';
    document.getElementById('notif-time-row').style.display = set.notifications.enabled ? 'flex' : 'none'; applyTheme(set.theme);
  }
  function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme); }
  function exportData() {
    const blob = new Blob([JSON.stringify(StateModule.get(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `zenit_backup_${StreakModule.todayStr()}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function importData(file) {
    const reader = new FileReader(); reader.onload = e => { try { StateModule.set(JSON.parse(e.target.result)); renderAll(); UIModule.toast('Importado', 'success'); } catch { UIModule.toast('Archivo inválido', 'error'); } }; reader.readAsText(file);
  }
  let delTimer = null, delCount = 0;
  function deleteAllData() {
    delCount++;
    if (delCount === 1) { UIModule.toast('Pulsa de nuevo para confirmar', 'error', 3000); delTimer = setTimeout(() => { delCount = 0; }, 3000); }
    else { clearTimeout(delTimer); delCount = 0; localStorage.removeItem('zenit_state'); StateModule.load(); renderAll(); UIModule.toast('Datos borrados', 'info'); }
  }
  return { init, applyTheme, exportData, importData, deleteAllData };
})();

const EnergyModule = (() => {
  const FACES = [ { l: 'Exhausto', c: '#E53935' }, { l: 'Cansado', c: '#FB8C00' }, { l: 'Normal', c: '#FDD835' }, { l: 'Energético', c: '#7CB342' }, { l: 'Eufórico', c: '#43A047' } ];
  function open() {
    const faces = document.getElementById('energy-faces');
    faces.innerHTML = FACES.map((f, i) => `<div class="energy-face" data-level="${i}"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="${f.c}" opacity=".9"/><circle cx="22" cy="24" r="3" fill="#fff"/><circle cx="38" cy="24" r="3" fill="#fff"/>${i === 0 ? `<path d="M20 42 Q30 34 40 42" stroke="#fff" stroke-width="2.5" fill="none"/>` : i === 1 ? `<path d="M20 40 Q30 36 40 40" stroke="#fff" stroke-width="2.5" fill="none"/>` : i === 2 ? `<line x1="20" y1="39" x2="40" y2="39" stroke="#fff" stroke-width="2.5"/>` : i === 3 ? `<path d="M20 38 Q30 44 40 38" stroke="#fff" stroke-width="2.5" fill="none"/>` : `<path d="M18 36 Q30 48 42 36" stroke="#fff" stroke-width="2.5" fill="none"/>`}</svg><span>${f.l}</span></div>`).join('');
    faces.querySelectorAll('.energy-face').forEach(el => el.addEventListener('click', () => close(+el.dataset.level)));
    UIModule.openModal('energy-modal');
  }
  function close(level) {
    UIModule.closeModal('energy-modal');
    if (level !== undefined) { UIModule.toast(`Energía registrada: ${FACES[level].l}`, 'success'); XPModule.addXP(50, 100); }
  }
  return { open, close };
})();

const NotifModule = (() => {
  async function requestAndSchedule(enabled, time) {
    if (!enabled) return;
    if (!('Notification' in window)) { UIModule.toast('No soportado', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { UIModule.toast('Permiso denegado', 'error'); return; }
    const s = StateModule.get(); const today = StreakModule.todayStr();
    const hasTrainedToday = s.gymDays.includes(today) || s.restDays.includes(today);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) { navigator.serviceWorker.controller.postMessage({ type: 'SCHEDULE_NOTIFICATION', time, hasTrainedToday }); }
    UIModule.toast('Recordatorio configurado', 'success');
  }
  return { requestAndSchedule };
})();

/* ─────────────────────────────────────────────
   ROUTINE MODULE
   ───────────────────────────────────────────── */
const RoutineModule = (() => {
  let currentEditorIndex = -1, editorMode = 'days', restTimerInterval = null, restSeconds = 0;
  function renderDayList() {
    const s = StateModule.get(); const list = document.getElementById('routine-days-view');
    list.innerHTML = s.weeklyRoutine.map((d, i) => `<div class="routine-list-item" data-day="${i}"><span class="rli-name">${d.day}</span><span class="rli-status ${d.exercises.length ? 'rutina' : 'descanso'}">${d.exercises.length ? 'Rutina >' : 'Descanso >'}</span></div>`).join('');
    list.querySelectorAll('.routine-list-item').forEach(el => el.addEventListener('click', () => openEditor(+el.dataset.day, 'days')));
  }
  function renderGroupList() {
    const s = StateModule.get(); const list = document.getElementById('routine-groups-view');
    list.innerHTML = s.muscleRoutine.map((g, i) => `<div class="routine-list-item" data-group="${i}"><span class="rli-name">${escHtml(g.name)}</span><span class="rli-status ${g.exercises.length ? 'rutina' : 'descanso'}">${g.exercises.length ? 'Rutina >' : 'Descanso >'}</span></div>`).join('');
    list.querySelectorAll('.routine-list-item').forEach(el => el.addEventListener('click', () => openEditor(+el.dataset.group, 'groups')));
  }
  function openEditor(idx, mode) {
    currentEditorIndex = idx; editorMode = mode; const s = StateModule.get(); const item = mode === 'days' ? s.weeklyRoutine[idx] : s.muscleRoutine[idx];
    document.getElementById('editor-title').textContent = item.day || item.name;
    const editor = document.getElementById('routine-editor'); editor.style.display = 'flex'; requestAnimationFrame(() => editor.classList.add('open'));
    renderExercises(item.exercises);
  }
  function closeEditor() { const editor = document.getElementById('routine-editor'); editor.classList.remove('open'); setTimeout(() => { editor.style.display = 'none'; }, 350); stopRestTimer(); }
  function getCurrentItem() { return editorMode === 'days' ? StateModule.get().weeklyRoutine[currentEditorIndex] : StateModule.get().muscleRoutine[currentEditorIndex]; }

  function renderExercises(exercises) {
    const list = document.getElementById('exercise-list'); const s = StateModule.get();
    list.innerHTML = exercises.map((ex, ei) => {
      const history = s.exerciseHistory[ex.name]; const lastStr = history && history.length ? `Última vez: ${formatDate(history[history.length - 1].date)}` : 'Sin historial aún';
      const sets = ex.sets.map((set, si) => `
        <div class="set-row ${set.done ? 'done' : ''}"><div class="set-num">${si + 1}</div><input class="set-input" type="number" value="${set.weight}" data-field="weight" data-ei="${ei}" data-si="${si}"/><input class="set-input" type="number" value="${set.reps}" data-field="reps" data-ei="${ei}" data-si="${si}"/><select class="rpe-select" data-field="rpe" data-ei="${ei}" data-si="${si}">${[6,7,7.5,8,8.5,9,9.5,10].map(r => `<option ${set.rpe == r ? 'selected' : ''}>${r}</option>`).join('')}</select><div class="set-check ${set.done ? 'done' : ''}" data-ei="${ei}" data-si="${si}"><svg width="14" height="14" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="set-del" data-ei="${ei}" data-si="${si}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--text-sec)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>`).join('');
      return `<div class="exercise-card"><div class="exercise-header"><div class="ex-name">${escHtml(ex.name)}</div><div class="ex-actions"><button class="ex-action-btn danger" data-del-ex="${ei}"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--danger)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><div class="ex-history">${lastStr}</div><div class="sets-header"><span>#</span><span style="text-align:center">Peso</span><span style="text-align:center">Reps</span><span>RPE</span><span></span></div>${sets}<button class="add-set-btn" data-ei="${ei}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> Añadir serie</button></div>`;
    }).join('');
    bindEditorEvents(); updateVolume();
  }
  function bindEditorEvents() {
    const list = document.getElementById('exercise-list');
    list.querySelectorAll('.set-input,.rpe-select').forEach(input => { input.addEventListener('change', e => { const { ei, si, field } = e.target.dataset; const set = getCurrentItem().exercises[+ei].sets[+si]; set[field] = parseFloat(e.target.value) || 0; StateModule.save(); updateVolume(); }); });
    list.querySelectorAll('.set-check').forEach(el => { el.addEventListener('click', () => { const ei = +el.dataset.ei, si = +el.dataset.si; const item = getCurrentItem(); const set = item.exercises[ei].sets[si]; set.done = !set.done; StateModule.save(); renderExercises(item.exercises); if (set.done) { haptic(); startRestTimer(); } }); });
    list.querySelectorAll('.set-del').forEach(el => { el.addEventListener('click', () => { const ei = +el.dataset.ei, si = +el.dataset.si; const item = getCurrentItem(); item.exercises[ei].sets.splice(si, 1); StateModule.save(); renderExercises(item.exercises); }); });
    list.querySelectorAll('.add-set-btn').forEach(btn => { btn.addEventListener('click', () => { const ei = +btn.dataset.ei; const item = getCurrentItem(); const lastSet = item.exercises[ei].sets.slice(-1)[0]; item.exercises[ei].sets.push({ weight: lastSet ? lastSet.weight : 0, reps: lastSet ? lastSet.reps : 10, rpe: lastSet ? lastSet.rpe : 8, done: false }); StateModule.save(); renderExercises(item.exercises); }); });
    list.querySelectorAll('[data-del-ex]').forEach(btn => { btn.addEventListener('click', () => { const ei = +btn.dataset.delEx; UIModule.confirm('¿Eliminar este ejercicio?', () => { const item = getCurrentItem(); item.exercises.splice(ei, 1); StateModule.save(); renderExercises(item.exercises); }); }); });
  }
  function updateVolume() { const item = getCurrentItem(); const s = StateModule.get(); let total = 0; item.exercises.forEach(ex => { ex.sets.forEach(set => { if (set.done) total += (set.weight || 0) * (set.reps || 0); }); }); document.getElementById('vol-value').textContent = `${total.toFixed(0)} ${s.settings.weightUnit}`; }
  function saveRoutine() {
    const item = getCurrentItem(); const s = StateModule.get(); const today = StreakModule.todayStr();
    item.exercises.forEach(ex => {
      const doneSets = ex.sets.filter(set => set.done);
      if (doneSets.length) {
        if (!s.exerciseHistory[ex.name]) s.exerciseHistory[ex.name] = [];
        const best = doneSets.reduce((b, c) => (c.weight * c.reps > b.weight * b.reps ? c : b));
        s.exerciseHistory[ex.name].push({ date: today, weight: best.weight, reps: best.reps });
        if (!s.recentExercises.includes(ex.name)) { s.recentExercises.unshift(ex.name); if (s.recentExercises.length > 5) s.recentExercises.pop(); }
      }
    });
    if (!s.gymDays.includes(today)) { s.gymDays.push(today); XPModule.addXP(50, 100); }
    StateModule.save(); EnergyModule.open(); DashboardModule.render(); ConstanciaModule.render();
  }
  function startRestTimer() {
    const s = StateModule.get(); restSeconds = s.settings.restDuration; stopRestTimer();
    const el = document.getElementById('rest-timer'); el.classList.add('show'); updateRestDisplay();
    restTimerInterval = setInterval(() => { restSeconds--; updateRestDisplay(); if (restSeconds <= 0) { stopRestTimer(); haptic(); UIModule.toast('¡Descanso terminado!', 'info'); } }, 1000);
  }
  function stopRestTimer() { if (restTimerInterval) clearInterval(restTimerInterval); document.getElementById('rest-timer').classList.remove('show'); }
  function updateRestDisplay() { const m = Math.floor(restSeconds / 60), s = restSeconds % 60; document.getElementById('rest-countdown').textContent = `${m}:${s.toString().padStart(2, '0')}`; }
  function render() { renderDayList(); renderGroupList(); }
  return { render, openEditor, closeEditor, saveRoutine, stopRestTimer };
})();

const ExerciseSheetModule = (() => {
  let activeFilter = 'Todos';
  function open() {
    renderChips(); renderExercises(); document.getElementById('exercise-sheet-overlay').classList.add('open');
    const sheet = document.getElementById('exercise-sheet'); sheet.style.display = 'flex'; requestAnimationFrame(() => sheet.classList.add('open'));
  }
  function close() { document.getElementById('exercise-sheet-overlay').classList.remove('open'); const sheet = document.getElementById('exercise-sheet'); sheet.classList.remove('open'); setTimeout(() => { sheet.style.display = ''; }, 350); }
  function renderChips() { const wrap = document.getElementById('filter-chips'); wrap.innerHTML = MUSCLE_FILTERS.map(f => `<div class="chip ${f === activeFilter ? 'active' : ''}" data-filter="${f}">${f}</div>`).join(''); wrap.querySelectorAll('.chip').forEach(c => { c.addEventListener('click', () => { activeFilter = c.dataset.filter; renderChips(); renderExercises(); }); }); }
  function renderExercises() {
    const s = StateModule.get(); const query = (document.getElementById('ex-search').value || '').toLowerCase(); const container = document.getElementById('sheet-exercises'); let html = '';
    const filtered = EXERCISE_DB.filter(e => (activeFilter === 'Todos' || e.muscle === activeFilter) && (!query || e.name.toLowerCase().includes(query)));
    const groups = {}; filtered.forEach(e => { if (!groups[e.muscle]) groups[e.muscle] = []; groups[e.muscle].push(e); });
    Object.entries(groups).forEach(([muscle, exs]) => {
      if (activeFilter === 'Todos') html += `<div class="ex-group-title">${muscle}</div>`;
      exs.forEach(e => { html += `<div class="ex-list-item" data-name="${escHtml(e.name)}"><div class="eli-name">${escHtml(e.name)}</div><svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="var(--pri)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></div>`; });
    });
    if (!filtered.length) html = '<div style="padding:20px;text-align:center;color:var(--text-sec);">No se encontraron ejercicios</div>'; container.innerHTML = html;
    container.querySelectorAll('.ex-list-item').forEach(el => { el.addEventListener('click', () => { addExercise(el.dataset.name); close(); }); });
  }
  function addExercise(name) {
    const s = StateModule.get(); const editorTitle = document.getElementById('editor-title').textContent;
    const dayIdx = s.weeklyRoutine.findIndex(d => d.day === editorTitle); const groupIdx = s.muscleRoutine.findIndex(g => g.name === editorTitle);
    let targetExercises; if (dayIdx >= 0) targetExercises = s.weeklyRoutine[dayIdx].exercises; else if (groupIdx >= 0) targetExercises = s.muscleRoutine[groupIdx].exercises; else return;
    targetExercises.push({ name, sets: [{ weight: 0, reps: 10, rpe: 8, done: false }] });
    if (!s.recentExercises.includes(name)) { s.recentExercises.unshift(name); if (s.recentExercises.length > 5) s.recentExercises.pop(); }
    StateModule.save(); RoutineModule.openEditor(dayIdx >= 0 ? dayIdx : groupIdx, dayIdx >= 0 ? 'days' : 'groups'); UIModule.toast(`${name} añadido`, 'success');
  }
  function openCustomModal() { close(); UIModule.openModal('custom-ex-modal'); document.getElementById('custom-ex-input').value = ''; }
  return { open, close, renderExercises, openCustomModal };
})();

/* ─────────────────────────────────────────────
   CONSTANCIA MODULE (HEATMAP ACTUALIZADO)
   ───────────────────────────────────────────── */
const ConstanciaModule = (() => {
  const WEEKS = 25; 
  
  function startOfWeek(d) {
    const date = new Date(d); date.setHours(0, 0, 0, 0);
    const dow = (date.getDay() + 6) % 7; date.setDate(date.getDate() - dow);
    return date;
  }

  function render() {
    const s = StateModule.get();
    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = StreakModule.dateToStr(today);

    /* ---- HEATMAP DE ACTIVIDAD CONTINUA ---- */
    const currentWeekStart = startOfWeek(today);

    const grid = document.getElementById('heatmap-grid'); grid.innerHTML = '';
    const monthsContainer = document.getElementById('heatmap-months'); monthsContainer.innerHTML = '';

    let currentMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const col = document.createElement('div'); col.className = 'heatmap-col';
      const colStartDate = new Date(currentWeekStart);
      colStartDate.setDate(colStartDate.getDate() - w * 7);

      if (colStartDate.getMonth() !== currentMonth) {
        currentMonth = colStartDate.getMonth();
        const monthLabel = document.createElement('div');
        monthLabel.className = 'heatmap-month-label';
        monthLabel.textContent = MONTHS_SHORT[currentMonth];
        monthLabel.style.left = `${w * 18}px`; 
        monthsContainer.appendChild(monthLabel);
      }

      for (let d = 0; d < 7; d++) {
        const date = new Date(colStartDate); date.setDate(date.getDate() + d);
        const str = StreakModule.dateToStr(date);
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        if (date > today) {
          cell.classList.add('future');
        } else {
          let tasksDone = s.tasks.filter(t => t.completedDates && t.completedDates.includes(str)).length;
          let trainingDone = (s.gymDays.includes(str) || s.restDays.includes(str)) ? 1 : 0;
          let totalActivities = tasksDone + trainingDone;

          if (totalActivities === 0) {
            cell.classList.add('level-0');
          } else {
            cell.classList.add('level-active');
          }

          if (str === todayStr) cell.classList.add('today');

          const activityText = totalActivities === 1 ? '1 actividad' : `${totalActivities} actividades`;
          const tooltipText = `${date.getDate()} de ${MONTHS[date.getMonth()]}: ${activityText}`;

          cell.addEventListener('mouseenter', (e) => TooltipModule.show(e, tooltipText));
          cell.addEventListener('mouseleave', TooltipModule.hide);
          cell.addEventListener('touchstart', (e) => { e.preventDefault(); TooltipModule.show(e.touches[0], tooltipText); });
          cell.addEventListener('touchend', TooltipModule.hide);
        }
        col.appendChild(cell);
      }
      grid.appendChild(col);
    }

    setTimeout(() => {
      const scrollEl = document.getElementById('heatmap-scroll');
      if(scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth;
    }, 50);

    /* ---- RACHA ACTUAL / MÁXIMA ---- */
    const { streak, maxStreak } = StreakModule.compute();
    document.getElementById('stat-streak-current').textContent = `${streak} ${streak === 1 ? 'día' : 'días'}`;
    document.getElementById('stat-streak-max').textContent = `Máxima: ${maxStreak}`;

    /* ---- MEDIDOR DE CONSTANCIA ---- */
    let activeLast30 = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i); const str = StreakModule.dateToStr(d);
      if (s.gymDays.includes(str) || s.restDays.includes(str)) activeLast30++;
    }
    const pct = Math.round((activeLast30 / 30) * 100); const ARC = 157.08;
    document.getElementById('gauge-fill').style.strokeDashoffset = (ARC - (ARC * pct / 100)).toFixed(2);
    document.getElementById('gauge-label').textContent = pct >= 70 ? 'Alta' : pct >= 40 ? 'Media' : 'Baja';

    /* ---- RESUMEN DE LOS ÚLTIMOS MESES ---- */
    const monthIdx = now.getMonth(), yearNow = now.getFullYear();
    const currentMonthGymCount = s.gymDays.filter(str => { const d = new Date(str); return d.getMonth() === monthIdx && d.getFullYear() === yearNow; }).length;
    document.getElementById('ms-checkins').textContent = `${currentMonthGymCount} entrenamiento${currentMonthGymCount === 1 ? '' : 's'}`;

    // Obtener información de los últimos 6 meses
    const pastMonths = [];
    for(let i = 5; i >= 0; i--) {
        pastMonths.push(new Date(yearNow, monthIdx - i, 1));
    }

    const counts = pastMonths.map(mDate => {
      return s.gymDays.filter(str => {
          const d = new Date(str);
          return d.getMonth() === mDate.getMonth() && d.getFullYear() === mDate.getFullYear();
      }).length;
    });
    
    const maxCount = Math.max(1, ...counts);
    const barsEl = document.getElementById('ms-bars'); barsEl.innerHTML = '';
    
    pastMonths.forEach((mDate, i) => {
      const bar = document.createElement('div');
      bar.className = 'ms-bar' + (i === 5 ? ' current' : '');
      bar.style.height = `${Math.max(8, (counts[i] / maxCount) * 100)}%`;
      
      // Asignar los tooltips dinámicos a cada barra mensual SIN EL AÑO
      const textEntrenamientos = counts[i] === 1 ? '1 entrenamiento' : `${counts[i]} entrenamientos`;
      const tooltipText = `${MONTHS[mDate.getMonth()]}: ${textEntrenamientos}`;
      
      bar.addEventListener('mouseenter', (e) => TooltipModule.show(e, tooltipText));
      bar.addEventListener('mouseleave', TooltipModule.hide);
      bar.addEventListener('touchstart', (e) => { e.preventDefault(); TooltipModule.show(e.touches[0], tooltipText); });
      bar.addEventListener('touchend', TooltipModule.hide);

      barsEl.appendChild(bar);
    });
    
  }

  function init() {}
  return { init, render };
})();

/* ─────────────────────────────────────────────
   UTILITIES & BINDINGS
   ───────────────────────────────────────────── */
function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function formatDate(str) { if (!str) return ''; const [y, m, d] = str.split('-'); return `${d}/${m}/${y}`; }
function haptic() { if (StateModule.get().settings.haptics && navigator.vibrate) navigator.vibrate(50); }

function renderAll() { DashboardModule.render(); RoutineModule.render(); HabitsModule.render(); GoalsModule.render(); ConstanciaModule.render(); SettingsModule.init(); CommunityModule.render(); }

const NavModule = (() => {
  function init() { document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', () => navigateTo(item.dataset.page)); }); }
  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
    document.getElementById('main-content').scrollTop = 0;
  }
  return { init, navigateTo };
})();

function bindEvents() {
  document.getElementById('avatar-btn').addEventListener('click', UIModule.openSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', UIModule.closeSidebar);
  
  // Modals & Sidebar
  document.getElementById('open-community').addEventListener('click', () => { UIModule.closeSidebar(); CommunityModule.render(); UIModule.openModal('modal-community'); });
  document.getElementById('open-settings-menu').addEventListener('click', () => { UIModule.closeSidebar(); SettingsModule.init(); UIModule.openModal('modal-settings'); });
  document.getElementById('close-community').addEventListener('click', () => UIModule.closeModal('modal-community'));
  document.getElementById('close-settings').addEventListener('click', () => UIModule.closeModal('modal-settings'));

  document.querySelectorAll('.comm-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.comm-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.comm-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active'); document.getElementById(`pane-${tab.dataset.pane}`).classList.add('active');
    });
  });

  document.getElementById('copy-code-btn').addEventListener('click', () => { navigator.clipboard.writeText(StateModule.get().friendCode).then(() => UIModule.toast('Copiado', 'success')); });
  document.getElementById('add-friend-btn').addEventListener('click', () => { CommunityModule.addFriend(document.getElementById('friend-code-input').value); document.getElementById('friend-code-input').value = ''; });

  // Settings Events
  document.getElementById('weight-unit-select').addEventListener('change', e => { StateModule.saveField('settings.weightUnit', e.target.value); });
  document.getElementById('rest-duration-select').addEventListener('change', e => { StateModule.saveField('settings.restDuration', +e.target.value); });
  document.getElementById('haptics-toggle').addEventListener('change', e => { StateModule.saveField('settings.haptics', e.target.checked); });
  document.getElementById('theme-toggle').addEventListener('change', e => { const t = e.target.checked ? 'dark' : 'light'; StateModule.saveField('settings.theme', t); SettingsModule.applyTheme(t); });
  document.getElementById('notif-toggle').addEventListener('change', async e => { StateModule.saveField('settings.notifications.enabled', e.target.checked); document.getElementById('notif-time-row').style.display = e.target.checked ? 'flex' : 'none'; if(e.target.checked) NotifModule.requestAndSchedule(true, document.getElementById('notif-time-input').value); });
  document.getElementById('export-data-btn').addEventListener('click', SettingsModule.exportData);
  document.getElementById('import-data-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
  document.getElementById('import-file-input').addEventListener('change', e => { if(e.target.files[0]) SettingsModule.importData(e.target.files[0]); });
  document.getElementById('delete-data-btn').addEventListener('click', SettingsModule.deleteAllData);
  
  // Dashboard / Modificadas con animación pop-in manual
  document.getElementById('btn-trained').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => { this.classList.remove('anim-pop'); DashboardModule.markToday('gym'); }, 200);
  });
  document.getElementById('btn-rest').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => { this.classList.remove('anim-pop'); DashboardModule.markToday('rest'); }, 200);
  });
  
  // Metas Actions
  document.getElementById('habit-add-btn').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => { 
      this.classList.remove('anim-pop');
      HabitsModule.addHabit(document.getElementById('habit-input').value); 
      document.getElementById('habit-input').value = ''; 
    }, 200);
  });
  document.getElementById('goal-add-btn').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => {
      this.classList.remove('anim-pop');
      GoalsModule.addGoal(document.getElementById('goal-input').value, document.getElementById('goal-date-input').value); 
      document.getElementById('goal-input').value = ''; 
      document.getElementById('goal-date-input').value = '';
    }, 200);
  });
  
  // Rutina Editor & Toggle
  document.getElementById('view-days').addEventListener('click', () => { document.getElementById('view-days').classList.add('active'); document.getElementById('view-groups').classList.remove('active'); document.getElementById('routine-days-view').style.display = 'block'; document.getElementById('routine-groups-view').style.display = 'none'; });
  document.getElementById('view-groups').addEventListener('click', () => { document.getElementById('view-groups').classList.add('active'); document.getElementById('view-days').classList.remove('active'); document.getElementById('routine-days-view').style.display = 'none'; document.getElementById('routine-groups-view').style.display = 'block'; });
  document.getElementById('editor-back').addEventListener('click', () => RoutineModule.closeEditor());
  document.getElementById('save-routine-btn').addEventListener('click', () => RoutineModule.saveRoutine());
  document.getElementById('add-exercise-btn').addEventListener('click', () => ExerciseSheetModule.open());
  document.getElementById('exercise-sheet-overlay').addEventListener('click', () => ExerciseSheetModule.close());
  document.getElementById('ex-search').addEventListener('input', () => ExerciseSheetModule.renderExercises());
  document.getElementById('sheet-custom-btn').addEventListener('click', () => ExerciseSheetModule.openCustomModal());
  
  document.getElementById('custom-ex-confirm').addEventListener('click', () => {
    const name = document.getElementById('custom-ex-input').value.trim(); if (!name) return;
    UIModule.closeModal('custom-ex-modal'); EXERCISE_DB.push({ name, muscle: 'Personalizado' });
    const s = StateModule.get(); const editorTitle = document.getElementById('editor-title').textContent;
    const dayIdx = s.weeklyRoutine.findIndex(d => d.day === editorTitle); const groupIdx = s.muscleRoutine.findIndex(g => g.name === editorTitle);
    if (dayIdx >= 0) s.weeklyRoutine[dayIdx].exercises.push({ name, sets: [{ weight: 0, reps: 10, rpe: 8, done: false }] });
    else if (groupIdx >= 0) s.muscleRoutine[groupIdx].exercises.push({ name, sets: [{ weight: 0, reps: 10, rpe: 8, done: false }] });
    StateModule.save(); RoutineModule.openEditor(dayIdx >= 0 ? dayIdx : groupIdx, dayIdx >= 0 ? 'days' : 'groups'); UIModule.toast(`${name} añadido`, 'success');
  });

  document.getElementById('skip-rest-btn').addEventListener('click', () => RoutineModule.stopRestTimer());

  // Intervalo ligas
  setInterval(() => {
    const s = StateModule.get();
    s.leagueSimulatedUsers.forEach(u => { u.xp += Math.floor(Math.random() * 20); });
    StateModule.save();
  }, 60000 * 30);
}

document.addEventListener('DOMContentLoaded', () => {
  StateModule.load();
  ConstanciaModule.init();
  TooltipModule.init(); 
  PomodoroModule.init();
  UIModule.updateAuthUI(null);
  bindEvents(); NavModule.init();
  renderAll();
  setTimeout(() => { document.getElementById('splash').classList.add('hidden'); document.getElementById('app').style.display = 'flex'; }, 1600);
});