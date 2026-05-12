/* ═══════════════════════════════════════════════════════════
   ZENIT v5.0 — app.js
═══════════════════════════════════════════════════════════ */
'use strict';

(function() {
  const APP_VERSION = '5.0.0';
  
  // --- STATE ---
  let appState = {
    schemaVersion: 4,
    gymDays: [], 
    restDays: [], 
    weeklyRoutine: [
      { day: 'Lunes', name: '', exercises: [] },
      { day: 'Martes', name: '', exercises: [] },
      { day: 'Miércoles', name: '', exercises: [] },
      { day: 'Jueves', name: '', exercises: [] },
      { day: 'Viernes', name: '', exercises: [] },
      { day: 'Sábado', name: '', exercises: [] },
      { day: 'Domingo', name: '', exercises: [] }
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
    selectedDayIndex: null,
    renderedTabs: { dashboard: false, entreno: false, metas: false, calendario: false }
  };

  // --- HELPERS ---
  const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2));
  const getLocalDateStr = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const triggerHaptic = (pattern) => { if(navigator.vibrate) navigator.vibrate(pattern); };
  const getEl = (id) => document.getElementById(id);

  // --- MODULES ---
  const StorageModule = {
    load() {
      const saved = localStorage.getItem('zenitState');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion < 4) this.migrate(parsed);
        else appState = parsed;
      }
      const savedSeconds = sessionStorage.getItem('zenitSessionSecs');
      if (savedSeconds) UIState.sessionSeconds = parseInt(savedSeconds, 10);
    },
    save() {
      localStorage.setItem('zenitState', JSON.stringify(appState));
    },
    migrate(oldState) {
      appState = { ...appState, ...oldState, schemaVersion: 4 };
      if (!appState.weeklyRoutine) {
        appState.weeklyRoutine = [
          { day: 'Lunes', name: '', exercises: [] }, { day: 'Martes', name: '', exercises: [] },
          { day: 'Miércoles', name: '', exercises: [] }, { day: 'Jueves', name: '', exercises: [] },
          { day: 'Viernes', name: '', exercises: [] }, { day: 'Sábado', name: '', exercises: [] },
          { day: 'Domingo', name: '', exercises: [] }
        ];
      }
      this.save();
    }
  };

  const UIModule = {
    showToast(msg) {
      const toast = getEl('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    },
    switchTab(tabId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      
      const targetScreen = getEl(`view-${tabId}`);
      if(targetScreen) targetScreen.classList.add('active');
      
      const targetBtn = document.querySelector(`.nav-item[data-target="${tabId}"]`);
      if(targetBtn) {
        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-current', 'page');
      }

      getEl('entreno-footer').classList.toggle('active', tabId === 'entreno' && UIState.selectedDayIndex !== null);

      if(tabId === 'dashboard') { CalendarModule.renderWeek(); TasksModule.render(); GoalsModule.render(); UIModule.setGreeting(); }
      if(tabId === 'entreno') { RoutineModule.renderAll(); TimerModule.startStopwatch(); }
      if(tabId === 'metas') { GoalsModule.render(); TasksModule.render(); }
      if(tabId === 'calendario') { CalendarModule.renderFull(); CalendarModule.renderStats(); }
      UIState.renderedTabs[tabId] = true;
    },
    setGreeting() {
      const hour = new Date().getHours();
      const weekNum = Math.ceil(Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (24 * 60 * 60 * 1000)) / 7);
      let text = "Buenos días";
      if(hour >= 14 && hour < 20) text = "Buenas tardes";
      if(hour >= 20) text = "Buenas noches";
      getEl('dash-greeting').textContent = `${text} · Semana ${weekNum}`;
    },
    initQuotes() {
      const frases = [
        "La mejor forma de predecir el futuro es creándolo. - Peter Drucker",
        "Cada mañana nacemos de nuevo. Lo que hacemos hoy es lo que más importa.",
        "Los obstáculos son el coste de la grandeza. - Robin Sharma",
        "Camina hacia el futuro, abriendo nuevas puertas y probando cosas nuevas... - Walt Disney",
        "Nunca dejes de aprender, porque la vida nunca deja de enseñar.",
        "Unirse es un comienzo. Mantenerse juntos es un progreso. Trabajar juntos es el éxito. - Henry Ford",
        "Cuando no podemos cambiar la situación a la que nos enfrentamos, el reto consiste en cambiarnos a nosotros. - Victor Frankl",
        "Si lloras porque no puedes ver el sol, las lágrimas no te dejarán ver las estrellas. - Rabindranath Tagore",
        "Es una locura odiar a todas las rosas solo porque una te pinchó. - El Principito",
        "Cada uno de nosotros necesita demostrar cuánto nos preocupamos por los demás. - Diana de Gales",
        "Empieza haciendo lo necesario, después lo posible y, de repente, te encontrarás haciendo lo imposible. - Francisco de Asís",
        "La mayor aventura que puedes emprender es vivir la vida de tus sueños. - Oprah Winfrey",
        "Tu sueño no tiene fecha de caducidad. Respira hondo y vuelve a intentarlo.",
        "No renuncies a hacer lo que realmente quieres hacer. - Ella Fitzgerald",
        "Tu tiempo es limitado, no lo malgastes viviendo la vida de otra persona. - Steve Jobs",
        "Lo que no te mata te hace más fuerte. - Friedrich Nietzsche",
        "No se trata de ser el mejor, sino de ser mejor de lo que eras ayer.",
        "La felicidad no es algo hecho. Proviene de tus propias acciones. - Dalai Lama",
        "Si puedes soñarlo, puedes hacerlo. - Zig Ziglar",
        "No cuentes los días, haz que los días cuenten. - Muhammad Ali",
        "El momento en que te rindes es el momento en que dejas que otro gane. - Kobe Bryant",
        "No intentes construir un cuerpo de verano, intenta construir un estilo de vida.",
        "No se sale adelante celebrando éxitos sino superando clamorosos fracasos. - Orison Marden",
        "Los récords están para ser superados. - Michael Schumacher",
        "Mente positiva, vibraciones positivas, vida positiva.",
        "Estate tan ocupado en mejorarte a ti mismo que no tengas tiempo para criticar a los demás.",
        "Soy competitiva conmigo misma. Siempre intento superar mis propios límites. - Tyra Banks",
        "Sé alguien que cambie las reglas del juego, el mundo ya está lleno de jugadores.",
        "Es un proceso lento, pero abandonar no lo acelerará.",
        "No temas crecer lentamente; teme solo quedarte quieto. - Proverbio chino",
        "La fortaleza no llega de la capacidad física, sino de una voluntad indomable. - Mahatma Gandhi",
        "Haz ejercicio porque amas tu cuerpo, no porque lo odies.",
        "Sé fuerte a pesar de ello. Algún día serás fuerte gracias a ello.",
        "El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos. - Michael Jordan",
        "Una zona de confort es un lugar hermoso, pero nada crece allí.",
        "No esperes la oportunidad. Créala.",
        "Cuando estoy sonriendo y divirtiéndome es cuando mejor me sale. - Simone Biles",
        "No dejes que Internet te meta prisa. Nadie está posteando sobre su fracaso.",
        "El éxito no viene a ti, tú vas hacia él.",
        "La excelencia no es un acto de un día, sino un hábito. - Shaquille O’Neal",
        "Los Ganadores nunca se rinden y los que se rinden nunca ganan. - Vince Lombardi",
        "Lo que te frena no es lo que eres, sino lo que crees que no eres.",
        "Acepta tus victorias, aprécialas, utilízalas, pero no te conformes. - Mia Hamm",
        "Si el plan no funciona, cambia el plan. Pero nunca el objetivo.",
        "El éxito no es definitivo; el fracaso no es fatal: lo que cuenta es el valor para continuar. - Winston Churchill",
        "La clave del éxito es centrarse en los objetivos, no en los obstáculos.",
        "Saca lo mejor de ti mismo... porque eso es todo lo que hay en ti. - R. Waldo Emerson",
        "Trabaja hasta que tu cuenta bancaria parezca un número de teléfono.",
        "El inversor de hoy no se beneficia del crecimiento de ayer. - Warren Buffett",
        "No le cuentes a la gente tus planes. Muéstrales tus resultados.",
        "La inspiración existe, pero debe encontrarte trabajando. - Pablo Picasso",
        "Se aprende más del fracaso que del éxito. El fracaso forja el carácter.",
        "Es imposible vivir sin fracasar en algo. - J.K. Rowling",
        "El objetivo no es ser mejor que el otro, sino tu yo anterior. - Dalai Lama",
        "Lo grande no sucede solo por impulso, es una sucesión de pequeñas cosas. - Van Gogh",
        "Nunca eres demasiado viejo para marcarte otra meta o para tener un nuevo sueño. - C.S. Lewis",
        "Las personas más felices no tienen lo mejor de todo, simplemente sacan lo mejor de todo.",
        "Nadie eres tú y ese es tu superpoder.",
        "No hables, solo actúa. No digas, solo muestra. No prometas, solo demuestra.",
        "Mi único competidor es la persona que fui ayer.",
        "Olvida lo que te hizo daño, pero nunca olvides lo que te enseñó.",
        "No has llegado hasta aquí para llegar solo hasta aquí.",
        "Por cada minuto invertido en organizarse se gana una hora. - Benjamin Franklin",
        "El que se conquista a sí mismo es el guerrero más poderoso. - Confucio",
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
        if(isLogged) dayClass = 'logged';
        else if(isRest) dayClass = 'rest';
        
        html += `<div class="day-col ${isToday ? 'today' : ''} ${dayClass} ${isFuture ? 'future' : ''}">
          <div class="day-name">${days[i]}</div><div class="day-num">${d.getDate()}</div></div>`;
      }
      container.innerHTML = html;

      let streak = 0;
      let consecutiveRest = 0;
      let checkDate = new Date(today);
      let isFirstDay = true;
      let tempRestDays = 0;

      while(true) {
        const dStr = getLocalDateStr(checkDate);
        const isGym = appState.gymDays.includes(dStr);
        const isRest = appState.restDays.includes(dStr);

        if (isGym) {
          streak++;
          streak += tempRestDays; // Los descansos temporales son válidos si se envuelven en entrenamiento
          tempRestDays = 0;
          consecutiveRest = 0;
        } else if (isRest) {
          consecutiveRest++;
          if (consecutiveRest >= 5) {
            // Racha rota, los días de descanso acumulados al inicio de este tramo no suman
            break; 
          }
          tempRestDays++;
        } else {
          if (!isFirstDay) break; 
        }
        isFirstDay = false;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Sumamos los descansos si la racha sigue viva (menos de 5 días descansados)
      if (consecutiveRest < 5) {
         streak += tempRestDays;
      }

      getEl('streak-counter').textContent = streak > 0 ? `🔥 Racha viva: ${streak} días` : "Empieza hoy tu racha.";

      const btnGroup = getEl('dash-actions');
      const isMarked = appState.gymDays.includes(todayStr) || appState.restDays.includes(todayStr);
      btnGroup.style.display = isMarked ? 'none' : 'flex';
    },
    renderFull() {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + UIState.currentMonthOffset);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const todayStr = getLocalDateStr(new Date());
      const months = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO","JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
      getEl('full-month-name').textContent = `${months[month]} ${year}`;
      
      let html = '';
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startIdx = firstDay.getDay() || 7;
      
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startIdx - 1; i > 0; i--) html += `<div class="cal-day adjacent">${prevMonthLastDay - i + 1}</div>`;
      
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const dStr = getLocalDateStr(new Date(year, month, i));
        let dayClass = '';
        if(appState.gymDays.includes(dStr)) dayClass = 'logged';
        else if(appState.restDays.includes(dStr)) dayClass = 'rest';
        
        const isToday = dStr === todayStr ? 'today' : '';
        html += `<div class="cal-day ${dayClass} ${isToday}" data-date="${dStr}">${i}</div>`;
      }

      const totalCells = startIdx - 1 + lastDay.getDate();
      const nextDays = (7 - (totalCells % 7)) % 7;
      for (let i = 1; i <= nextDays; i++) html += `<div class="cal-day adjacent">${i}</div>`;
      
      getEl('full-calendar-container').innerHTML = html;
    },
    renderStats() {
      getEl('stat-total').textContent = appState.gymDays.length;
      
      let maxStreak = 0;
      const allDays = [...new Set([...appState.gymDays, ...appState.restDays])].sort();
      
      if (allDays.length > 0) {
        const startDate = new Date(allDays[0]);
        const endDate = new Date(allDays[allDays.length - 1]);
        
        let tempStreak = 0;
        let tempRest = 0;
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
           const dStr = getLocalDateStr(d);
           const isGym = appState.gymDays.includes(dStr);
           const isRest = appState.restDays.includes(dStr);
           
           if (isGym) {
              tempStreak += 1 + tempRest;
              tempRest = 0;
              if (tempStreak > maxStreak) maxStreak = tempStreak;
           } else if (isRest) {
              tempRest++;
              if (tempRest >= 5) {
                 // Si se rompe, los descansos acumulados finales desaparecen
                 tempStreak = 0;
                 tempRest = 0;
              } else {
                 if (tempStreak > 0 && (tempStreak + tempRest) > maxStreak) {
                    maxStreak = tempStreak + tempRest;
                 }
              }
           } else {
              tempStreak = 0;
              tempRest = 0;
           }
        }
      }

      getEl('stat-streak').textContent = maxStreak;

      let hHtml = '';
      const keys = Object.keys(appState.history).sort().reverse().slice(0,5);
      keys.forEach(k => {
        hHtml += `<div class="task-row"><div class="task-text" style="font-weight:800; color:var(--text-pri)">${k}</div><div style="margin-left:auto; color:var(--text-sec)">${appState.history[k].length} Ejs.</div></div>`;
      });
      getEl('history-container').innerHTML = hHtml || '<div style="color:var(--text-sec); font-size:13px;">No hay historial.</div>';
    },
    cycleDayState(dateStr) {
      triggerHaptic(10);
      const isGym = appState.gymDays.includes(dateStr);
      const isRest = appState.restDays.includes(dateStr);

      if(isGym) {
         appState.gymDays = appState.gymDays.filter(d => d !== dateStr);
         appState.restDays.push(dateStr);
      } else if (isRest) {
         appState.restDays = appState.restDays.filter(d => d !== dateStr);
      } else {
         appState.gymDays.push(dateStr);
      }

      StorageModule.save();
      this.renderFull();
      this.renderStats();
      if(UIState.renderedTabs.dashboard) this.renderWeek();
    },
    markDay(dateStr, type) {
      triggerHaptic(10);
      appState.gymDays = appState.gymDays.filter(d => d !== dateStr);
      appState.restDays = appState.restDays.filter(d => d !== dateStr);
      if(type === 'gym') appState.gymDays.push(dateStr);
      if(type === 'rest') appState.restDays.push(dateStr);
      
      StorageModule.save();
      this.renderWeek();
      if(UIState.renderedTabs.calendario) { this.renderFull(); this.renderStats(); }
    }
  };

  const RoutineModule = {
    renderAll() {
      const listView = getEl('routine-week-list-view');
      const dayView = getEl('routine-day-view');
      const footer = getEl('entreno-footer');

      if (UIState.selectedDayIndex === null) {
        // Mostrar la lista de los 7 días
        listView.style.display = 'block';
        dayView.style.display = 'none';
        footer.classList.remove('active');

        let html = '';
        appState.weeklyRoutine.forEach((dayInfo, idx) => {
          const hasExercises = dayInfo.exercises.length > 0;
          const subtitle = hasExercises ? (dayInfo.name ? dayInfo.name : 'Rutina') : 'Descanso';
          html += `
            <div class="card" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; padding: 24px 20px;" data-open-day="${idx}">
              <span style="font-size:18px; font-weight:900;">${dayInfo.day}</span>
              <span style="color:var(--text-sec); font-size:14px; font-weight:600;">${subtitle} <span style="margin-left:8px; font-size:18px;">›</span></span>
            </div>
          `;
        });
        getEl('routine-week-list').innerHTML = html;

      } else {
        // Mostrar un día específico
        listView.style.display = 'none';
        dayView.style.display = 'block';
        footer.classList.add('active');

        const dayInfo = appState.weeklyRoutine[UIState.selectedDayIndex];
        getEl('routine-day-title').textContent = dayInfo.day;
        getEl('routine-name-input').value = dayInfo.name;

        const container = getEl('routine-container');
        const emptyState = getEl('empty-routine');

        if(dayInfo.exercises.length === 0) {
          container.innerHTML = '';
          emptyState.style.display = 'block';
          this.updateTotalVolume();
          return;
        }
        emptyState.style.display = 'none';

        let html = '';
        dayInfo.exercises.forEach((ex, exIndex) => {
          let setsHtml = '';
          ex.sets.forEach((set, setIndex) => {
            // Sin botón de eliminar serie
            setsHtml += `
              <div class="set-grid set-row" data-ex="${exIndex}" data-set="${setIndex}">
                <div class="task-check btn-complete-set" style="width:20px;height:20px;border-color:var(--border);">✓</div>
                <div class="set-label">${setIndex + 1}</div>
                <input type="number" step="0.5" min="0" max="999" class="inline-input input-val" data-field="weight" value="${set.weight}">
                <input type="number" min="1" max="200" class="inline-input input-val" data-field="reps" value="${set.reps}">
                <input type="number" min="1" max="10" class="inline-input input-val" data-field="rpe" value="${set.rpe}">
              </div>
            `;
          });

          html += `
            <div class="card card-anim" id="ex-${ex.id}">
              <div class="ex-header">
                <input type="text" class="ex-name-input" value="${ex.name}" placeholder="Nombre..." list="exercise-library" maxlength="60" data-ex="${exIndex}">
                <div>
                  ${dayInfo.exercises.length > 1 ? `<button class="btn-icon btn-move-up" data-ex="${exIndex}">↑</button><button class="btn-icon btn-move-down" data-ex="${exIndex}">↓</button>` : ''}
                  <button class="btn-icon btn-dup-ex" data-ex="${exIndex}">⧉</button>
                  <button class="btn-icon btn-del-ex" style="color:var(--err)" data-ex="${exIndex}">🗑️</button>
                </div>
              </div>
              <div class="set-header-grid"><div></div><div>SET</div><div>KG</div><div>REPS</div><div>RPE</div></div>
              <div class="sets-container">${setsHtml}</div>
              <button class="btn-primary btn-secondary btn-add-set" style="font-size: 13px; padding: 10px;" data-ex="${exIndex}">+ AÑADIR SERIE</button>
              <div class="stats-row" id="stats-${ex.id}">
                <div>Volumen: <span class="stats-val vol-val">0 kg</span></div>
                <div>1RM Est.: <span class="stats-val rm-val">0 kg</span></div>
              </div>
            </div>
          `;
        });
        
        container.innerHTML = html;
        dayInfo.exercises.forEach(ex => this.updateExStats(ex));
        this.updateTotalVolume();
      }
    },
    openDay(idx) {
      UIState.selectedDayIndex = idx;
      this.renderAll();
    },
    closeDay() {
      UIState.selectedDayIndex = null;
      this.renderAll();
    },
    getDayRoutine() {
       return appState.weeklyRoutine[UIState.selectedDayIndex].exercises;
    },
    addExercise() {
      this.getDayRoutine().push({ id: generateUUID(), name: "", sets: [{ id: generateUUID(), weight: 0, reps: 0, rpe: 0 }] });
      StorageModule.save();
      this.renderAll();
    },
    duplicateExercise(idx) {
      const routine = this.getDayRoutine();
      const copy = JSON.parse(JSON.stringify(routine[idx]));
      copy.id = generateUUID();
      copy.sets.forEach(s => s.id = generateUUID());
      routine.splice(idx + 1, 0, copy);
      StorageModule.save();
      this.renderAll();
    },
    moveExercise(idx, dir) {
      const routine = this.getDayRoutine();
      if(dir === 'up' && idx > 0) {
        [routine[idx], routine[idx-1]] = [routine[idx-1], routine[idx]];
      } else if (dir === 'down' && idx < routine.length - 1) {
        [routine[idx], routine[idx+1]] = [routine[idx+1], routine[idx]];
      }
      StorageModule.save();
      this.renderAll();
    },
    updateExStats(ex) {
      let vol = 0, rm = 0;
      ex.sets.forEach(s => {
        vol += s.weight * s.reps;
        const epley = s.weight * (1 + 0.0333 * s.reps);
        if(epley > rm) rm = epley;
      });
      const statsDiv = getEl(`stats-${ex.id}`);
      if(statsDiv) {
        statsDiv.querySelector('.vol-val').textContent = `${vol.toFixed(0)} kg`;
        statsDiv.querySelector('.rm-val').textContent = `${rm.toFixed(1)} kg`;
      }
      this.updateTotalVolume();
    },
    updateTotalVolume() {
      if (UIState.selectedDayIndex === null) return;
      let tot = 0;
      const routine = this.getDayRoutine();
      routine.forEach(ex => ex.sets.forEach(s => tot += s.weight * s.reps));
      getEl('total-session-volume').textContent = `${tot.toFixed(0)} kg`;
    },
    saveRoutine() {
      triggerHaptic([20,50,20]);
      StorageModule.save();
      
      const dayInfo = appState.weeklyRoutine[UIState.selectedDayIndex];
      const today = new Date();
      const dayOfWeekMap = { 'Domingo':6, 'Lunes':0, 'Martes':1, 'Miércoles':2, 'Jueves':3, 'Viernes':4, 'Sábado':5 };
      
      // Ajuste para el día de la semana que es HOY, si hay ejercicios se guarda. (Domingo suele ser 0, ajustamos JS)
      const jsDay = today.getDay() === 0 ? 6 : today.getDay() - 1; 

      if (dayOfWeekMap[dayInfo.day] === jsDay && dayInfo.exercises.length > 0) {
        const targetDate = getLocalDateStr();
        appState.history[targetDate] = JSON.parse(JSON.stringify(dayInfo.exercises));
        StorageModule.save();
      }
      
      UIModule.showToast('Rutina plantilla guardada');
      this.closeDay();

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-routine').catch(console.warn));
      }
    }
  };

  const TimerModule = {
    startRest() {
      clearInterval(UIState.timerInterval);
      let timeLeft = 90;
      const banner = getEl('rest-timer');
      const display = getEl('timer-display');
      banner.style.display = 'flex';
      
      UIState.timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;
        if(timeLeft <= 0) this.stopRest();
      }, 1000);
    },
    stopRest() {
      clearInterval(UIState.timerInterval);
      getEl('rest-timer').style.display = 'none';
    },
    startStopwatch() {
      if(UIState.stopwatchInterval) return;
      const display = getEl('session-stopwatch');
      UIState.stopwatchInterval = setInterval(() => {
        UIState.sessionSeconds++;
        sessionStorage.setItem('zenitSessionSecs', UIState.sessionSeconds);
        const m = Math.floor(UIState.sessionSeconds / 60).toString().padStart(2, '0');
        const s = (UIState.sessionSeconds % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;
      }, 1000);
    }
  };

  const TasksModule = {
    render() {
      const html = appState.tasks.map((t, i) => `
        <div class="task-row ${t.done ? 'done':''}">
          <div class="task-check btn-task" data-idx="${i}">✓</div>
          <div class="task-text">${t.text}</div>
          <button class="btn-icon task-delete" data-idx="${i}">✕</button>
        </div>
      `).join('');
      
      const dashHtml = appState.tasks.map((t, i) => `
        <div class="task-row ${t.done ? 'done':''}">
          <div class="task-check btn-task" data-idx="${i}">✓</div>
          <div class="task-text">${t.text}</div>
        </div>
      `).join('');

      const cEdit = getEl('tasks-container-edit');
      const cDash = getEl('tasks-container-dash');
      if(cEdit) cEdit.innerHTML = html;
      if(cDash) cDash.innerHTML = dashHtml;

      const emptyDash = getEl('dash-tasks-empty');
      if (emptyDash) emptyDash.style.display = appState.tasks.length === 0 ? 'block' : 'none';
    },
    add(text) {
      if(appState.tasks.length >= 5) return UIModule.showToast('Máximo 5 tareas');
      appState.tasks.push({text: text.substring(0,40), done: false});
      StorageModule.save();
      this.render();
    }
  };

  const GoalsModule = {
    render() {
      const htmlEdit = appState.goals.map((g, i) => `
        <div class="card">
          <div class="ex-header" style="margin-bottom:8px; border:none; padding-bottom:0;">
            <div style="font-weight:900; font-size: 16px;">${g.title}</div>
            <button class="btn-icon" style="color:var(--err)" data-goal-del="${i}">🗑️</button>
          </div>
          <div style="font-size:13px; color:var(--pri); font-weight: 800;">
            ⏳ ${g.deadline}
          </div>
        </div>
      `).join('');

      const htmlDash = appState.goals.map((g, i) => `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
          <div style="font-size:14px; font-weight:800; color:var(--text-pri);">${g.title}</div>
          <div style="font-size:12px; color:var(--pri); font-weight: 800; margin-top:4px;">⏳ ${g.deadline}</div>
        </div>
      `).join('');

      const cEdit = getEl('goals-container-edit');
      const cDash = getEl('goals-container-dash');
      if(cEdit) cEdit.innerHTML = htmlEdit;
      if(cDash) {
        cDash.innerHTML = htmlDash;
        if(cDash.lastElementChild) cDash.lastElementChild.style.borderBottom = 'none';
      }

      const emptyDash = getEl('dash-goals-empty');
      if (emptyDash) emptyDash.style.display = appState.goals.length === 0 ? 'block' : 'none';
    },
    add() {
      const t = getEl('goal-title').value.trim();
      const d = getEl('goal-deadline').value.trim();
      if(!t || !d) return UIModule.showToast('Datos inválidos');
      appState.goals.push({title: t.substring(0,60), deadline: d.substring(0,60)});
      StorageModule.save();
      this.render();
      getEl('goal-title').value = ''; getEl('goal-deadline').value = '';
    }
  };

  // --- EVENT DELEGATION & INIT ---
  function initEvents() {
    document.body.addEventListener('click', e => {
      const navTrig = e.target.closest('.nav-trigger');
      if (navTrig) UIModule.switchTab(navTrig.dataset.target);
    });

    getEl('btn-mark-today').addEventListener('click', () => { CalendarModule.markDay(getLocalDateStr(), 'gym'); });
    getEl('btn-mark-rest').addEventListener('click', () => { CalendarModule.markDay(getLocalDateStr(), 'rest'); });
    
    getEl('btn-add-task').addEventListener('click', () => { const i = getEl('new-task-input'); if(i.value) TasksModule.add(i.value); i.value = ''; });
    document.body.addEventListener('click', e => {
      if(e.target.classList.contains('btn-task')) {
        const idx = e.target.dataset.idx; appState.tasks[idx].done = !appState.tasks[idx].done; StorageModule.save(); TasksModule.render();
      }
      if(e.target.classList.contains('task-delete')) {
        appState.tasks.splice(e.target.dataset.idx, 1); StorageModule.save(); TasksModule.render();
      }
    });

    getEl('full-calendar-container').addEventListener('click', e => {
      if(e.target.classList.contains('cal-day') && !e.target.classList.contains('adjacent')) CalendarModule.cycleDayState(e.target.dataset.date);
    });
    getEl('cal-prev').addEventListener('click', () => { UIState.currentMonthOffset--; CalendarModule.renderFull(); });
    getEl('cal-next').addEventListener('click', () => { UIState.currentMonthOffset++; CalendarModule.renderFull(); });

    // Routine List & Builder
    getEl('routine-week-list').addEventListener('click', e => {
      const card = e.target.closest('.card');
      if(card && card.dataset.openDay !== undefined) {
        RoutineModule.openDay(parseInt(card.dataset.openDay, 10));
      }
    });
    getEl('btn-back-week').addEventListener('click', () => { RoutineModule.closeDay(); });
    
    getEl('routine-name-input').addEventListener('input', e => {
      if(UIState.selectedDayIndex !== null) {
        appState.weeklyRoutine[UIState.selectedDayIndex].name = e.target.value.substring(0,40);
        StorageModule.save();
      }
    });

    getEl('btn-add-exercise').addEventListener('click', () => RoutineModule.addExercise());
    getEl('btn-save-routine').addEventListener('click', () => RoutineModule.saveRoutine());
    getEl('btn-cancel-timer').addEventListener('click', () => TimerModule.stopRest());

    const rCont = getEl('routine-container');
    rCont.addEventListener('click', e => {
      const btn = e.target.closest('button, .btn-complete-set');
      if(!btn) return;
      const exIdx = parseInt(btn.dataset.ex, 10);
      const routine = RoutineModule.getDayRoutine();
      
      if(btn.classList.contains('btn-add-set')) {
        const sets = routine[exIdx].sets;
        const ls = sets.length ? sets[sets.length-1] : {weight:0, reps:0, rpe:0};
        sets.push({...ls, id: generateUUID()}); StorageModule.save(); RoutineModule.renderAll();
      }
      else if(btn.classList.contains('btn-del-ex')) {
        routine.splice(exIdx, 1); StorageModule.save(); RoutineModule.renderAll();
      }
      else if(btn.classList.contains('btn-dup-ex')) { RoutineModule.duplicateExercise(exIdx); }
      else if(btn.classList.contains('btn-move-up')) { RoutineModule.moveExercise(exIdx, 'up'); }
      else if(btn.classList.contains('btn-move-down')) { RoutineModule.moveExercise(exIdx, 'down'); }
      else if(btn.classList.contains('btn-complete-set')) {
        triggerHaptic(15);
        btn.closest('.set-row').classList.toggle('completed');
        TimerModule.startRest();
      }
    });

    let debounceTimer;
    rCont.addEventListener('input', e => {
      const routine = RoutineModule.getDayRoutine();
      if(e.target.classList.contains('ex-name-input')) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          routine[e.target.dataset.ex].name = e.target.value.substring(0,60).trim();
          StorageModule.save();
        }, 300);
      }
      else if(e.target.classList.contains('input-val')) {
        let val = parseFloat(e.target.value) || 0;
        const field = e.target.dataset.field;
        if(field==='rpe' && val>10) { val=10; e.target.value=10; }
        if(field==='reps' && val>200) { val=200; e.target.value=200; }
        
        const row = e.target.closest('.set-row');
        const exIdx = row.dataset.ex;
        routine[exIdx].sets[row.dataset.set][field] = val;
        
        RoutineModule.updateExStats(routine[exIdx]);
        clearTimeout(debounceTimer); debounceTimer = setTimeout(() => StorageModule.save(), 500);
      }
    });

    getEl('btn-add-goal').addEventListener('click', () => GoalsModule.add());
    document.body.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if(btn && btn.dataset.goalDel !== undefined) {
        appState.goals.splice(btn.dataset.goalDel, 1); StorageModule.save(); GoalsModule.render();
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const shortcutTab = urlParams.get('tab');
    if (shortcutTab && ['dashboard', 'entreno', 'metas', 'calendario'].includes(shortcutTab)) {
      UIModule.switchTab(shortcutTab);
    } else {
      UIModule.switchTab('dashboard'); 
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    StorageModule.load();
    UIModule.initQuotes();
    initEvents();
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
    }
  });

})();
