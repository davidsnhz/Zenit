/* ================================================================
   ZENIT – app.js
   ================================================================ */
'use strict';

/* ─────────────────────────────────────────────
   FIREBASE CONFIG
   ───────────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBT3VAJmPW04PCM5pSSMWj7ADuEt354nIc",
  authDomain: "zenit-f3228.firebaseapp.com",
  projectId: "zenit-f3228",
  storageBucket: "zenit-f3228.firebasestorage.app",
  messagingSenderId: "260560043233",
  appId: "1:260560043233:web:8401db84fd24d0121c0ba0",
  measurementId: "G-6WBZBZVSHP"
};

/* ─────────────────────────────────────────────
   CONSTANTES
   ───────────────────────────────────────────── */
const SCHEMA_VERSION = 1;
const XP_PER_LEVEL = [0, 500, 1200, 2100, 3200, 4500, 6000, 7800, 9800, 12000, 15000];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const EXERCISE_DB = [
  // ---- Pecho ----
  { name: 'Press de Banca', muscle: 'Pecho', equip: 'Barra' },
  { name: 'Press Inclinado', muscle: 'Pecho', equip: 'Barra' },
  { name: 'Press Declinado', muscle: 'Pecho', equip: 'Barra' },
  { name: 'Press de Banca con Mancuernas', muscle: 'Pecho', equip: 'Mancuerna' },
  { name: 'Press Inclinado con Mancuernas', muscle: 'Pecho', equip: 'Mancuerna' },
  { name: 'Aperturas con Mancuernas', muscle: 'Pecho', equip: 'Mancuerna' },
  { name: 'Cruces en Polea', muscle: 'Pecho', equip: 'Polea' },
  { name: 'Contractor de Pecho', muscle: 'Pecho', equip: 'Máquina' },
  { name: 'Press en Máquina', muscle: 'Pecho', equip: 'Máquina' },
  { name: 'Fondos en Paralelas', muscle: 'Pecho', equip: 'Peso corp.' },
  { name: 'Flexiones', muscle: 'Pecho', equip: 'Peso corp.' },
  { name: 'Pullover con Mancuerna', muscle: 'Pecho', equip: 'Mancuerna' },
  // ---- Espalda ----
  { name: 'Peso Muerto', muscle: 'Espalda', equip: 'Barra' },
  { name: 'Dominadas', muscle: 'Espalda', equip: 'Peso corp.' },
  { name: 'Jalón al Pecho', muscle: 'Espalda', equip: 'Polea' },
  { name: 'Jalón Agarre Cerrado', muscle: 'Espalda', equip: 'Polea' },
  { name: 'Remo con Barra', muscle: 'Espalda', equip: 'Barra' },
  { name: 'Remo con Mancuerna', muscle: 'Espalda', equip: 'Mancuerna' },
  { name: 'Remo en Punta (T)', muscle: 'Espalda', equip: 'Barra' },
  { name: 'Remo en Polea Baja', muscle: 'Espalda', equip: 'Polea' },
  { name: 'Remo en Máquina', muscle: 'Espalda', equip: 'Máquina' },
  { name: 'Pull-over en Polea', muscle: 'Espalda', equip: 'Polea' },
  { name: 'Encogimientos (Trapecio)', muscle: 'Espalda', equip: 'Mancuerna' },
  { name: 'Face Pull', muscle: 'Espalda', equip: 'Polea' },
  { name: 'Hiperextensiones', muscle: 'Espalda', equip: 'Peso corp.' },
  // ---- Hombros ----
  { name: 'Press Militar', muscle: 'Hombros', equip: 'Barra' },
  { name: 'Press Militar con Mancuernas', muscle: 'Hombros', equip: 'Mancuerna' },
  { name: 'Press Arnold', muscle: 'Hombros', equip: 'Mancuerna' },
  { name: 'Elevaciones Laterales', muscle: 'Hombros', equip: 'Mancuerna' },
  { name: 'Elevaciones Laterales en Polea', muscle: 'Hombros', equip: 'Polea' },
  { name: 'Elevaciones Frontales', muscle: 'Hombros', equip: 'Mancuerna' },
  { name: 'Pájaros (Deltoide Post.)', muscle: 'Hombros', equip: 'Mancuerna' },
  { name: 'Deltoide Posterior en Máquina', muscle: 'Hombros', equip: 'Máquina' },
  { name: 'Press de Hombro en Máquina', muscle: 'Hombros', equip: 'Máquina' },
  { name: 'Remo al Mentón', muscle: 'Hombros', equip: 'Barra' },
  // ---- Bíceps ----
  { name: 'Curl con Barra', muscle: 'Bíceps', equip: 'Barra' },
  { name: 'Curl con Barra Z', muscle: 'Bíceps', equip: 'Barra' },
  { name: 'Curl con Mancuernas', muscle: 'Bíceps', equip: 'Mancuerna' },
  { name: 'Curl Alterno', muscle: 'Bíceps', equip: 'Mancuerna' },
  { name: 'Curl Martillo', muscle: 'Bíceps', equip: 'Mancuerna' },
  { name: 'Curl Concentrado', muscle: 'Bíceps', equip: 'Mancuerna' },
  { name: 'Curl en Banco Scott', muscle: 'Bíceps', equip: 'Barra' },
  { name: 'Curl en Polea', muscle: 'Bíceps', equip: 'Polea' },
  // ---- Tríceps ----
  { name: 'Press Francés', muscle: 'Tríceps', equip: 'Barra' },
  { name: 'Extensión en Polea', muscle: 'Tríceps', equip: 'Polea' },
  { name: 'Extensión sobre la Cabeza', muscle: 'Tríceps', equip: 'Mancuerna' },
  { name: 'Fondos entre Bancos', muscle: 'Tríceps', equip: 'Peso corp.' },
  { name: 'Patada de Tríceps', muscle: 'Tríceps', equip: 'Mancuerna' },
  { name: 'Press Cerrado', muscle: 'Tríceps', equip: 'Barra' },
  { name: 'Extensión con Cuerda', muscle: 'Tríceps', equip: 'Polea' },
  // ---- Piernas ----
  { name: 'Sentadilla Libre', muscle: 'Piernas', equip: 'Barra' },
  { name: 'Sentadilla Frontal', muscle: 'Piernas', equip: 'Barra' },
  { name: 'Prensa de Pierna', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Extensión de Cuádriceps', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Curl Femoral Tumbado', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Curl Femoral Sentado', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Zancadas', muscle: 'Piernas', equip: 'Mancuerna' },
  { name: 'Sentadilla Búlgara', muscle: 'Piernas', equip: 'Mancuerna' },
  { name: 'Sentadilla Hack', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Peso Muerto Rumano', muscle: 'Piernas', equip: 'Barra' },
  { name: 'Sentadilla Goblet', muscle: 'Piernas', equip: 'Mancuerna' },
  { name: 'Gemelo de Pie', muscle: 'Piernas', equip: 'Máquina' },
  { name: 'Gemelo Sentado', muscle: 'Piernas', equip: 'Máquina' },
  // ---- Glúteos ----
  { name: 'Hip Thrust', muscle: 'Glúteos', equip: 'Barra' },
  { name: 'Puente de Glúteo', muscle: 'Glúteos', equip: 'Peso corp.' },
  { name: 'Patada de Glúteo en Polea', muscle: 'Glúteos', equip: 'Polea' },
  { name: 'Abducción en Máquina', muscle: 'Glúteos', equip: 'Máquina' },
  { name: 'Peso Muerto Sumo', muscle: 'Glúteos', equip: 'Barra' },
  { name: 'Zancada Caminando', muscle: 'Glúteos', equip: 'Mancuerna' },
  // ---- Core ----
  { name: 'Plancha', muscle: 'Core', equip: 'Peso corp.' },
  { name: 'Plancha Lateral', muscle: 'Core', equip: 'Peso corp.' },
  { name: 'Crunch Abdominal', muscle: 'Core', equip: 'Peso corp.' },
  { name: 'Elevación de Piernas', muscle: 'Core', equip: 'Peso corp.' },
  { name: 'Rueda Abdominal', muscle: 'Core', equip: 'Rueda' },
  { name: 'Giro Ruso', muscle: 'Core', equip: 'Mancuerna' },
  { name: 'Crunch en Polea', muscle: 'Core', equip: 'Polea' },
  { name: 'Elevación de Rodillas Colgado', muscle: 'Core', equip: 'Peso corp.' },
  // ---- Antebrazo ----
  { name: 'Curl de Muñeca', muscle: 'Antebrazo', equip: 'Barra' },
  { name: 'Curl de Muñeca Inverso', muscle: 'Antebrazo', equip: 'Barra' },
  { name: 'Paseo del Granjero', muscle: 'Antebrazo', equip: 'Mancuerna' },
  // ---- Cardio ----
  { name: 'Correr', muscle: 'Cardio', equip: 'Peso corp.' },
  { name: 'Cinta de Correr', muscle: 'Cardio', equip: 'Máquina' },
  { name: 'Bicicleta Estática', muscle: 'Cardio', equip: 'Máquina' },
  { name: 'Elíptica', muscle: 'Cardio', equip: 'Máquina' },
  { name: 'Remo (Máquina)', muscle: 'Cardio', equip: 'Máquina' },
  { name: 'Saltar Comba', muscle: 'Cardio', equip: 'Peso corp.' },
  { name: 'Burpees', muscle: 'Cardio', equip: 'Peso corp.' },
  { name: 'Escaladora', muscle: 'Cardio', equip: 'Máquina' }
];
const MUSCLE_FILTERS = ['Todos','Pecho','Espalda','Hombros','Bíceps','Tríceps','Piernas','Glúteos','Core','Antebrazo','Cardio'];

/* ─────────────────────────────────────────────
   STATE MODULE
   ───────────────────────────────────────────── */
function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION, level: 1, xp: 0, maxStreak: 0, updatedAt: 0,
    friendCode: generateCode(), friends: [],
    gymDays: [], restDays: [],
    weeklyRoutine: DAYS.map(d => ({ day: d, exercises: [] })),
    muscleRoutine: [{ name: 'Grupo 1', exercises: [] }],
    goals: [], tasks: [], recentExercises: [], exerciseHistory: {},
    stats: { totalVolume: 0, totalSets: 0, totalReps: 0 },
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
  function save() {
    try {
      state.updatedAt = Date.now();
      localStorage.setItem('zenit_state', JSON.stringify(state));
      if (typeof FirebaseModule !== 'undefined') FirebaseModule.scheduleSync();
    } catch (e) { UIModule.toast('Error al guardar', 'error'); }
  }
  function get() { return state; }
  function set(updates) { Object.assign(state, updates); save(); }
  function replace(newState) { state = deepMerge(defaultState(), newState || {}); save(); }
  function saveField(path, value) { const keys = path.split('.'); let obj = state; for (let i = 0; i < keys.length - 1; i++) { obj = obj[keys[i]]; } obj[keys[keys.length - 1]] = value; save(); }
  function deepMerge(target, source) { const out = { ...target }; for (const key in source) { if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) { out[key] = deepMerge(target[key] || {}, source[key]); } else { out[key] = source[key]; } } return out; }
  return { load, save, get, set, replace, saveField };
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
  let auth = null, db = null, currentUser = null, syncTimer = null;
  function isConfigured() { return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'TU_API_KEY'; }
  function init() {
    if (!isConfigured()) return; // sin config, la app funciona en local sin tocar nada
    try {
      firebase.initializeApp(FIREBASE_CONFIG); auth = firebase.auth(); db = firebase.firestore();
      auth.onAuthStateChanged(async user => {
        currentUser = user; UIModule.updateAuthUI(user);
        if (user) await onLogin(user);
      });
    } catch (e) { console.warn('Firebase no disponible:', e.message); }
  }
  async function onLogin(user) {
    if (!db) return;
    try {
      const ref = db.collection('users').doc(user.uid);
      const snap = await ref.get();
      const local = StateModule.get();
      if (snap.exists && snap.data().state) {
        const cloud = snap.data().state;
        // Última escritura gana: usamos la versión más reciente por marca de tiempo
        if ((cloud.updatedAt || 0) > (local.updatedAt || 0)) {
          StateModule.replace(cloud); renderAll();
          UIModule.toast('Progreso sincronizado', 'success');
          return;
        }
      }
      await pushNow(); // no había datos en la nube, o los locales son más recientes
    } catch (e) { console.warn('Error de sincronización:', e.message); }
  }
  async function pushNow() {
    if (!db || !currentUser) return;
    try {
      const s = StateModule.get();
      await db.collection('users').doc(currentUser.uid).set({ state: s, updatedAt: s.updatedAt || Date.now() }, { merge: true });
    } catch (e) { console.warn('Error al subir datos:', e.message); }
  }
  function scheduleSync() {
    if (!db || !currentUser) return;
    clearTimeout(syncTimer); syncTimer = setTimeout(pushNow, 1500);
  }
  async function loginWithGoogle() {
    if (!isConfigured()) { UIModule.toast('El inicio de sesión estará disponible próximamente', 'info', 3200); return; }
    if (!auth) { UIModule.toast('Autenticación no disponible', 'error'); return; }
    try { const provider = new firebase.auth.GoogleAuthProvider(); await auth.signInWithPopup(provider); } catch (e) { UIModule.toast('Error al iniciar sesión', 'error'); }
  }
  async function logout() {
    if (!auth) return;
    try { await pushNow(); await auth.signOut(); currentUser = null; UIModule.updateAuthUI(null); UIModule.toast('Sesión cerrada', 'info'); } catch (e) { UIModule.toast('Error al cerrar', 'error'); }
  }
  return { init, loginWithGoogle, logout, scheduleSync, isConfigured };
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
  function addXP(amount) {
    const s = StateModule.get();
    s.xp += amount;
    let lvl = s.level;
    while (lvl < XP_PER_LEVEL.length - 1 && s.xp >= XP_PER_LEVEL[lvl]) { lvl++; UIModule.toast(`Has alcanzado el nivel ${lvl}`, 'success', 3200); }
    s.level = lvl;
    StateModule.save(); DashboardModule.render();
  }
  return { addXP };
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
    streak = consecutive;
    maxStreak = Math.max(streak, s.maxStreak || 0);
    if (maxStreak !== (s.maxStreak || 0)) { s.maxStreak = maxStreak; StateModule.save(); }
    return { streak, maxStreak };
  }
  function todayStr() { return dateToStr(new Date()); }
  function dateToStr(d) {
    // Fecha LOCAL (no UTC): toISOString desfasaba el día en zonas horarias
    // como España cerca de medianoche, corrompiendo rachas y mapa de calor.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function parseDate(str) {
    // Interpreta "YYYY-MM-DD" como fecha local (new Date(str) la trataría como UTC).
    const [y, m, d] = String(str).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  return { compute, todayStr, dateToStr, parseDate };
})();

/* ─────────────────────────────────────────────
   DASHBOARD MODULE
   ───────────────────────────────────────────── */
const DashboardModule = (() => {
  function todayIndex() { return (new Date().getDay() + 6) % 7; }
  function muscleOf(name) { const e = EXERCISE_DB.find(x => x.name === name); return e ? e.muscle : null; }
  function formatShort(str) { const d = StreakModule.parseDate(str); return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`; }

  function render() { renderGreeting(); renderToday(); renderWeeks(); renderTasks(); renderGoals(); renderSidebarLevel(); }

  function renderGreeting() {
    const now = new Date(); const h = now.getHours();
    const greeting = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
    const titleEl = document.getElementById('home-greet-title'); if (titleEl) titleEl.textContent = greeting;
    const subEl = document.getElementById('home-greeting');
    if (subEl) { const { week, total } = isoWeekData(now); subEl.textContent = `Semana ${week}/${total} del año`; }
  }
  // Número de semana ISO-8601 (semana empieza en lunes) y total de semanas del año ISO
  function isoWeekData(date) {
    const thu = d => { const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()); t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + 3); return t; };
    const weekOf = d => { const t = thu(d); const first = thu(new Date(t.getFullYear(), 0, 4)); return 1 + Math.round((t - first) / 604800000); };
    const isoYear = thu(date).getFullYear();
    return { week: weekOf(date), total: weekOf(new Date(isoYear, 11, 28)) };
  }

  function renderToday() {
    const s = StateModule.get(); const idx = todayIndex(); const day = s.weeklyRoutine[idx];
    const routineEl = document.getElementById('home-routine');
    const subEl = document.getElementById('home-sub');
    const card = document.getElementById('home-cta');
    if (!routineEl || !card) return;
    const today = StreakModule.todayStr();
    const trainedToday = s.gymDays.includes(today);
    const restedToday = s.restDays.includes(today);

    if (day.exercises.length) {
      const muscles = [...new Set(day.exercises.map(e => muscleOf(e.name)).filter(Boolean))];
      routineEl.textContent = muscles.length ? muscles.slice(0, 3).join(', ') : 'Entrenamiento de hoy';
      const nEx = day.exercises.length;
      const nSets = day.exercises.reduce((a, e) => a + (e.sets ? e.sets.length : 0), 0);
      subEl.textContent = trainedToday
        ? 'Entreno completado hoy'
        : `${nEx} ${nEx === 1 ? 'ejercicio' : 'ejercicios'} · ${nSets} ${nSets === 1 ? 'serie' : 'series'}`;
      card.classList.toggle('done', trainedToday);
      card.onclick = () => RoutineModule.openEditor(idx, 'days');
    } else {
      routineEl.textContent = restedToday ? 'Descanso' : (trainedToday ? 'Entreno completado' : 'Descanso');
      subEl.textContent = restedToday ? 'Descanso registrado hoy' : (trainedToday ? 'Buen trabajo hoy' : 'Toca para marcar descanso');
      card.classList.toggle('done', restedToday || trainedToday);
      card.onclick = (restedToday || trainedToday) ? null : () => markToday('rest');
    }
  }

  function renderWeeks() {
    const s = StateModule.get();
    const grid = document.getElementById('weeks-grid'); if (!grid) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = StreakModule.dateToStr(today);
    // Lunes de esta semana, retrocediendo una semana más = 14 días alineados a semanas
    const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7);
    let active = 0, html = '';
    for (let i = 0; i < 14; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const str = StreakModule.dateToStr(d);
      const isFuture = d > today;
      const isActive = !isFuture && (s.gymDays.includes(str) || s.restDays.includes(str));
      if (isActive) active++;
      let cls = 'week-cell';
      if (isFuture) cls += ' future';
      else if (isActive) cls += ' active';
      if (str === todayStr) cls += ' today';
      html += `<div class="${cls}">${d.getDate()}</div>`;
    }
    grid.innerHTML = html;
    document.getElementById('weeks-active').textContent = active;
    const end = new Date(start); end.setDate(start.getDate() + 13);
    const fmt = d => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
    document.getElementById('weeks-range').textContent = `${fmt(start)} – ${fmt(end)}`;
  }

  function renderTasks() {
    const s = StateModule.get(); const list = document.getElementById('dash-habits-list'); const today = StreakModule.todayStr();
    if (!s.tasks.length) { list.innerHTML = '<span class="hint-text">Añade tus tareas en la pestaña Metas.</span>'; return; }
    list.innerHTML = s.tasks.map((t, i) => {
      const done = t.completedDates && t.completedDates.includes(today);
      return `<div class="task ${done ? 'done' : ''}" data-i="${i}"><span class="chk ${done ? 'done' : ''}"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span><span class="task-name">${escHtml(t.name)}</span></div>`;
    }).join('');
    list.querySelectorAll('.task').forEach(el => {
      el.addEventListener('click', () => {
        const chk = el.querySelector('.chk'); if (chk) chk.classList.add('anim-pop');
        setTimeout(() => HabitsModule.toggleHabit(+el.dataset.i), 180);
      });
    });
  }

  function renderGoals() {
    const s = StateModule.get(); const list = document.getElementById('dash-goals-list');
    if (!s.goals.length) { list.innerHTML = '<span class="hint-text">Gestiona tus metas en la pestaña Metas.</span>'; return; }
    list.innerHTML = s.goals.map(g => `<div class="goal-row"><span class="g-name">${escHtml(g.text)}</span><span class="g-meta">${g.date ? formatShort(g.date) : 'en curso'}</span></div>`).join('');
  }

  function renderSidebarLevel() {
    const s = StateModule.get(); const el = document.getElementById('sb-level');
    if (el) el.textContent = `Nivel ${s.level}`;
  }

  function markToday(type) {
    const s = StateModule.get(); const today = StreakModule.todayStr();
    if (type === 'gym') {
      if (!s.gymDays.includes(today)) { s.gymDays.push(today); XPModule.addXP(50); UIModule.toast('Entreno registrado', 'success'); haptic(); }
      else { UIModule.toast('Ya has registrado un entreno hoy', 'info'); }
    } else {
      if (!s.restDays.includes(today) && !s.gymDays.includes(today)) { s.restDays.push(today); XPModule.addXP(30); UIModule.toast('Descanso registrado', 'info'); haptic(); }
      else { UIModule.toast('Ya has registrado el día', 'info'); }
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
      return `<div class="active-item-card"><div class="habit-check ${done ? 'done' : ''}" data-hi="${i}"><svg width="12" height="12" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="habit-name ${done ? 'done' : ''}">${escHtml(t.name)}</span><button class="ai-del" data-del-h="${i}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--text-sec)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
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
    if (idx === -1) { task.completedDates.push(todayStr); XPModule.addXP(10); haptic(); } else { task.completedDates.splice(idx, 1); }
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
   COMMUNITY & SETTINGS MODULES
   ───────────────────────────────────────────── */
const CommunityModule = (() => {
  function render() { renderFriends(); }
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
  return { render, renderFriends, addFriend };
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
    if (level !== undefined) { UIModule.toast(`Energía registrada: ${FACES[level].l}`, 'success'); XPModule.addXP(50); }
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
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: 'SCHEDULE_NOTIFICATION', time, hasTrainedToday });
      } catch (e) { /* SW no disponible todavía */ }
    }
    UIModule.toast('Recordatorio configurado', 'success');
  }
  return { requestAndSchedule };
})();

/* ─────────────────────────────────────────────
   ROUTINE MODULE
   ───────────────────────────────────────────── */
const RoutineModule = (() => {
  let currentEditorIndex = -1, editorMode = 'days', restTimerInterval = null, restSeconds = 0;
  let editorTimerInterval = null, editorStartTime = 0;
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
    const editor = document.getElementById('routine-editor'); editor.style.display = 'flex'; editor.scrollTop = 0; requestAnimationFrame(() => editor.classList.add('open'));
    renderExercises(item.exercises); startEditorTimer();
  }
  function closeEditor() { const editor = document.getElementById('routine-editor'); editor.classList.remove('open'); setTimeout(() => { editor.style.display = 'none'; }, 350); stopRestTimer(); stopEditorTimer(); }
  function startEditorTimer() {
    stopEditorTimer(); editorStartTime = Date.now();
    const tick = () => {
      const secs = Math.floor((Date.now() - editorStartTime) / 1000);
      const m = Math.floor(secs / 60), s = secs % 60;
      const el = document.getElementById('editor-timer'); if (el) el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    };
    tick(); editorTimerInterval = setInterval(tick, 1000);
  }
  function stopEditorTimer() { if (editorTimerInterval) { clearInterval(editorTimerInterval); editorTimerInterval = null; } }
  function getCurrentItem() { return editorMode === 'days' ? StateModule.get().weeklyRoutine[currentEditorIndex] : StateModule.get().muscleRoutine[currentEditorIndex]; }

  function renderExercises(exercises) {
    const list = document.getElementById('exercise-list'); const s = StateModule.get();
    const unit = (s.settings.weightUnit || 'kg').toUpperCase();
    list.innerHTML = exercises.map((ex, ei) => {
      const history = s.exerciseHistory[ex.name]; const lastStr = history && history.length ? `Última vez: ${formatDate(history[history.length - 1].date)}` : 'Sin historial aún';
      const dbEx = EXERCISE_DB.find(x => x.name === ex.name); const muscle = dbEx ? dbEx.muscle : '';
      const sets = ex.sets.map((set, si) => `
        <div class="set-row ${set.done ? 'done' : ''}"><div class="set-num">${si + 1}</div><input class="set-input" type="number" inputmode="decimal" value="${set.weight}" data-field="weight" data-ei="${ei}" data-si="${si}"/><input class="set-input" type="number" inputmode="numeric" value="${set.reps}" data-field="reps" data-ei="${ei}" data-si="${si}"/><div class="set-check ${set.done ? 'done' : ''}" data-ei="${ei}" data-si="${si}"><svg width="15" height="15" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="set-del" data-ei="${ei}" data-si="${si}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--text-sec)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>`).join('');
      return `<div class="exercise-card"><div class="exercise-header"><div class="ex-info"><div class="ex-name">${escHtml(ex.name)}</div>${muscle ? `<div class="ex-muscle">${escHtml(muscle)}</div>` : ''}</div><div class="ex-actions"><button class="ex-action-btn" data-progress="${escHtml(ex.name)}"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M4 4v16h16M8 14l3-3 2 2 4-5" stroke="var(--text-sec)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="ex-action-btn danger" data-del-ex="${ei}"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="var(--danger)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div><div class="ex-history">${lastStr}</div><div class="sets-header"><span>Serie</span><span>${unit}</span><span>Reps</span><span></span><span></span></div>${sets}<button class="add-set-btn" data-ei="${ei}"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> Añadir serie</button></div>`;
    }).join('');
    bindEditorEvents(); updateVolume();
  }
  function bindEditorEvents() {
    const list = document.getElementById('exercise-list');
    list.querySelectorAll('.set-input').forEach(input => { input.addEventListener('change', e => { const { ei, si, field } = e.target.dataset; const set = getCurrentItem().exercises[+ei].sets[+si]; set[field] = parseFloat(e.target.value) || 0; StateModule.save(); updateVolume(); }); });
    list.querySelectorAll('.set-check').forEach(el => { el.addEventListener('click', () => { const ei = +el.dataset.ei, si = +el.dataset.si; const item = getCurrentItem(); const set = item.exercises[ei].sets[si]; set.done = !set.done; StateModule.save(); renderExercises(item.exercises); if (set.done) { haptic(); startRestTimer(); } }); });
    list.querySelectorAll('.set-del').forEach(el => { el.addEventListener('click', () => { const ei = +el.dataset.ei, si = +el.dataset.si; const item = getCurrentItem(); item.exercises[ei].sets.splice(si, 1); StateModule.save(); renderExercises(item.exercises); }); });
    list.querySelectorAll('.add-set-btn').forEach(btn => { btn.addEventListener('click', () => { const ei = +btn.dataset.ei; const item = getCurrentItem(); const lastSet = item.exercises[ei].sets.slice(-1)[0]; item.exercises[ei].sets.push({ weight: lastSet ? lastSet.weight : 0, reps: lastSet ? lastSet.reps : 10, rpe: lastSet ? lastSet.rpe : 8, done: false }); StateModule.save(); renderExercises(item.exercises); }); });
    list.querySelectorAll('[data-progress]').forEach(btn => { btn.addEventListener('click', () => ProgressModule.open(btn.dataset.progress)); });
    list.querySelectorAll('[data-del-ex]').forEach(btn => { btn.addEventListener('click', () => { const ei = +btn.dataset.delEx; UIModule.confirm('¿Eliminar este ejercicio?', () => { const item = getCurrentItem(); item.exercises.splice(ei, 1); StateModule.save(); renderExercises(item.exercises); }); }); });
  }
  function updateVolume() { const item = getCurrentItem(); const s = StateModule.get(); let total = 0; item.exercises.forEach(ex => { ex.sets.forEach(set => { if (set.done) total += (set.weight || 0) * (set.reps || 0); }); }); document.getElementById('vol-value').textContent = `${total.toFixed(0)} ${s.settings.weightUnit}`; }
  function saveRoutine() {
    const item = getCurrentItem(); const s = StateModule.get(); const today = StreakModule.todayStr();
    const prs = [];
    const st = s.stats || (s.stats = { totalVolume: 0, totalSets: 0, totalReps: 0 });
    item.exercises.forEach(ex => {
      const doneSets = ex.sets.filter(set => set.done);
      if (doneSets.length) {
        if (!s.exerciseHistory[ex.name]) s.exerciseHistory[ex.name] = [];
        // Mejor serie de la sesión por 1RM estimado (mejor indicador de récord).
        const best = doneSets.reduce((b, c) => (RecordsModule.e1rm(c.weight, c.reps) >= RecordsModule.e1rm(b.weight, b.reps) ? c : b));
        // ¿Récord? Solo con peso y solo si SUPERA una marca previa (no en el primer registro).
        const prev = RecordsModule.prevBest(ex.name);
        if (best.weight > 0 && prev > 0 && RecordsModule.e1rm(best.weight, best.reps) > prev) prs.push(ex.name);
        s.exerciseHistory[ex.name].push({ date: today, weight: best.weight, reps: best.reps });
        // Acumulado de por vida (volumen, series y reps completadas)
        doneSets.forEach(set => { st.totalSets++; st.totalReps += (set.reps || 0); st.totalVolume += (set.weight || 0) * (set.reps || 0); });
        if (!s.recentExercises.includes(ex.name)) { s.recentExercises.unshift(ex.name); if (s.recentExercises.length > 5) s.recentExercises.pop(); }
      }
    });
    // Al finalizar, desmarcamos todas las series (se conservan peso y reps como plantilla para la próxima).
    item.exercises.forEach(ex => ex.sets.forEach(set => { set.done = false; }));
    if (!s.gymDays.includes(today)) { s.gymDays.push(today); XPModule.addXP(50); }
    StateModule.save(); closeEditor(); DashboardModule.render(); ConstanciaModule.render();
    if (prs.length) { UIModule.toast(prs.length === 1 ? `🏆 ¡Nuevo récord en ${prs[0]}!` : `🏆 ¡${prs.length} récords nuevos!`, 'success', 4200); haptic(); }
    EnergyModule.open();
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
      exs.forEach(e => { html += `<div class="ex-list-item" data-name="${escHtml(e.name)}"><div class="eli-name">${escHtml(e.name)}</div>${e.equip ? `<span class="eli-eq">${escHtml(e.equip)}</span>` : ''}<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="var(--pri)" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg></div>`; });
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
  return { open, close, renderExercises, openCustomModal, addExercise };
})();

/* ─────────────────────────────────────────────
   RECORDS MODULE (récords personales)
   ───────────────────────────────────────────── */
const RecordsModule = (() => {
  // 1RM estimado (fórmula de Epley). Sin peso o sin reps => 0.
  function e1rm(w, r) { return w > 0 && r > 0 ? Math.round(w * (1 + r / 30)) : 0; }
  // Mejor 1RM previo de un ejercicio, derivado del historial ya guardado.
  function prevBest(name) {
    const entries = (StateModule.get().exerciseHistory || {})[name] || [];
    let best = 0;
    entries.forEach(en => { if (en.weight > 0) best = Math.max(best, e1rm(en.weight, en.reps)); });
    return best;
  }
  // Lista de récords (uno por ejercicio con peso), del más reciente al más antiguo.
  function all() {
    const hist = StateModule.get().exerciseHistory || {}; const list = [];
    for (const name in hist) {
      let best = null;
      (hist[name] || []).forEach(en => {
        if (!(en.weight > 0)) return;
        const v = e1rm(en.weight, en.reps);
        if (!best || v > best.e1rm) best = { name, weight: en.weight, reps: en.reps, e1rm: v, date: en.date };
      });
      if (best) list.push(best);
    }
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list;
  }
  function render() {
    const list = document.getElementById('records-list'); if (!list) return;
    const recs = all();
    if (!recs.length) { list.innerHTML = '<div class="rec-empty">Aún no tienes récords. Completa series con peso al entrenar y se registrarán aquí.</div>'; return; }
    const unit = StateModule.get().settings.weightUnit || 'kg';
    const medal = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 6H3v2a3 3 0 0 0 3 3M19 6h2v2a3 3 0 0 1-3 3"/></svg>';
    list.innerHTML = recs.map(r => `<div class="rec-item" data-progress="${escHtml(r.name)}"><div class="rec-medal">${medal}</div><div class="rec-info"><div class="rec-name">${escHtml(r.name)}</div><div class="rec-sub"><b>${r.weight} ${unit} × ${r.reps}</b> · 1RM ${r.e1rm} ${unit}</div></div><div class="rec-date">${r.date ? formatDate(r.date) : ''}</div></div>`).join('');
    list.querySelectorAll('[data-progress]').forEach(el => el.addEventListener('click', () => ProgressModule.open(el.dataset.progress)));
  }
  return { e1rm, prevBest, all, render };
})();

/* ─────────────────────────────────────────────
   PROGRESS MODULE (gráfica de progreso por ejercicio)
   ───────────────────────────────────────────── */
const ProgressModule = (() => {
  let currentName = '', metric = 'weight', tipTimer = null;
  function open(name) {
    currentName = name; metric = 'weight';
    setSegActive();
    const el = document.getElementById('exercise-progress');
    el.style.display = 'flex'; el.scrollTop = 0; requestAnimationFrame(() => el.classList.add('open'));
    render();
  }
  function close() { const el = document.getElementById('exercise-progress'); el.classList.remove('open'); setTimeout(() => { el.style.display = 'none'; }, 350); }
  function setMetric(m) { metric = m; setSegActive(); render(); }
  function setSegActive() { document.querySelectorAll('#progress-seg .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.metric === metric)); }
  function series() {
    const hist = (StateModule.get().exerciseHistory || {})[currentName] || [];
    return hist.filter(e => e.weight > 0).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(e => ({ date: e.date, value: metric === 'e1rm' ? RecordsModule.e1rm(e.weight, e.reps) : e.weight, weight: e.weight, reps: e.reps }));
  }
  function render() {
    const s = StateModule.get(); const unit = s.settings.weightUnit || 'kg';
    const dbEx = EXERCISE_DB.find(x => x.name === currentName);
    document.getElementById('progress-title').textContent = currentName;
    document.getElementById('progress-muscle').textContent = dbEx ? dbEx.muscle : '';
    document.getElementById('progress-unit').textContent = unit;
    const data = series();
    const valEl = document.getElementById('progress-value'), subEl = document.getElementById('progress-sub');
    const badgeEl = document.getElementById('progress-badge'), chartEl = document.getElementById('progress-chart'), statsEl = document.getElementById('progress-stats');
    if (!data.length) {
      valEl.textContent = '--'; subEl.textContent = 'Sin datos aún. Completa series con peso en este ejercicio y finaliza el entreno.';
      badgeEl.style.display = 'none'; chartEl.innerHTML = ''; statsEl.innerHTML = ''; return;
    }
    const values = data.map(d => d.value);
    const last = data[data.length - 1], max = Math.max(...values), min = Math.min(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    valEl.textContent = last.value;
    subEl.textContent = `Última sesión: ${formatDate(last.date)}`;
    const isRecord = last.value >= max && data.length > 1;
    badgeEl.textContent = 'récord'; badgeEl.style.display = isRecord ? 'inline-block' : 'none';
    chartEl.innerHTML = buildChart(data, min, max) + '<div class="progress-hint">Toca un punto para ver su valor</div>';
    chartEl.querySelectorAll('.pg-hit').forEach(c => c.addEventListener('click', () => {
      const d = data[+c.dataset.pt];
      TooltipModule.show(c, `${formatDate(d.date)} · ${d.value} ${unit}`);
      clearTimeout(tipTimer); tipTimer = setTimeout(() => TooltipModule.hide(), 2800);
    }));
    statsEl.innerHTML = `<div class="pstat"><div class="pstat-l">Mejor</div><div class="pstat-v">${max} ${unit}</div></div><div class="pstat"><div class="pstat-l">Media</div><div class="pstat-v">${avg} ${unit}</div></div><div class="pstat"><div class="pstat-l">Sesiones</div><div class="pstat-v">${data.length}</div></div>`;
  }
  function buildChart(data, min, max) {
    const W = 320, H = 172, padL = 8, padR = 8, padT = 20, padB = 22;
    const n = data.length; let lo = min, hi = max;
    if (lo === hi) { lo = Math.max(0, lo - 5); hi = hi + 5; }
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = i => n === 1 ? W / 2 : padL + (plotW * i / (n - 1));
    const y = v => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`);
    const grid = [0.25, 0.5, 0.75].map(f => { const gy = (padT + plotH * f).toFixed(1); return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="var(--border)" stroke-width="1"/>`; }).join('');
    const area = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(' ') + ` L${x(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
    const line = n > 1 ? `<path d="M${pts.join(' L')}" fill="none" stroke="var(--pri)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const maxIdx = data.reduce((mi, d, i, arr) => d.value > arr[mi].value ? i : mi, 0);
    const dots = data.map((d, i) => { const m = i === maxIdx; return `<circle cx="${x(i).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="${m ? 5 : 3}" fill="var(--pri)" ${m ? 'stroke="var(--bg)" stroke-width="2"' : ''}/>`; }).join('');
    const l1 = `<text x="${padL}" y="${H - 6}" font-size="9" fill="var(--text-sec)">${shortDate(data[0].date)}</text>`;
    const l2 = n > 1 ? `<text x="${W - padR}" y="${H - 6}" text-anchor="end" font-size="9" fill="var(--text-sec)">${shortDate(data[n - 1].date)}</text>` : '';
    // Zonas de toque (invisibles y más grandes) sobre cada punto, para tocarlas fácil
    const hits = data.map((d, i) => `<circle class="pg-hit" data-pt="${i}" cx="${x(i).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="14" fill="transparent" style="cursor:pointer"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="overflow:visible"><defs><linearGradient id="pgArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pri)" stop-opacity=".33"/><stop offset="1" stop-color="var(--pri)" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#pgArea)"/>${line}${dots}${l1}${l2}${hits}</svg>`;
  }
  function shortDate(str) { if (!str) return ''; const p = String(str).split('-'); return `${p[2]}/${p[1]}`; }
  return { open, close, setMetric };
})();

/* ─────────────────────────────────────────────
   LIFETIME MODULE (estadísticas de por vida)
   ───────────────────────────────────────────── */
const LifetimeModule = (() => {
  function fmtNum(n) { return Math.round(n).toLocaleString('es-ES'); }
  function fmtBig(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace('.', ',') + ' M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + ' k';
    return String(Math.round(n));
  }
  function render() {
    const body = document.getElementById('lifetime-body'); if (!body) return;
    const s = StateModule.get();
    const unit = s.settings.weightUnit || 'kg';
    const st = s.stats || { totalVolume: 0, totalSets: 0, totalReps: 0 };
    const totalWorkouts = s.gymDays.length;
    const activeDays = new Set([...s.gymDays, ...s.restDays]).size;
    const avgVol = totalWorkouts ? st.totalVolume / totalWorkouts : 0;
    // Ejercicio estrella: el que más sesiones tiene en el historial
    let star = '', starCount = 0; const hist = s.exerciseHistory || {};
    for (const name in hist) { const c = (hist[name] || []).length; if (c > starCount) { starCount = c; star = name; } }
    const tiles = [
      ['Entrenos totales', fmtNum(totalWorkouts)],
      ['Días activos', fmtNum(activeDays)],
      ['Series completadas', fmtNum(st.totalSets)],
      ['Repeticiones', fmtNum(st.totalReps)],
      ['Racha máxima', (s.maxStreak || 0) + ' d'],
      ['Vol. medio/entreno', fmtBig(avgVol) + ' ' + unit]
    ];
    body.innerHTML =
      `<div class="lt-hero"><div class="lt-hero-v">${fmtBig(st.totalVolume)} ${unit}</div><div class="lt-hero-l">Peso total levantado 💪</div></div>` +
      `<div class="lt-grid">` + tiles.map(t => `<div class="lt-tile"><div class="lt-v">${t[1]}</div><div class="lt-l">${t[0]}</div></div>`).join('') + `</div>` +
      (starCount ? `<div class="lt-star">🏅 Ejercicio estrella: <b>${escHtml(star)}</b> · ${starCount} ${starCount === 1 ? 'sesión' : 'sesiones'}</div>` : '');
  }
  return { render };
})();

/* ─────────────────────────────────────────────
   MUSCLE MAP MODULE (mapa de calor muscular)
   ───────────────────────────────────────────── */
const MuscleMapModule = (() => {
  const WINDOW_DAYS = 30;
  let tipTimer = null;
  // Cuerpo base sólido (silueta) sobre el que se pintan los músculos. viewBox 120x250.
  const BODY = '<circle cx="60" cy="19" r="13"/><rect x="56" y="30" width="8" height="8" rx="2"/><path d="M41 41 Q60 37 79 41 L75 112 Q60 116 45 112 Z"/><rect x="27" y="44" width="12" height="74" rx="6"/><rect x="81" y="44" width="12" height="74" rx="6"/><path d="M45 110 H75 V126 H45 Z"/><rect x="45" y="124" width="13" height="122" rx="6"/><rect x="62" y="124" width="13" height="122" rx="6"/>';
  // Formas anatómicas por grupo muscular
  const FRONT = [
    { m: 'Hombros', svg: '<path d="M50 40 Q60 38 70 40 L66 47 Q60 45 54 47 Z"/><path d="M40 44 Q31 46 30 57 Q37 60 44 55 Z"/><path d="M80 44 Q89 46 90 57 Q83 60 76 55 Z"/>' },
    { m: 'Pecho', svg: '<path d="M59 55 V72 Q47 71 46 62 Q46 54 59 55 Z"/><path d="M61 55 V72 Q73 71 74 62 Q74 54 61 55 Z"/>' },
    { m: 'Bíceps', svg: '<path d="M30 63 Q35 64 35 78 Q35 88 30 88 Q26 86 27 74 Z"/><path d="M90 63 Q85 64 85 78 Q85 88 90 88 Q94 86 93 74 Z"/>' },
    { m: 'Antebrazo', svg: '<path d="M30 92 Q34 93 33 108 L30 114 Q27 104 28 94 Z"/><path d="M90 92 Q86 93 87 108 L90 114 Q93 104 92 94 Z"/>' },
    { m: 'Core', svg: '<rect x="53" y="76" width="6" height="7" rx="1.5"/><rect x="61" y="76" width="6" height="7" rx="1.5"/><rect x="53" y="85" width="6" height="7" rx="1.5"/><rect x="61" y="85" width="6" height="7" rx="1.5"/><rect x="53" y="94" width="6" height="7" rx="1.5"/><rect x="61" y="94" width="6" height="7" rx="1.5"/><path d="M50 78 Q47 90 51 104 L54 103 Q50 90 52 79 Z"/><path d="M70 78 Q73 90 69 104 L66 103 Q70 90 68 79 Z"/>' },
    { m: 'Piernas', svg: '<path d="M47 128 Q52 128 52 158 Q51 182 47 184 Q43 182 43 158 Z"/><path d="M54 130 Q57 132 57 158 L55 178 Q53 160 53 132 Z"/><path d="M66 130 Q63 132 63 158 L65 178 Q67 160 67 132 Z"/><path d="M73 128 Q68 128 68 158 Q69 182 73 184 Q77 182 77 158 Z"/><ellipse cx="50" cy="212" rx="5" ry="20"/><ellipse cx="70" cy="212" rx="5" ry="20"/>' }
  ];
  const BACK = [
    { m: 'Hombros', svg: '<path d="M40 44 Q31 46 30 57 Q37 60 44 55 Z"/><path d="M80 44 Q89 46 90 57 Q83 60 76 55 Z"/>' },
    { m: 'Espalda', svg: '<path d="M46 40 Q60 37 74 40 L68 62 Q60 59 52 62 Z"/><path d="M52 63 Q44 84 56 104 L59 103 Q50 84 55 64 Z"/><path d="M68 63 Q76 84 64 104 L61 103 Q70 84 65 64 Z"/><rect x="54" y="96" width="5" height="14" rx="2"/><rect x="61" y="96" width="5" height="14" rx="2"/>' },
    { m: 'Tríceps', svg: '<path d="M30 63 Q35 64 35 80 Q35 90 30 90 Q26 88 27 74 Z"/><path d="M90 63 Q85 64 85 80 Q85 90 90 90 Q94 88 93 74 Z"/>' },
    { m: 'Antebrazo', svg: '<path d="M30 94 Q34 95 33 108 L30 114 Q27 104 28 96 Z"/><path d="M90 94 Q86 95 87 108 L90 114 Q93 104 92 96 Z"/>' },
    { m: 'Glúteos', svg: '<path d="M46 116 Q46 132 58 132 Q60 124 59 117 Z"/><path d="M74 116 Q74 132 62 132 Q60 124 61 117 Z"/>' },
    { m: 'Piernas', svg: '<path d="M47 134 Q52 134 52 160 L49 182 Q45 160 45 136 Z"/><path d="M54 136 Q57 138 57 160 L55 178 Q53 160 53 138 Z"/><path d="M66 136 Q63 138 63 160 L65 178 Q67 160 67 138 Z"/><path d="M73 134 Q68 134 68 160 L71 182 Q75 160 75 136 Z"/><ellipse cx="50" cy="210" rx="6" ry="20"/><ellipse cx="70" cy="210" rx="6" ry="20"/>' }
  ];
  function counts() {
    const hist = StateModule.get().exerciseHistory || {};
    const d = new Date(); d.setDate(d.getDate() - (WINDOW_DAYS - 1));
    const cutoff = StreakModule.dateToStr(d);
    const c = {};
    for (const name in hist) {
      const dbEx = EXERCISE_DB.find(x => x.name === name); const m = dbEx ? dbEx.muscle : null;
      if (!m) continue;
      const recent = (hist[name] || []).filter(e => e.date && e.date >= cutoff).length;
      if (recent) c[m] = (c[m] || 0) + recent;
    }
    return c;
  }
  function figure(shapes, intensity) {
    const base = `<g fill="#2b2b2b">${BODY}</g>`;
    const over = shapes.map(s => `<g class="mm-mus" data-muscle="${s.m}" fill="var(--pri)" fill-opacity="${(intensity[s.m] || 0).toFixed(2)}" pointer-events="all">${s.svg}</g>`).join('');
    return `<svg viewBox="0 0 120 250" width="100%" style="height:auto;display:block">${base}${over}</svg>`;
  }
  function render() {
    const body = document.getElementById('musclemap-body'); if (!body) return;
    const c = counts();
    const max = Math.max(1, ...Object.values(c));
    const intensity = {}; Object.keys(c).forEach(m => { intensity[m] = 0.28 + 0.72 * (c[m] / max); });
    // Resumen
    let top = '', topN = 0; Object.keys(c).forEach(m => { if (c[m] > topN) { topN = c[m]; top = m; } });
    const major = ['Piernas', 'Espalda', 'Pecho', 'Hombros', 'Glúteos'];
    const neglected = major.find(m => !c[m]);
    const hasData = Object.keys(c).length > 0;
    body.innerHTML =
      `<div class="mm-bodies"><div class="mm-fig">${figure(FRONT, intensity)}<div class="mm-fig-lbl">Frente</div></div><div class="mm-fig">${figure(BACK, intensity)}<div class="mm-fig-lbl">Espalda</div></div></div>` +
      `<div class="mm-legend"><span>Menos</span><span class="mm-bar"></span><span>Más</span></div>` +
      (hasData
        ? `<div class="mm-summary"><div class="mm-chip"><span class="k">Más entrenado</span><span class="v hot">${escHtml(top)} · ${topN} ${topN === 1 ? 'sesión' : 'sesiones'}</span></div>` +
          (neglected ? `<div class="mm-chip"><span class="k">Descuidado</span><span class="v">${escHtml(neglected)} · 0 sesiones</span></div>` : '') +
          `</div><div class="mm-note">Últimos ${WINDOW_DAYS} días · toca un músculo para ver sus datos</div>`
        : `<div class="mm-note">Sin entrenamientos aún. Finaliza entrenos con peso y el mapa se irá iluminando. Toca un músculo para identificarlo.</div>`);
    // Tocar un músculo muestra su nombre y sesiones
    body.querySelectorAll('.mm-mus').forEach(g => g.addEventListener('click', () => {
      const m = g.dataset.muscle, n = c[m] || 0;
      TooltipModule.show(g, `${m} · ${n} ${n === 1 ? 'sesión' : 'sesiones'}`);
      clearTimeout(tipTimer); tipTimer = setTimeout(() => TooltipModule.hide(), 2600);
    }));
  }
  return { render };
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
    const currentMonthGymCount = s.gymDays.filter(str => { const d = StreakModule.parseDate(str); return d.getMonth() === monthIdx && d.getFullYear() === yearNow; }).length;
    document.getElementById('ms-checkins').textContent = `${currentMonthGymCount} entrenamiento${currentMonthGymCount === 1 ? '' : 's'}`;

    // Obtener información de los últimos 6 meses
    const pastMonths = [];
    for(let i = 5; i >= 0; i--) {
        pastMonths.push(new Date(yearNow, monthIdx - i, 1));
    }

    const counts = pastMonths.map(mDate => {
      return s.gymDays.filter(str => {
          const d = StreakModule.parseDate(str);
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

    MuscleMapModule.render();
    LifetimeModule.render();
    RecordsModule.render();
  }

  return { render };
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

  // Login / Logout (antes el botón no tenía ningún handler)
  document.getElementById('login-btn').addEventListener('click', function () {
    if (this.dataset.action === 'logout') FirebaseModule.logout();
    else FirebaseModule.loginWithGoogle();
  });
  
  // Modals & Sidebar
  document.getElementById('open-community').addEventListener('click', () => { UIModule.closeSidebar(); CommunityModule.render(); UIModule.openModal('modal-community'); });
  document.getElementById('open-settings-menu').addEventListener('click', () => { UIModule.closeSidebar(); SettingsModule.init(); UIModule.openModal('modal-settings'); });
  document.getElementById('close-community').addEventListener('click', () => UIModule.closeModal('modal-community'));
  document.getElementById('close-settings').addEventListener('click', () => UIModule.closeModal('modal-settings'));

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

  // (La acción principal de la Home — "Empezar entreno" / "Marcar descanso" —
  //  se enlaza dinámicamente en DashboardModule.renderToday según el día.)

  // Metas Actions
  document.getElementById('habit-add-btn').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => { 
      this.classList.remove('anim-pop');
      HabitsModule.addHabit(document.getElementById('habit-input').value); 
      document.getElementById('habit-input').value = ''; 
    }, 200);
  });
  // Placeholder simulado del campo de fecha: se oculta cuando hay una fecha elegida
  const goalDateInput = document.getElementById('goal-date-input');
  const syncDatePh = () => goalDateInput.classList.toggle('has-value', !!goalDateInput.value);
  goalDateInput.addEventListener('change', syncDatePh);
  goalDateInput.addEventListener('input', syncDatePh);

  document.getElementById('goal-add-btn').addEventListener('click', function(e) {
    this.classList.add('anim-pop');
    setTimeout(() => {
      this.classList.remove('anim-pop');
      GoalsModule.addGoal(document.getElementById('goal-input').value, goalDateInput.value);
      document.getElementById('goal-input').value = '';
      goalDateInput.value = ''; syncDatePh();
    }, 200);
  });
  
  // Rutina Editor & Toggle
  document.getElementById('view-days').addEventListener('click', () => { document.getElementById('view-days').classList.add('active'); document.getElementById('view-groups').classList.remove('active'); document.getElementById('routine-days-view').style.display = 'block'; document.getElementById('routine-groups-view').style.display = 'none'; });
  document.getElementById('view-groups').addEventListener('click', () => { document.getElementById('view-groups').classList.add('active'); document.getElementById('view-days').classList.remove('active'); document.getElementById('routine-days-view').style.display = 'none'; document.getElementById('routine-groups-view').style.display = 'block'; });
  document.getElementById('editor-back').addEventListener('click', () => RoutineModule.closeEditor());
  document.getElementById('progress-back').addEventListener('click', () => ProgressModule.close());
  document.querySelectorAll('#progress-seg .toggle-btn').forEach(b => b.addEventListener('click', () => ProgressModule.setMetric(b.dataset.metric)));
  document.getElementById('save-routine-btn').addEventListener('click', () => RoutineModule.saveRoutine());
  document.getElementById('add-exercise-btn').addEventListener('click', () => ExerciseSheetModule.open());
  document.getElementById('exercise-sheet-overlay').addEventListener('click', () => ExerciseSheetModule.close());
  document.getElementById('ex-search').addEventListener('input', () => ExerciseSheetModule.renderExercises());
  document.getElementById('sheet-custom-btn').addEventListener('click', () => ExerciseSheetModule.openCustomModal());
  
  document.getElementById('custom-ex-confirm').addEventListener('click', () => {
    const name = document.getElementById('custom-ex-input').value.trim(); if (!name) return;
    UIModule.closeModal('custom-ex-modal');
    EXERCISE_DB.push({ name, muscle: 'Personalizado' });
    ExerciseSheetModule.addExercise(name);
  });

  document.getElementById('skip-rest-btn').addEventListener('click', () => RoutineModule.stopRestTimer());
}

document.addEventListener('DOMContentLoaded', () => {
  StateModule.load();
  TooltipModule.init();
  UIModule.updateAuthUI(null);
  FirebaseModule.init();
  bindEvents(); NavModule.init();
  renderAll();
});

// Registro del Service Worker (antes no se registraba: la PWA y el modo offline nunca funcionaban)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW no registrado:', err));
  });
}