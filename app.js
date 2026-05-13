/* ═══════════════════════════════════════════════════════════
   ZENIT v12.0 — app.js (Firebase Cloud Version)
═══════════════════════════════════════════════════════════ */
'use strict';

(function() {
  const APP_VERSION = '12.0.0';
  
  // --- FIREBASE SETUP ---
  const firebaseConfig = {
    apiKey: "AIzaSyBQLYN-_G3t_d49XFkJlGlzXk_z0ql5Eb4",
    authDomain: "zenit-76017.firebaseapp.com",
    projectId: "zenit-76017",
    storageBucket: "zenit-76017.firebasestorage.app",
    messagingSenderId: "1094461261782",
    appId: "1:1094461261782:web:e2ef0cf1a311cbeef94677"
  };

  if (typeof firebase !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
  }

  const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
  const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

  if (db) {
      db.enablePersistence().catch(err => console.warn('Offline persistence issue', err));
  }
  
  // --- STATE ---
  let appState = {
    schemaVersion: 6,
    level: 1,
    xp: 0,
    gymDays: [], 
    restDays: [], 
    weeklyRoutine: [
      { id: 'd1', label: 'Lunes', name: '', exercises: [] }, { id: 'd2', label: 'Martes', name: '', exercises: [] },
      { id: 'd3', label: 'Miércoles', name: '', exercises: [] }, { id: 'd4', label: 'Jueves', name: '', exercises: [] },
      { id: 'd5', label: 'Viernes', name: '', exercises: [] }, { id: 'd6', label: 'Sábado', name: '', exercises: [] },
      { id: 'd7', label: 'Domingo', name: '', exercises: [] }
    ],
    muscleRoutine: [
      { id: generateUUID(), name: '', exercises: [] }
    ],
    goals: [],
    tasks: [],
    history: {}
  };

  let UIState = {
    currentMonthOffset: 0,
    timerInterval: null,
    stopwatchInterval: null,
    sessionSeconds: 0,
    routineViewMode: 'days', // 'days' | 'muscles'
    selectedRoutineIndex: null, // null = list view, 0-N = detail view
    renderedTabs: { dashboard: false, entreno: false, metas: false, calendario: false }
  };

  // --- HELPERS ---
  function generateUUID() { return crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2)); }
  function getLocalDateStr(d = new Date()) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]; }
  function triggerHaptic(pattern) { if(navigator.vibrate) navigator.vibrate(pattern); }
  function getEl(id) { return document.getElementById(id); }

  const SVG_ICONS = {
    flame: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px; margin-bottom: 2px;"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>`,
    copy: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>`,
    clock: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 4px; margin-bottom: 2px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
  };

  const wisdomQuotes = [
    "\"Una zona de confort es un lugar hermoso, pero nada crece allí.\"",
    "\"La disciplina te llevará a donde la motivación no alcanza.\"",
    "\"No temas crecer lentamente; teme solo quedarte quieto.\"",
    "\"Lo que no te mata te hace más fuerte.\"",
    "\"Cada mañana nacemos de nuevo. Lo que hacemos hoy es lo que importa.\""
  ];

  // --- MODULES ---
  const StorageModule = {
    load() {
      const saved = localStorage.getItem('zenitState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion < 6) this.migrate(parsed);
        else appState = parsed;
      }
      const savedSeconds = sessionStorage.getItem('zenitSessionSecs');
      if (savedSeconds) UIState.sessionSeconds = parseInt(savedSeconds, 10);
    },
    save() {
      localStorage.setItem('zenitState', JSON.stringify(appState));
      
      if (auth && auth.currentUser && db) {
         db.collection('users').doc(auth.currentUser.uid).set(appState)
           .catch(e => console.warn('Error syncing to cloud', e));
      }
    },
    migrate(oldState) {
      appState = { ...appState, ...oldState, schemaVersion: 6 };
      if (!appState.level) appState.level = 1;
      if (!appState.xp) appState.xp = 0;
      
      if (oldState.schemaVersion < 6) {
          appState.muscleRoutine = [ { id: generateUUID(), name: '', exercises: [] } ];
      }
      
      if(appState.weeklyRoutine && appState.weeklyRoutine[0].day) {
         appState.weeklyRoutine.forEach(r => { r.label = r.day; delete r.day; });
      }
      this.save();
    },
    syncFromCloud(uid) {
        if (!db) return;
        db.collection('users').doc(uid).get().then(doc => {
            if (doc.exists) {
                const cloudState = doc.data();
                if (cloudState.schemaVersion < 6) this.migrate(cloudState);
                else appState = cloudState;
                localStorage.setItem('zenitState', JSON.stringify(appState));
                
                const activeBtn = document.querySelector('.nav-item.active');
                if(activeBtn) UIModule.switchTab(activeBtn.dataset.target);
                UIModule.showToast('☁️ Datos sincronizados de la nube');
            } else {
                this.save();
            }
        }).catch(err => console.warn("Sync err", err));
    }
  };

  const AuthModule = {
      loginGoogle() {
          if(!auth) return UIModule.showToast("Error de conexión a Firebase");
          const provider = new firebase.auth.GoogleAuthProvider();
          auth.signInWithPopup(provider).then(() => {
              UIModule.closeAllModals();
              UIModule.showToast('Sesión iniciada con Google');
          }).catch(err => UIModule.showToast('Error: ' + err.message));
      },
      loginEmail() {
          if(!auth) return UIModule.showToast("Error de conexión a Firebase");
          const email = getEl('email-input').value.trim();
          const pass = getEl('password-input').value;
          if(!email || pass.length < 6) return UIModule.showToast('Correo inválido o clave corta (mín 6).');

          auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
               UIModule.closeAllModals();
               UIModule.showToast('Sesión iniciada correctamente');
            })
            .catch(err => {
               if(err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                  auth.createUserWithEmailAndPassword(email, pass)
                     .then(() => {
                        UIModule.closeAllModals();
                        UIModule.showToast('Cuenta creada con éxito');
                     })
                     .catch(e => UIModule.showToast('Error: ' + e.message));
               } else {
                  UIModule.showToast('Error: ' + err.message);
               }
            });
      },
      logout() {
          if(auth) {
              auth.signOut().then(() => {
                 UIModule.closeAllModals();
                 UIModule.showToast("Sesión cerrada");
              });
          }
      },
      initListener() {
          if(!auth) return;
          auth.onAuthStateChanged(user => {
              const authBtn = getEl('menu-auth-btn');
              if(!authBtn) return;

              if (user) {
                  authBtn.innerHTML = `
                  <button onclick="AuthModule.logout()">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--err)" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"></path></svg>
                    <span style="color:var(--err)">Cerrar Sesión (${user.email || 'Google'})</span>
                  </button>`;
                  StorageModule.syncFromCloud(user.uid);
              } else {
                  authBtn.innerHTML = `
                  <button onclick="UIModule.closeAllModals(); UIModule.openModal('modal-account')">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> 
                    Conectar Cuenta
                  </button>`;
              }
          });
      }
  };

  const GamificationModule = {
    addXP(amount) {
      appState.xp += amount;
      const xpNeeded = appState.level * 100;
      if(appState.xp >= xpNeeded) {
        appState.level++;
        appState.xp -= xpNeeded;
        UIModule.showToast(`Nivel Zenit ${appState.level} alcanzado`);
      }
      StorageModule.save();
      UIModule.updateMenuLevel();
    }
  };

  const UIModule = {
    initSplash() {
      setTimeout(() => {
        const s = getEl('splash-screen');
        if(s) {
           s.style.opacity = '0';
           setTimeout(() => s.style.display = 'none', 500);
        }
      }, 1500);
    },
    showToast(msg) {
      const toast = getEl('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    },
    openModal(id) {
      getEl('main-overlay').classList.add('open');
      getEl(id).classList.add('open');
    },
    closeAllModals() {
      getEl('main-overlay').classList.remove('open');
      getEl('side-menu').classList.remove('open');
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    },
    openMenu() {
      getEl('main-overlay').classList.add('open');
      getEl('side-menu').classList.add('open');
      this.updateMenuLevel();
    },
    updateMenuLevel() {
      getEl('menu-level-display').textContent = appState.level;
      getEl('menu-xp-display').textContent = appState.xp;
      const target = getEl('menu-xp-target');
      if (target) target.textContent = appState.level * 100;
    },
    switchTab(tabId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
      
      const targetScreen = getEl(`view-${tabId}`);
      if(targetScreen) targetScreen.classList.add('active');
      
      const targetBtn = document.querySelector(`.nav-item[data-target="${tabId}"]`);
      if(targetBtn) { targetBtn.classList.add('active'); targetBtn.setAttribute('aria-current', 'page'); }

      getEl('entreno-footer').classList.toggle('active', tabId === 'entreno' && UIState.selectedRoutineIndex !== null);

      if(tabId === 'dashboard') { CalendarModule.renderWeek(); TasksModule.render(); GoalsModule.render(); this.setGreeting(); }
      if(tabId === 'entreno') { RoutineModule.renderAll(); }
      if(tabId === 'metas') { GoalsModule.render(); TasksModule.render(); }
      if(tabId === 'calendario') { CalendarModule.renderFull(); CalendarModule.renderStats(); }
      UIState.renderedTabs[tabId] = true;
    },
    setGreeting() {
      const hour = new Date().getHours();
      const weekNum = Math.ceil(Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000)) / 7);
      
      let text = "Buenas noches";
      if (hour >= 8 && hour < 14) text = "Buenos días";
      if (hour >= 14 && hour < 22) text = "Buenas tardes";
      
      getEl('dash-greeting').textContent = `${text} · Semana ${weekNum}`;
    },
    initQuotes() {
      const frases = [
        "La mejor forma de predecir el futuro es creándolo.",
        "Cada mañana nacemos de nuevo. Lo que hacemos hoy importa.",
        "Los obstáculos son el coste de la grandeza. - Sharma",
        "Nunca dejes de aprender, porque la vida nunca deja de enseñar.",
        "Lo que no te mata te hace más fuerte. - Nietzsche",
        "No se trata de ser el mejor, sino de ser mejor de lo que eras ayer.",
        "Si puedes soñarlo, puedes hacerlo. - Ziglar",
        "No cuentes los días, haz que los días cuenten. - Ali",
        "Mente positiva, vibraciones positivas, vida positiva.",
        "La fortaleza no llega de la capacidad física, sino de la voluntad.",
        "El éxito no viene a ti, tú vas hacia él.",
        "Nadie eres tú y ese es tu superpoder.",
        "Sé más fuerte que tus excusas."
      ];
      getEl('motivational-quote').textContent = `"${frases[Math.floor(Math.random() * frases.length)]}"`;
    }
  };

  const CalendarModule = {
    renderWeek() {
      const today = new Date();
      const todayStr = getLocalDateStr(today);
      const container = getEl('week-calendar-container');
      const monday = new Date(today);
      monday.setDate(today.getDate() - (today.getDay() || 7) + 1);
      
      let html = '';
      const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const dStr = getLocalDateStr(d);
        const isToday = dStr === todayStr;
        const isLogged = appState.gymDays.includes(dStr);
        const isRest = appState.restDays.includes(dStr);
        const isFuture = d > today && !isToday;
        
        let dayClass = '';
        if(isLogged) dayClass = 'logged'; else if(isRest) dayClass = 'rest';
        html += `<div class="day-col ${isToday ? 'today' : ''} ${dayClass} ${isFuture ? 'future' : ''}"><div class="day-name">${days[i]}</div><div class="day-num">${d.getDate()}</div></div>`;
      }
      container.innerHTML = html;

      let streak = 0, consecutiveRest = 0, checkDate = new Date(today), isFirstDay = true, tempRestDays = 0;
      while(true) {
        const dStr = getLocalDateStr(checkDate);
        const isGym = appState.gymDays.includes(dStr);
        const isRest = appState.restDays.includes(dStr);
        if (isGym) { 
            streak += 1 + tempRestDays; 
            tempRestDays = 0; 
            consecutiveRest = 0; 
        } 
        else if (isRest) { 
            consecutiveRest++; 
            if (consecutiveRest >= 5) break; 
            tempRestDays++; 
        } 
        else { 
            if (!isFirstDay) break; 
        }
        isFirstDay = false; 
        checkDate.setDate(checkDate.getDate() - 1);
      }
      if (consecutiveRest < 5) streak += tempRestDays;

      getEl('streak-counter').innerHTML = streak > 0 ? `${SVG_ICONS.flame} Racha activa: ${streak} días` : "Empieza hoy tu racha.";
      const btnGroup = getEl('dash-actions');
      btnGroup.style.display = (appState.gymDays.includes(todayStr) || appState.restDays.includes(todayStr)) ? 'none' : 'flex';
    },
    renderFull() {
      const targetDate = new Date(); targetDate.setMonth(targetDate.getMonth() + UIState.currentMonthOffset);
      const year = targetDate.getFullYear(), month = targetDate.getMonth(), todayStr = getLocalDateStr(new Date());
      const months = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
      getEl('full-month-name').textContent = `${months[month]} ${year}`;
      
      let html = '';
      const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), startIdx = firstDay.getDay() || 7;
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startIdx - 1; i > 0; i--) html += `<div class="cal-day adjacent">${prevMonthLastDay - i + 1}</div>`;
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const dStr = getLocalDateStr(new Date(year, month, i));
        let dayClass = '';
        if(appState.gymDays.includes(dStr)) dayClass = 'logged'; else if(appState.restDays.includes(dStr)) dayClass = 'rest';
        html += `<div class="cal-day ${dayClass} ${dStr === todayStr ? 'today' : ''}" data-date="${dStr}">${i}</div>`;
      }
      const nextDays = (7 - ((startIdx - 1 + lastDay.getDate()) % 7)) % 7;
      for (let i = 1; i <= nextDays; i++) html += `<div class="cal-day adjacent">${i}</div>`;
      getEl('full-calendar-container').innerHTML = html;
    },
    renderStats() {
      getEl('stat-total').textContent = appState.gymDays.length;
      let maxStreak = 0;
      const allDays = [...new Set([...appState.gymDays, ...appState.restDays])].sort();
      if (allDays.length > 0) {
        let tempStreak = 0, tempRest = 0;
        for (let d = new Date(allDays[0]); d <= new Date(allDays[allDays.length - 1]); d.setDate(d.getDate() + 1)) {
           const dStr = getLocalDateStr(d);
           if (appState.gymDays.includes(dStr)) { 
               tempStreak += 1 + tempRest; 
               tempRest = 0; 
               if (tempStreak > maxStreak) maxStreak = tempStreak; 
           } 
           else if (appState.restDays.includes(dStr)) { 
               tempRest++; 
               if (tempRest >= 5) { tempStreak = 0; tempRest = 0; } 
               else { if (tempStreak > 0 && (tempStreak + tempRest) > maxStreak) maxStreak = tempStreak + tempRest; } 
           } 
           else { tempStreak = 0; tempRest = 0; }
        }
      }
      getEl('stat-streak').textContent = maxStreak;

      let hHtml = '';
      const keys = Object.keys(appState.history).sort().reverse().slice(0,5);
      keys.forEach(k => hHtml += `<div class="task-row"><div class="task-text" style="font-weight:800; color:var(--text-pri)">${k}</div><div style="color:var(--text-sec)">${appState.history[k].length} Ejs.</div></div>`);
      getEl('history-container').innerHTML = hHtml || '<div style="color:var(--text-sec); font-size:13px;">No hay historial.</div>';
    },
    cycleDayState(dateStr) {
      triggerHaptic(10);
      const isGym = appState.gymDays.includes(dateStr), isRest = appState.restDays.includes(dateStr);
      if(isGym) { appState.gymDays = appState.gymDays.filter(d => d !== dateStr); appState.restDays.push(dateStr); } 
      else if (isRest) { appState.restDays = appState.restDays.filter(d => d !== dateStr); } 
      else { appState.gymDays.push(dateStr); }
      StorageModule.save(); this.renderFull(); this.renderStats(); if(UIState.renderedTabs.dashboard) this.renderWeek();
    },
    markDay(dateStr, type) {
      triggerHaptic(10);
      appState.gymDays = appState.gymDays.filter(d => d !== dateStr);
      appState.restDays = appState.restDays.filter(d => d !== dateStr);
      if(type === 'gym') appState.gymDays.push(dateStr);
      if(type === 'rest') appState.restDays.push(dateStr);
      StorageModule.save(); this.renderWeek(); if(UIState.renderedTabs.calendario) { this.renderFull(); this.renderStats(); }
    }
  };

  const RoutineModule = {
    getActiveList() { return UIState.routineViewMode === 'days' ? appState.weeklyRoutine : appState.muscleRoutine; },
    renderAll() {
      const listView = getEl('routine-list-view'), dayView = getEl('routine-day-view'), footer = getEl('entreno-footer');
      
      document.querySelectorAll('.toggle-btn').forEach(btn => {
         btn.classList.toggle('active', btn.dataset.view === UIState.routineViewMode);
      });

      if (UIState.selectedRoutineIndex === null) {
        listView.style.display = 'block'; dayView.style.display = 'none'; footer.classList.remove('active');
        const list = this.getActiveList();
        let html = '';
        list.forEach((item, idx) => {
          const hasExercises = item.exercises.length > 0;
          let leftText, rightText;
          
          if (UIState.routineViewMode === 'days') {
             leftText = item.label; 
             rightText = hasExercises ? (item.name || 'Rutina') : 'Descanso';
          } else {
             leftText = item.name || 'Nuevo Grupo'; 
             rightText = hasExercises ? `${item.exercises.length} Ejs.` : 'Vacío';
          }

          html += `
            <div class="card" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding: 24px 20px;" data-open-routine="${idx}">
              <span style="font-size:18px; font-weight:900;">${leftText}</span>
              <span style="color:var(--text-sec); font-size:14px; font-weight:600;">${rightText} <span style="margin-left:8px; font-size:18px;">›</span></span>
            </div>`;
        });

        if (UIState.routineViewMode === 'muscles') {
          html += `<button class="btn-primary btn-secondary" onclick="RoutineModule.addGroup()" style="margin-top:10px;">+ AÑADIR GRUPO</button>`;
        }

        getEl('routine-list-container').innerHTML = html;
      } else {
        listView.style.display = 'none'; dayView.style.display = 'block'; footer.classList.add('active');
        const list = this.getActiveList();
        const activeItem = list[UIState.selectedRoutineIndex];
        
        getEl('routine-day-title').textContent = UIState.routineViewMode === 'days' ? activeItem.label : 'Grupo';
        const nameInput = getEl('routine-name-input');
        nameInput.value = activeItem.name || '';
        nameInput.placeholder = UIState.routineViewMode === 'days' ? 'Ej. Pecho y tríceps' : 'Nombre del grupo (ej. Pierna)';

        const container = getEl('routine-container'), emptyState = getEl('empty-routine');
        if(activeItem.exercises.length === 0) {
          container.innerHTML = ''; emptyState.style.display = 'block';
          getEl('empty-wisdom-quote').textContent = wisdomQuotes[Math.floor(Math.random()*wisdomQuotes.length)];
          getEl('empty-routine-title').textContent = UIState.routineViewMode === 'days' ? 'Descanso programado' : 'Grupo vacío';
          this.updateTotalVolume(); 
        } else {
          emptyState.style.display = 'none';
          let html = '';
          activeItem.exercises.forEach((ex, exIndex) => {
            let setsHtml = '';
            ex.sets.forEach((set, setIndex) => {
              setsHtml += `
                <div class="set-grid set-row" data-ex="${exIndex}" data-set="${setIndex}">
                  <div class="task-check btn-complete-set" style="width:20px;height:20px;border-color:var(--border);">✓</div>
                  <div class="set-label">${setIndex + 1}</div>
                  <input type="number" step="0.5" min="0" max="999" class="inline-input input-val" data-field="weight" value="${set.weight}">
                  <input type="number" min="1" max="200" class="inline-input input-val" data-field="reps" value="${set.reps}">
                  <input type="number" min="1" max="10" class="inline-input input-val" data-field="rpe" value="${set.rpe}">
                </div>`;
            });
            html += `
              <div class="card card-anim" id="ex-${ex.id}">
                <div class="ex-header">
                  <input type="text" class="ex-name-input" value="${ex.name}" placeholder="Nombre..." list="exercise-library" maxlength="60" data-ex="${exIndex}">
                  <div>
                    ${activeItem.exercises.length > 1 ? `<button class="btn-icon btn-move-up" data-ex="${exIndex}">↑</button><button class="btn-icon btn-move-down" data-ex="${exIndex}">↓</button>` : ''}
                    <button class="btn-icon btn-dup-ex" data-ex="${exIndex}">${SVG_ICONS.copy}</button>
                    <button class="btn-icon btn-del-ex" style="color:var(--err)" data-ex="${exIndex}">${SVG_ICONS.trash}</button>
                  </div>
                </div>
                <div class="set-header-grid"><div></div><div>SET</div><div>KG</div><div>REPS</div><div>RPE</div></div>
                <div class="sets-container">${setsHtml}</div>
                <button class="btn-primary btn-secondary btn-add-set" style="font-size: 13px; padding: 10px;" data-ex="${exIndex}">+ AÑADIR SERIE</button>
                <div class="stats-row" id="stats-${ex.id}">
                  <div>Volumen: <span class="stats-val vol-val">0 kg</span></div>
                  <div>1RM Est.: <span class="stats-val rm-val">0 kg</span></div>
                </div>
              </div>`;
          });
          container.innerHTML = html;
          activeItem.exercises.forEach(ex => this.updateExStats(ex));
          this.updateTotalVolume();
        }

        const delBtn = getEl('btn-delete-group');
        if (UIState.routineViewMode === 'muscles') {
           delBtn.style.display = 'block';
           delBtn.onclick = () => {
              appState.muscleRoutine.splice(UIState.selectedRoutineIndex, 1);
              StorageModule.save();
              RoutineModule.closeRoutine();
           };
        } else {
           delBtn.style.display = 'none';
        }
      }
    },
    openRoutine(idx) { UIState.selectedRoutineIndex = idx; this.renderAll(); },
    closeRoutine() { UIState.selectedRoutineIndex = null; this.renderAll(); },
    getActiveRoutine() { return this.getActiveList()[UIState.selectedRoutineIndex].exercises; },
    addExercise() { this.getActiveRoutine().push({ id: generateUUID(), name: "", sets: [{ id: generateUUID(), weight: 0, reps: 0, rpe: 0 }] }); StorageModule.save(); this.renderAll(); },
    addGroup() {
      appState.muscleRoutine.push({ id: generateUUID(), name: '', exercises: [] });
      StorageModule.save();
      this.renderAll();
    },
    duplicateExercise(idx) { const routine = this.getActiveRoutine(); const copy = JSON.parse(JSON.stringify(routine[idx])); copy.id = generateUUID(); copy.sets.forEach(s => s.id = generateUUID()); routine.splice(idx + 1, 0, copy); StorageModule.save(); this.renderAll(); },
    moveExercise(idx, dir) { const r = this.getActiveRoutine(); if(dir === 'up' && idx > 0) [r[idx], r[idx-1]] = [r[idx-1], r[idx]]; else if (dir === 'down' && idx < r.length - 1) [r[idx], r[idx+1]] = [r[idx+1], r[idx]]; StorageModule.save(); this.renderAll(); },
    updateExStats(ex) {
      let vol = 0, rm = 0;
      ex.sets.forEach(s => { vol += s.weight * s.reps; const epley = s.weight * (1 + 0.0333 * s.reps); if(epley > rm) rm = epley; });
      const sd = getEl(`stats-${ex.id}`);
      if(sd) { sd.querySelector('.vol-val').textContent = `${vol.toFixed(0)} kg`; sd.querySelector('.rm-val').textContent = `${rm.toFixed(1)} kg`; }
      this.updateTotalVolume();
    },
    updateTotalVolume() {
      if (UIState.selectedRoutineIndex === null) return;
      let tot = 0; this.getActiveRoutine().forEach(ex => ex.sets.forEach(s => tot += s.weight * s.reps));
      getEl('total-session-volume').textContent = `${tot.toFixed(0)} kg`;
    },
    simulateAIImport() {
      const fileInput = getEl('ai-file-input');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
      
      const ua = getEl('ai-upload-area'), la = getEl('ai-loading-area');
      ua.style.display = 'none'; la.style.display = 'block';
      
      setTimeout(() => {
         const routine = this.getActiveRoutine();
         routine.push({ id: generateUUID(), name: "Press IA Automático", sets: [{ id: generateUUID(), weight: 50, reps: 10, rpe: 8 }] });
         StorageModule.save(); this.renderAll();
         UIModule.closeAllModals(); UIModule.showToast('Rutina IA Importada');
         ua.style.display = 'block'; la.style.display = 'none';
         fileInput.value = '';
      }, 2000);
    },
    executeSave() {
      triggerHaptic([20,50,20]);
      const list = this.getActiveList(), activeItem = list[UIState.selectedRoutineIndex];
      const today = new Date(), jsDay = today.getDay() === 0 ? 6 : today.getDay() - 1; 

      if (UIState.routineViewMode === 'days' && jsDay === UIState.selectedRoutineIndex && activeItem.exercises.length > 0) {
        const targetDate = getLocalDateStr();
        appState.history[targetDate] = JSON.parse(JSON.stringify(activeItem.exercises));
      }
      StorageModule.save();
      UIModule.showToast('Rutina guardada (+50 XP)');
      this.closeRoutine();
    }
  };

  const TimerModule = {
    startRest() {
      clearInterval(UIState.timerInterval); let timeLeft = 90;
      getEl('rest-timer').style.display = 'flex';
      UIState.timerInterval = setInterval(() => {
        timeLeft--; getEl('timer-display').textContent = `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}`;
        if(timeLeft <= 0) this.stopRest();
      }, 1000);
    },
    stopRest() { clearInterval(UIState.timerInterval); getEl('rest-timer').style.display = 'none'; }
  };

  const TasksModule = {
    render() {
      const html = appState.tasks.map((t, i) => `<div class="task-row ${t.done?'done':''}"><div class="task-check btn-task" data-idx="${i}">✓</div><div class="task-text">${t.text}</div><button class="btn-icon task-delete" data-idx="${i}">${SVG_ICONS.trash}</button></div>`).join('');
      const dashHtml = appState.tasks.map((t, i) => `<div class="task-row ${t.done?'done':''}"><div class="task-check btn-task" data-idx="${i}">✓</div><div class="task-text">${t.text}</div></div>`).join('');
      if(getEl('tasks-container-edit')) getEl('tasks-container-edit').innerHTML = html;
      if(getEl('tasks-container-dash')) getEl('tasks-container-dash').innerHTML = dashHtml;
      if(getEl('dash-tasks-empty')) getEl('dash-tasks-empty').style.display = appState.tasks.length === 0 ? 'block' : 'none';
    },
    add(text) {
      appState.tasks.push({text: text.substring(0,40), done: false}); StorageModule.save(); this.render();
    }
  };

  const GoalsModule = {
    render() {
      const htmlEdit = appState.goals.map((g, i) => `<div class="card"><div class="ex-header" style="margin-bottom:8px; border:none; padding-bottom:0;"><div style="font-weight:900; font-size: 16px;">${g.title}</div><button class="btn-icon" style="color:var(--err)" data-goal-del="${i}">${SVG_ICONS.trash}</button></div><div style="font-size:13px; color:var(--pri); font-weight: 800;">${SVG_ICONS.clock} ${g.deadline}</div></div>`).join('');
      const htmlDash = appState.goals.map((g, i) => `<div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);"><div style="font-size:14px; font-weight:800; color:var(--text-pri);">${g.title}</div><div style="font-size:12px; color:var(--pri); font-weight: 800; margin-top:4px;">${SVG_ICONS.clock} ${g.deadline}</div></div>`).join('');
      const cDash = getEl('goals-container-dash');
      if(getEl('goals-container-edit')) getEl('goals-container-edit').innerHTML = htmlEdit;
      if(cDash) { cDash.innerHTML = htmlDash; if(cDash.lastElementChild) cDash.lastElementChild.style.borderBottom = 'none'; }
      if(getEl('dash-goals-empty')) getEl('dash-goals-empty').style.display = appState.goals.length === 0 ? 'block' : 'none';
    },
    add() {
      const t = getEl('goal-title').value.trim(), d = getEl('goal-deadline').value.trim();
      if(!t || !d) return UIModule.showToast('Datos inválidos');
      appState.goals.push({title: t.substring(0,60), deadline: d.substring(0,60)}); StorageModule.save(); this.render();
      getEl('goal-title').value = ''; getEl('goal-deadline').value = '';
    }
  };

  // --- INIT & EVENTS ---
  function initEvents() {
    document.body.addEventListener('click', e => { const nt = e.target.closest('.nav-trigger'); if(nt) UIModule.switchTab(nt.dataset.target); });
    
    getEl('btn-mark-today').addEventListener('click', () => CalendarModule.markDay(getLocalDateStr(), 'gym'));
    getEl('btn-mark-rest').addEventListener('click', () => CalendarModule.markDay(getLocalDateStr(), 'rest'));
    
    getEl('btn-add-task').addEventListener('click', () => { const i = getEl('new-task-input'); if(i.value) TasksModule.add(i.value); i.value = ''; });
    document.body.addEventListener('click', e => {
      if(e.target.classList.contains('btn-task')) { const idx = e.target.dataset.idx; appState.tasks[idx].done = !appState.tasks[idx].done; if(appState.tasks[idx].done) GamificationModule.addXP(10); StorageModule.save(); TasksModule.render(); }
      if(e.target.classList.contains('task-delete')) { appState.tasks.splice(e.target.dataset.idx, 1); StorageModule.save(); TasksModule.render(); }
      const gBtn = e.target.closest('button'); if(gBtn && gBtn.dataset.goalDel !== undefined) { appState.goals.splice(gBtn.dataset.goalDel, 1); StorageModule.save(); GoalsModule.render(); }
    });
    getEl('btn-add-goal').addEventListener('click', () => GoalsModule.add());

    getEl('full-calendar-container').addEventListener('click', e => { if(e.target.classList.contains('cal-day') && !e.target.classList.contains('adjacent')) CalendarModule.cycleDayState(e.target.dataset.date); });
    getEl('cal-prev').addEventListener('click', () => { UIState.currentMonthOffset--; CalendarModule.renderFull(); });
    getEl('cal-next').addEventListener('click', () => { UIState.currentMonthOffset++; CalendarModule.renderFull(); });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
       btn.addEventListener('click', (e) => {
          UIState.routineViewMode = e.target.dataset.view;
          RoutineModule.renderAll();
       });
    });

    getEl('routine-list-container').addEventListener('click', e => { const c = e.target.closest('.card'); if(c && c.dataset.openRoutine !== undefined) RoutineModule.openRoutine(parseInt(c.dataset.openRoutine, 10)); });
    getEl('btn-back-week').addEventListener('click', () => RoutineModule.closeRoutine());
    getEl('routine-name-input').addEventListener('input', e => { 
       if(UIState.selectedRoutineIndex !== null) { 
          RoutineModule.getActiveList()[UIState.selectedRoutineIndex].name = e.target.value.substring(0,40); 
          StorageModule.save(); 
       } 
    });
    getEl('btn-add-exercise').addEventListener('click', () => RoutineModule.addExercise());
    
    getEl('btn-save-routine').addEventListener('click', () => UIModule.openModal('modal-energy'));
    document.querySelectorAll('.btn-energy').forEach(btn => {
      btn.addEventListener('click', () => {
         UIModule.closeAllModals();
         RoutineModule.executeSave();
         GamificationModule.addXP(50);
      });
    });

    getEl('btn-cancel-timer').addEventListener('click', () => TimerModule.stopRest());

    const rCont = getEl('routine-container');
    rCont.addEventListener('click', e => {
      const btn = e.target.closest('button, .btn-complete-set'); if(!btn) return;
      const exIdx = parseInt(btn.dataset.ex, 10), routine = RoutineModule.getActiveRoutine();
      if(btn.classList.contains('btn-add-set')) { const sets = routine[exIdx].sets; const ls = sets.length ? sets[sets.length-1] : {weight:0, reps:0, rpe:0}; sets.push({...ls, id: generateUUID()}); StorageModule.save(); RoutineModule.renderAll(); }
      else if(btn.classList.contains('btn-del-ex')) { routine.splice(exIdx, 1); StorageModule.save(); RoutineModule.renderAll(); }
      else if(btn.classList.contains('btn-dup-ex')) { RoutineModule.duplicateExercise(exIdx); }
      else if(btn.classList.contains('btn-move-up')) { RoutineModule.moveExercise(exIdx, 'up'); }
      else if(btn.classList.contains('btn-move-down')) { RoutineModule.moveExercise(exIdx, 'down'); }
      else if(btn.classList.contains('btn-complete-set')) { triggerHaptic(15); btn.closest('.set-row').classList.toggle('completed'); TimerModule.startRest(); }
    });

    let dt;
    rCont.addEventListener('input', e => {
      const routine = RoutineModule.getActiveRoutine();
      if(e.target.classList.contains('ex-name-input')) { clearTimeout(dt); dt = setTimeout(() => { routine[e.target.dataset.ex].name = e.target.value.substring(0,60).trim(); StorageModule.save(); }, 300); }
      else if(e.target.classList.contains('input-val')) {
        let val = parseFloat(e.target.value) || 0; const field = e.target.dataset.field;
        if(field==='rpe' && val>10) { val=10; e.target.value=10; } if(field==='reps' && val>200) { val=200; e.target.value=200; }
        const r = e.target.closest('.set-row'), exIdx = r.dataset.ex;
        routine[exIdx].sets[r.dataset.set][field] = val; RoutineModule.updateExStats(routine[exIdx]);
        clearTimeout(dt); dt = setTimeout(() => StorageModule.save(), 500);
      }
    });

    const urlParams = new URLSearchParams(window.location.search), st = urlParams.get('tab');
    if (st && ['dashboard', 'entreno', 'metas', 'calendario'].includes(st)) UIModule.switchTab(st); else UIModule.switchTab('dashboard'); 
  }

  // EXPORTAMOS PARA QUE HTML LOS ENCUENTRE
  window.AuthModule = AuthModule;
  window.UIModule = UIModule;
  window.RoutineModule = RoutineModule;
  window.CalendarModule = CalendarModule;

  document.addEventListener('DOMContentLoaded', () => {
    StorageModule.load();
    UIModule.initSplash();
    UIModule.initQuotes();
    AuthModule.initListener();
    initEvents();
    if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
  });

})();