/* ═══════════════════════════════════════════════════════════
   ZENIT v2.0 — app.js
   Guardado Local, Calendarios y Constructor de Rutinas
═══════════════════════════════════════════════════════════ */
'use strict';

/* ─── ESTADO GLOBAL Y LOCALSTORAGE (Punto 4) ────────────── */
let appState = {
  gymDays: [], // Fechas en formato "YYYY-MM-DD"
  routine: []  // Estructura JSON: [{name: "", sets: [{weight:0, reps:0, rpe:0}]}]
};

function loadData() {
  const saved = localStorage.getItem('zenitState');
  if (saved) {
    appState = JSON.parse(saved);
  } else {
    // Estado inicial por defecto
    appState.routine = [{ id: Date.now(), name: "Press Banca", sets: [{ weight: 60, reps: 10, rpe: 8 }] }];
  }
}

function saveData() {
  localStorage.setItem('zenitState', JSON.stringify(appState));
}

/* ─── FRASES MOTIVACIONALES (Punto 1) ───────────────────── */
const frases = [
  "No cuentes los días, haz que los días cuenten.",
  "La disciplina te llevará a donde la motivación no alcanza.",
  "El dolor que sientes hoy será la fuerza que sientas mañana.",
  "Un entrenamiento de 1 hora es solo el 4% de tu día. Sin excusas.",
  "El éxito comienza al final de tu zona de confort.",
  "Concéntrate en ser un 1% mejor cada día."
];

function setRandomQuote() {
  const quoteEl = document.getElementById('motivational-quote');
  if (quoteEl) {
    const randomIdx = Math.floor(Math.random() * frases.length);
    quoteEl.textContent = `"${frases[randomIdx]}"`;
  }
}

/* ─── HELPER FECHAS ─────────────────────────────────────── */
function getLocalDateStr(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}

/* ─── CALENDARIOS (Puntos 2 y 3) ────────────────────────── */
function renderCalendars() {
  const today = new Date();
  const todayStr = getLocalDateStr(today);
  
  // 1. Calendario Semanal (Dashboard)
  const weekContainer = document.getElementById('week-calendar-container');
  weekContainer.innerHTML = '';
  
  // Encontrar el lunes de esta semana
  const dayOfWeek = today.getDay() || 7; // 1-7
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  const daysName = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = getLocalDateStr(d);
    const isToday = dStr === todayStr;
    const isLogged = appState.gymDays.includes(dStr);
    
    weekContainer.innerHTML += `
      <div class="day-col ${isToday ? 'today' : ''} ${isLogged ? 'logged' : ''}">
        <div class="day-name">${daysName[i]}</div>
        <div class="day-num">${d.getDate()}</div>
      </div>
    `;
  }

  // 2. Calendario Mensual Full (Pestaña 4)
  const fullContainer = document.getElementById('full-calendar-container');
  const monthNameEl = document.getElementById('month-name');
  fullContainer.innerHTML = '';
  
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  monthNameEl.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
  
  // Cabeceras Días
  daysName.forEach(d => fullContainer.innerHTML += `<div class="cal-header">${d}</div>`);
  
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  let startDayIndex = firstDay.getDay() || 7; // 1(Lun) - 7(Dom)
  
  // Celdas vacías previas
  for (let i = 1; i < startDayIndex; i++) {
    fullContainer.innerHTML += `<div class="cal-day empty"></div>`;
  }
  
  // Días del mes
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dStr = getLocalDateStr(new Date(today.getFullYear(), today.getMonth(), i));
    const isLogged = appState.gymDays.includes(dStr);
    
    fullContainer.innerHTML += `
      <div class="cal-day ${isLogged ? 'logged' : ''}" onclick="toggleGymDay('${dStr}')">
        ${i}
      </div>
    `;
  }
}

function toggleGymDay(dateStr) {
  const index = appState.gymDays.indexOf(dateStr);
  if (index > -1) {
    appState.gymDays.splice(index, 1);
  } else {
    appState.gymDays.push(dateStr);
  }
  saveData();
  renderCalendars();
}

/* ─── CREADOR DE RUTINAS (Punto 5) ──────────────────────── */
function renderRoutine() {
  const container = document.getElementById('routine-container');
  container.innerHTML = '';

  appState.routine.forEach((ex, exIndex) => {
    let totalVol = 0;
    let max1RM = 0;

    let setsHtml = `
      <div class="set-header-grid">
        <div>SET</div><div>KG</div><div>REPS</div><div>RPE</div><div></div>
      </div>
    `;

    ex.sets.forEach((set, setIndex) => {
      // Cálculos matemáticos
      const vol = set.weight * set.reps;
      const epley1RM = set.weight * (1 + 0.0333 * set.reps);
      
      totalVol += vol;
      if (epley1RM > max1RM) max1RM = epley1RM;

      setsHtml += `
        <div class="set-grid">
          <div class="set-label">${setIndex + 1}</div>
          <input type="number" inputmode="decimal" class="inline-input" value="${set.weight}" onchange="updateSet(${exIndex}, ${setIndex}, 'weight', this.value)">
          <input type="number" inputmode="numeric" class="inline-input" value="${set.reps}" onchange="updateSet(${exIndex}, ${setIndex}, 'reps', this.value)">
          <input type="number" inputmode="numeric" class="inline-input" value="${set.rpe}" onchange="updateSet(${exIndex}, ${setIndex}, 'rpe', this.value)">
          <button class="btn-icon" onclick="removeSet(${exIndex}, ${setIndex})">✕</button>
        </div>
      `;
    });

    container.innerHTML += `
      <div class="card">
        <div class="ex-header">
          <input type="text" class="ex-name-input" value="${ex.name}" placeholder="Nombre del Ejercicio..." onchange="updateExerciseName(${exIndex}, this.value)">
          <button class="btn-icon" onclick="removeExercise(${exIndex})">🗑️</button>
        </div>
        
        ${setsHtml}
        
        <button class="btn-primary btn-secondary" style="font-size: 13px; padding: 10px;" onclick="addSet(${exIndex})">+ AÑADIR SERIE</button>
        
        <div class="stats-row">
          <div>Volumen: <span class="stats-val">${totalVol.toFixed(0)} kg</span></div>
          <div>1RM Est.: <span class="stats-val">${max1RM.toFixed(1)} kg</span></div>
        </div>
      </div>
    `;
  });
}

function addExercise() {
  appState.routine.push({ id: Date.now(), name: "", sets: [{ weight: 0, reps: 0, rpe: 0 }] });
  renderRoutine();
}

function removeExercise(exIndex) {
  appState.routine.splice(exIndex, 1);
  renderRoutine();
}

function addSet(exIndex) {
  // Copia la última serie si existe, si no ceros
  const sets = appState.routine[exIndex].sets;
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : { weight: 0, reps: 0, rpe: 0 };
  sets.push({ ...lastSet });
  renderRoutine();
}

function removeSet(exIndex, setIndex) {
  appState.routine[exIndex].sets.splice(setIndex, 1);
  renderRoutine();
}

function updateSet(exIndex, setIndex, field, value) {
  appState.routine[exIndex].sets[setIndex][field] = parseFloat(value) || 0;
  saveData();
  renderRoutine(); // Re-render para actualizar Volumen y 1RM
}

function updateExerciseName(exIndex, value) {
  appState.routine[exIndex].name = value;
  saveData();
}

function saveRoutine() {
  saveData();
  // Marcar hoy como día entrenado
  const todayStr = getLocalDateStr(new Date());
  if (!appState.gymDays.includes(todayStr)) {
    appState.gymDays.push(todayStr);
    saveData();
    renderCalendars();
  }
  
  // Imprimir JSON Final en consola (Requisito Punto 5)
  console.log("=== RUTINA GUARDADA JSON ===");
  console.log(JSON.stringify(appState.routine, null, 2));
  alert("Rutina guardada y día marcado en el calendario.");
}

/* ─── NAVEGACIÓN ────────────────────────────────────────── */
function switchTab(tabId, btnElement) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('view-' + tabId).classList.add('active');

  if (btnElement) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }
}

/* ─── INICIALIZACIÓN ────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setRandomQuote();
  renderCalendars();
  renderRoutine();
});

/* ─── SERVICE WORKER INIT ───────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('[Zenit] Error SW:', err));
  });
}