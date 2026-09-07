/* Sudoku app: UI + game logic. Depends on Sudoku (js/sudoku.js) and DB (js/db.js). */
(() => {
  'use strict';

  // ---------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------
  const DIFFS = ['easy', 'medium', 'hard', 'expert', 'master', 'extreme'];
  const BASE_POINTS = { easy: 50, medium: 100, hard: 200, expert: 300, master: 500, extreme: 700 };
  const BONUS_WINDOW_MIN = { easy: 10, medium: 15, hard: 20, expert: 30, master: 40, extreme: 60 };
  const MAX_MISTAKES = 3;
  const HINTS_PER_GAME = 3;
  const UNDO_LIMIT = 100;

  const I18N = {
    es: {
      classic: 'Sudoku clásico', daily: 'Desafíos diarios', play: 'Jugar', continue: 'Continuar', replay: 'Jugar de nuevo',
      newGame: 'Nueva partida', continueGame: 'Continuar partida', main: 'Principal', stats: 'Estadísticas',
      difficulty: 'Dificultad', mistakes: 'Errores', score: 'Puntos', time: 'Tiempo',
      easy: 'Fácil', medium: 'Medio', hard: 'Difícil', expert: 'Experto', master: 'Maestro', extreme: 'Extremo',
      undo: 'Deshacer', erase: 'Borrar', notes: 'Notas', hint: 'Pista',
      selectDifficulty: 'Selecciona la dificultad', progressLost: 'Se perderá el progreso de la partida actual',
      restart: 'Reiniciar', cancel: 'Cancelar', settings: 'Ajustes', close: 'Cerrar',
      pause: 'Pausa', resume: 'Continuar', gameOver: 'Fin de la partida',
      gameOverText: 'Has cometido 3 errores y has perdido esta partida', secondChance: 'Segunda oportunidad',
      win: '¡Excelente!', winText: 'Has completado el sudoku', winRecord: '¡Nuevo mejor tiempo!', home: 'Inicio',
      generating: 'Generando sudoku…', noHints: 'No te quedan pistas', selectCell: 'Selecciona una casilla',
      completed: 'Completado', inProgress: 'En curso', today: 'Hoy',
      games: 'Partidas', gamesStarted: 'Partidas iniciadas', gamesWon: 'Partidas ganadas', winRate: 'Porcentaje de victorias',
      perfectWins: 'Victorias sin errores', timeSection: 'Tiempo', bestTime: 'Mejor tiempo', avgTime: 'Tiempo medio',
      streaks: 'Rachas', currentStreak: 'Racha actual', bestStreak: 'Mejor racha', scoreSection: 'Puntuación',
      bestScore: 'Mejor puntuación', avgScore: 'Puntuación media', resetStats: 'Borrar estadísticas',
      resetStatsConfirm: '¿Seguro que quieres borrar todas las estadísticas?', dailyProgress: '{done} de {total} completados',
      sVibration: 'Vibración', sTimer: 'Temporizador', sMistakeLimit: 'Límite de errores', sMistakeLimitDesc: 'La partida termina con 3 errores',
      sAutoCheck: 'Comprobar errores automáticamente', sHighlightDup: 'Resaltar duplicados', sAutoRemove: 'Eliminar notas automáticamente',
      sHighlightAreas: 'Resaltar áreas', sHighlightIdentical: 'Resaltar números idénticos', sNumberFirst: 'Introducir número primero',
      sNumberFirstDesc: 'Elige un número y luego toca las casillas', sShowRemaining: 'Mostrar números restantes', language: 'Idioma',
      confirmRestart: '¿Reiniciar esta partida desde el principio?',
    },
    en: {
      classic: 'Classic Sudoku', daily: 'Daily Challenges', play: 'Play', continue: 'Continue', replay: 'Play again',
      newGame: 'New Game', continueGame: 'Continue Game', main: 'Main', stats: 'Statistics',
      difficulty: 'Difficulty', mistakes: 'Mistakes', score: 'Score', time: 'Time',
      easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert', master: 'Master', extreme: 'Extreme',
      undo: 'Undo', erase: 'Erase', notes: 'Notes', hint: 'Hint',
      selectDifficulty: 'Select difficulty', progressLost: 'Current game progress will be lost',
      restart: 'Restart', cancel: 'Cancel', settings: 'Settings', close: 'Close',
      pause: 'Paused', resume: 'Resume', gameOver: 'Game Over',
      gameOverText: 'You have made 3 mistakes and lost this game', secondChance: 'Second Chance',
      win: 'Excellent!', winText: 'You completed the sudoku', winRecord: 'New best time!', home: 'Home',
      generating: 'Generating sudoku…', noHints: 'No hints left', selectCell: 'Select a cell',
      completed: 'Completed', inProgress: 'In progress', today: 'Today',
      games: 'Games', gamesStarted: 'Games started', gamesWon: 'Games won', winRate: 'Win rate',
      perfectWins: 'Wins with no mistakes', timeSection: 'Time', bestTime: 'Best time', avgTime: 'Average time',
      streaks: 'Streaks', currentStreak: 'Current streak', bestStreak: 'Best streak', scoreSection: 'Score',
      bestScore: 'Best score', avgScore: 'Average score', resetStats: 'Reset statistics',
      resetStatsConfirm: 'Are you sure you want to reset all statistics?', dailyProgress: '{done} of {total} completed',
      sVibration: 'Vibration', sTimer: 'Timer', sMistakeLimit: 'Mistake limit', sMistakeLimitDesc: 'Game ends after 3 mistakes',
      sAutoCheck: 'Auto-check for mistakes', sHighlightDup: 'Highlight duplicates', sAutoRemove: 'Auto-remove notes',
      sHighlightAreas: 'Highlight areas', sHighlightIdentical: 'Highlight identical numbers', sNumberFirst: 'Number-first input',
      sNumberFirstDesc: 'Pick a number, then tap the cells', sShowRemaining: 'Show remaining numbers', language: 'Language',
      confirmRestart: 'Restart this game from the beginning?',
    },
  };
  const LOCALES = { es: 'es-ES', en: 'en-US' };

  const DEFAULT_SETTINGS = {
    lang: 'es', vibration: true, timer: true, mistakeLimit: true, autoCheck: true, highlightDuplicates: true,
    autoRemoveNotes: true, highlightAreas: true, highlightIdentical: true, numberFirst: false, showRemaining: true,
  };
  const SETTING_DEFS = [
    { key: 'vibration', label: 'sVibration' },
    { key: 'timer', label: 'sTimer' },
    { key: 'mistakeLimit', label: 'sMistakeLimit', desc: 'sMistakeLimitDesc' },
    { key: 'autoCheck', label: 'sAutoCheck' },
    { key: 'highlightDuplicates', label: 'sHighlightDup' },
    { key: 'autoRemoveNotes', label: 'sAutoRemove' },
    { key: 'highlightAreas', label: 'sHighlightAreas' },
    { key: 'highlightIdentical', label: 'sHighlightIdentical' },
    { key: 'numberFirst', label: 'sNumberFirst', desc: 'sNumberFirstDesc' },
    { key: 'showRemaining', label: 'sShowRemaining' },
  ];

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  const state = {
    screen: 'home',
    settings: { ...DEFAULT_SETTINGS },
    game: null,
    selected: -1,
    notesMode: false,
    activeNumber: 0,
    paused: false,
    timerId: null,
    lastTick: 0,
    saveCounter: 0,
    openSheet: null,
    sheetContext: 'home',
    cal: null,            // { year, month }
    dailySelected: null,  // 'YYYY-MM-DD'
    dailyMap: {},         // { key: { status, time, score } }
    statsDiff: 'easy',
  };

  const $ = (id) => document.getElementById(id);
  const cells = [];
  const numButtons = [];
  const el = {};

  const t = (key, vars) => {
    let s = (I18N[state.settings.lang] || I18N.en)[key];
    if (s === undefined) s = I18N.en[key] !== undefined ? I18N.en[key] : key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace('{' + k + '}', vars[k]);
    return s;
  };
  const locale = () => LOCALES[state.settings.lang] || 'en-US';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  function fmtTime(sec) {
    sec = Math.floor(sec || 0);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? h + ':' + pad2(m) + ':' + pad2(s) : pad2(m) + ':' + pad2(s);
  }
  function fmtScore(n) { return (n || 0).toLocaleString(locale()); }
  function vibrate(p) { if (state.settings.vibration && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } }

  // Dates
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function todayKey() { return dateKey(new Date()); }
  function keyToDate(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); }
  const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function fmtDateLong(d) { return capFirst(new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(d)); }
  function fmtMonth(y, m) { return capFirst(new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(new Date(y, m, 1))); }

  // ---------------------------------------------------------------
  // Persistence helpers
  // ---------------------------------------------------------------
  const saveKey = (mode, dailyKey) => (mode === 'daily' ? 'game:daily:' + dailyKey : 'game:classic');
  function serializeGame(g) { return JSON.parse(JSON.stringify(g)); }
  async function saveGame() {
    const g = state.game; if (!g) return;
    try { await DB.set(saveKey(g.mode, g.dailyKey), serializeGame(g)); } catch (e) { console.warn('save failed', e); }
  }
  async function deleteSave(g) { try { await DB.del(saveKey(g.mode, g.dailyKey)); } catch (e) { /* ignore */ } }
  async function loadSaved(mode, dailyKey) {
    let g = null;
    try { g = await DB.get(saveKey(mode, dailyKey)); } catch (e) { return null; }
    if (!g) return null;
    if (g.status !== 'playing') {
      if (g.status === 'lost') await finishRecord(g, false);
      await deleteSave(g);
      return null;
    }
    return g;
  }
  async function saveSettings() { try { await DB.set('settings', state.settings); } catch (e) { /* ignore */ } }
  async function loadDailyMap() { try { state.dailyMap = (await DB.get('daily')) || {}; } catch (e) { state.dailyMap = {}; } }
  async function setDailyStatus(key, data) {
    state.dailyMap[key] = { ...(state.dailyMap[key] || {}), ...data };
    try { await DB.set('daily', state.dailyMap); } catch (e) { /* ignore */ }
  }

  async function finishRecord(g, won) {
    if (!g || g.recordId == null || g.recordFinished) return;
    try {
      const rec = await DB.getGame(g.recordId);
      if (!rec) return;
      rec.finished = true; rec.won = !!won; rec.time = Math.floor(g.seconds || 0);
      rec.score = g.score || 0; rec.mistakes = g.mistakes || 0; rec.finishedAt = Date.now();
      await DB.putGame(rec);
      g.recordFinished = true;
    } catch (e) { console.warn('record failed', e); }
  }

  // ---------------------------------------------------------------
  // Game creation / lifecycle
  // ---------------------------------------------------------------
  function newGameObject({ mode, difficulty, dailyKey, puzzle, solution }) {
    return {
      mode, difficulty, dailyKey: dailyKey || null,
      puzzle: Array.from(puzzle), solution: Array.from(solution), board: Array.from(puzzle),
      notes: new Array(81).fill(0), scored: new Array(81).fill(0),
      mistakes: 0, score: 0, hints: HINTS_PER_GAME, seconds: 0, undo: [],
      status: 'playing', secondChanceUsed: false, recordId: null, recordFinished: false,
      createdAt: Date.now(),
    };
  }

  async function startNewGame(difficulty, mode = 'classic', dailyKey = null) {
    closeSheet(); closeAllModals();
    showLoading(true);
    await sleep(50);
    try {
      // Abandon the in-progress game that this one replaces.
      const prev = (state.game && state.game.mode === mode && state.game.dailyKey === dailyKey) ? state.game : await loadSaved(mode, dailyKey);
      if (prev && prev.status === 'playing') { await finishRecord(prev, false); await deleteSave(prev); }
      const rnd = mode === 'daily' ? Sudoku.rng(Sudoku.dailySeed(dailyKey)) : Sudoku.rng();
      const gen = Sudoku.generate(difficulty, rnd);
      const game = newGameObject({ mode, difficulty, dailyKey, puzzle: gen.puzzle, solution: gen.solution });
      try {
        game.recordId = await DB.addGame({ mode, difficulty, dailyKey, date: Date.now(), finishedAt: null, finished: false, won: false, time: 0, score: 0, mistakes: 0 });
      } catch (e) { console.warn('addGame failed', e); }
      state.game = game;
      resetInputState();
      await saveGame();
      if (mode === 'daily') await setDailyStatus(dailyKey, { status: state.dailyMap[dailyKey] && state.dailyMap[dailyKey].status === 'done' ? 'done' : 'playing' });
      enterGame();
    } finally {
      showLoading(false);
    }
  }

  async function restartGame() {
    const g = state.game; if (!g) return;
    closeSheet(); closeAllModals();
    g.board = Array.from(g.puzzle); g.notes = new Array(81).fill(0); g.scored = new Array(81).fill(0);
    g.mistakes = 0; g.score = 0; g.hints = HINTS_PER_GAME; g.seconds = 0; g.undo = [];
    g.status = 'playing'; g.secondChanceUsed = false;
    resetInputState();
    await saveGame();
    enterGame();
  }

  function resetInputState() { state.selected = -1; state.notesMode = false; state.activeNumber = 0; state.paused = false; }

  function enterGame() {
    state.paused = false;
    el.board.classList.remove('paused', 'win');
    el.boardPaused.hidden = true;
    showScreen('game');
    renderAll();
    startTimer();
  }

  async function continueClassic() {
    const g = await loadSaved('classic', null);
    if (!g) { refreshHome(); return; }
    state.game = g; resetInputState(); enterGame();
  }

  async function openDaily(key) {
    const saved = await loadSaved('daily', key);
    if (saved) { state.game = saved; resetInputState(); enterGame(); return; }
    await startNewGame(Sudoku.dailyDifficulty(key), 'daily', key);
  }

  async function goHome() {
    stopTimer();
    const g = state.game;
    if (g) {
      if (g.status === 'playing') await saveGame();
      else if (g.status === 'lost') { await finishRecord(g, false); await deleteSave(g); state.game = null; }
      else if (g.status === 'won') state.game = null;
    }
    state.paused = false;
    closeAllModals(); closeSheet();
    showScreen('home');
  }

  // ---------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------
  function startTimer() { stopTimer(); state.lastTick = Date.now(); state.timerId = setInterval(tick, 1000); }
  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }
  function tick() {
    const g = state.game; const now = Date.now();
    if (!g || g.status !== 'playing' || state.paused) { state.lastTick = now; return; }
    g.seconds += (now - state.lastTick) / 1000; state.lastTick = now;
    updateTime();
    if (++state.saveCounter % 5 === 0) saveGame();
  }
  function updateTime() { el.stTime.textContent = fmtTime(state.game ? state.game.seconds : 0); }

  function pauseGame() {
    const g = state.game;
    if (!g || g.status !== 'playing' || state.paused) return;
    state.paused = true;
    el.board.classList.add('paused');
    el.boardPaused.hidden = false;
    el.pauseRows.innerHTML = rowsHtml([
      [t('difficulty'), t(g.difficulty)],
      [t('mistakes'), mistakesText(g)],
      [t('time'), fmtTime(g.seconds)],
    ]);
    openModal('pause');
    saveGame();
  }
  function resumeGame() {
    if (!state.paused) return;
    state.paused = false;
    el.board.classList.remove('paused');
    el.boardPaused.hidden = true;
    closeModal('pause');
    state.lastTick = Date.now();
  }

  // ---------------------------------------------------------------
  // Input / moves
  // ---------------------------------------------------------------
  const playing = () => state.game && state.game.status === 'playing' && !state.paused;
  const isConfirmedCorrect = (g, i) => g.board[i] !== 0 && g.board[i] === g.solution[i] && state.settings.autoCheck;

  function pushUndo() {
    const g = state.game;
    g.undo.push({ board: g.board.slice(), notes: g.notes.slice(), selected: state.selected });
    if (g.undo.length > UNDO_LIMIT) g.undo.shift();
  }

  function selectCell(i) {
    if (!playing()) return;
    if (state.settings.numberFirst && state.activeNumber) { state.selected = i; inputNumber(state.activeNumber); return; }
    state.selected = i;
    renderBoard();
  }

  function onNumpad(d) {
    if (!playing()) return;
    if (state.settings.numberFirst) {
      state.activeNumber = state.activeNumber === d ? 0 : d;
      renderNumpad(); renderBoard();
      return;
    }
    inputNumber(d);
  }

  function inputNumber(d) {
    const g = state.game; const i = state.selected;
    if (i < 0) { toast(t('selectCell')); return; }
    if (g.puzzle[i] !== 0) return;               // given cell
    if (isConfirmedCorrect(g, i)) return;         // confirmed correct cells are locked

    if (state.notesMode) {
      pushUndo();
      g.board[i] = 0;
      g.notes[i] ^= 1 << (d - 1);
      vibrate(8);
      saveGame(); renderAll();
      return;
    }
    if (g.board[i] === d) return;

    pushUndo();
    g.board[i] = d; g.notes[i] = 0;
    animateCell(i, 'pop');
    if (d === g.solution[i]) {
      if (!g.scored[i]) { g.scored[i] = 1; g.score += BASE_POINTS[g.difficulty] || 50; }
      if (state.settings.autoRemoveNotes) removeNotesAround(i, d);
      vibrate(10);
      if (isSolved(g)) { onWin(); return; }
    } else if (state.settings.autoCheck) {
      g.mistakes++;
      vibrate([30, 40, 30]);
      animateCell(i, 'shake');
      if (state.settings.mistakeLimit && g.mistakes >= MAX_MISTAKES) { renderAll(); onGameOver(); return; }
    }
    saveGame(); renderAll();
  }

  function removeNotesAround(i, d) {
    const g = state.game; const bit = 1 << (d - 1);
    for (const j of Sudoku.PEERS[i]) if (g.notes[j] & bit) g.notes[j] &= ~bit;
  }

  function eraseCell() {
    if (!playing()) return;
    const g = state.game; const i = state.selected;
    if (i < 0 || g.puzzle[i] !== 0) return;
    if (g.board[i] === 0 && g.notes[i] === 0) return;
    if (isConfirmedCorrect(g, i)) return;
    pushUndo();
    g.board[i] = 0; g.notes[i] = 0;
    vibrate(8);
    saveGame(); renderAll();
  }

  function undo() {
    if (!playing()) return;
    const g = state.game; const s = g.undo.pop();
    if (!s) return;
    g.board = s.board; g.notes = s.notes; state.selected = s.selected;
    vibrate(8);
    saveGame(); renderAll();
  }

  function toggleNotes() {
    if (!state.game || state.game.status !== 'playing') return;
    state.notesMode = !state.notesMode;
    vibrate(8);
    renderControls();
  }

  function useHint() {
    if (!playing()) return;
    const g = state.game;
    if (g.hints <= 0) { toast(t('noHints')); return; }
    const editable = (j) => g.puzzle[j] === 0 && g.board[j] !== g.solution[j];
    let i = state.selected;
    if (!(i >= 0 && editable(i))) {
      const cand = []; for (let j = 0; j < 81; j++) if (editable(j)) cand.push(j);
      if (!cand.length) return;
      i = cand[Math.floor(Math.random() * cand.length)];
    }
    pushUndo();
    g.board[i] = g.solution[i]; g.notes[i] = 0; g.scored[i] = 1; g.hints--;
    state.selected = i;
    if (state.settings.autoRemoveNotes) removeNotesAround(i, g.board[i]);
    animateCell(i, 'pop');
    vibrate(10);
    if (isSolved(g)) { onWin(); return; }
    saveGame(); renderAll();
  }

  function isSolved(g) { for (let i = 0; i < 81; i++) if (g.board[i] !== g.solution[i]) return false; return true; }

  function animateCell(i, cls) {
    const c = cells[i]; if (!c) return;
    c.classList.remove(cls); void c.offsetWidth; c.classList.add(cls);
    setTimeout(() => c.classList.remove(cls), 350);
  }

  // ---------------------------------------------------------------
  // Win / lose
  // ---------------------------------------------------------------
  async function onWin() {
    const g = state.game;
    g.status = 'won'; stopTimer(); state.selected = -1; state.activeNumber = 0;
    const base = BASE_POINTS[g.difficulty] || 50;
    const win = (BONUS_WINDOW_MIN[g.difficulty] || 10) * 60;
    const bonus = Math.round(base * 10 * Math.max(0, 1 - g.seconds / win));
    g.score += bonus;
    g.finishedAt = Date.now();
    renderAll();
    // Was it a record?
    let record = false;
    try {
      const recs = (await DB.allGames()) || [];
      const best = recs.filter((r) => r.won && r.difficulty === g.difficulty && r.id !== g.recordId).reduce((m, r) => Math.min(m, r.time), Infinity);
      record = Math.floor(g.seconds) < best;
    } catch (e) { /* ignore */ }
    await finishRecord(g, true);
    if (g.mode === 'daily') await setDailyStatus(g.dailyKey, { status: 'done', time: Math.floor(g.seconds), score: g.score });
    await deleteSave(g);
    // Wave animation then modal
    cells.forEach((c, i) => c.style.setProperty('--d', Sudoku.ROW[i] + Sudoku.COL[i]));
    el.board.classList.add('win');
    vibrate([20, 30, 20, 30, 60]);
    await sleep(1500);
    if (state.game !== g) return;
    el.winText.textContent = record ? t('winRecord') : t('winText');
    el.winRows.innerHTML = rowsHtml([
      [t('difficulty'), t(g.difficulty)],
      [t('score'), fmtScore(g.score), true],
      [t('time'), fmtTime(g.seconds)],
    ]);
    openModal('win');
  }

  async function onGameOver() {
    const g = state.game;
    g.status = 'lost'; stopTimer();
    await saveGame();
    el.btnSecondChance.hidden = g.secondChanceUsed;
    openModal('gameover');
  }

  async function secondChance() {
    const g = state.game; if (!g || g.status !== 'lost') return;
    g.secondChanceUsed = true;
    g.mistakes = MAX_MISTAKES - 1;
    const i = state.selected;
    if (i >= 0 && g.puzzle[i] === 0 && g.board[i] !== g.solution[i]) g.board[i] = 0;
    g.status = 'playing';
    closeModal('gameover');
    await saveGame();
    renderAll();
    state.lastTick = Date.now();
    startTimer();
  }

  async function abandonAndNewGame() {
    const g = state.game;
    if (g && g.status === 'lost') { await finishRecord(g, false); await deleteSave(g); state.game = null; }
    else if (g && g.status === 'won') state.game = null;
    closeAllModals();
    openNewGameSheet('after');
  }

  // ---------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------
  function mistakesText(g) { return state.settings.mistakeLimit ? g.mistakes + '/' + MAX_MISTAKES : String(g.mistakes); }
  function rowsHtml(rows) {
    return rows.map(([k, v, hl]) => `<div class="modal-row${hl ? ' highlight' : ''}"><span>${k}</span><b>${v}</b></div>`).join('');
  }

  function renderAll() { renderStatsBar(); renderBoard(); renderControls(); renderNumpad(); }

  function renderStatsBar() {
    const g = state.game; if (!g) return;
    el.stDiff.textContent = t(g.difficulty);
    el.stMist.textContent = mistakesText(g);
    el.stScore.textContent = fmtScore(g.score);
    el.stTime.hidden = !state.settings.timer;
    el.gameStats.classList.toggle('no-timer', !state.settings.timer);
    el.gameTitle.textContent = g.mode === 'daily' ? fmtDateLong(keyToDate(g.dailyKey)) : t('classic');
    updateTime();
  }

  function renderBoard() {
    const g = state.game; if (!g) return;
    const s = state.settings;
    const sel = state.selected;
    const selVal = sel >= 0 ? g.board[sel] : (s.numberFirst ? state.activeNumber : 0);
    const selR = sel >= 0 ? Sudoku.ROW[sel] : -1, selC = sel >= 0 ? Sudoku.COL[sel] : -1, selB = sel >= 0 ? Sudoku.BOX[sel] : -1;
    const hlBit = selVal ? 1 << (selVal - 1) : 0;
    for (let i = 0; i < 81; i++) {
      const c = cells[i]; const v = g.board[i]; const given = g.puzzle[i] !== 0;
      let cls = 'cell' + c.dataset.border;
      if (given) cls += ' given';
      const wrong = v !== 0 && s.autoCheck && v !== g.solution[i];
      if (wrong) cls += ' wrong';
      else if (v !== 0 && s.highlightDuplicates && hasConflict(g, i, v)) cls += ' conflict';
      if (i === sel) cls += ' selected';
      else if (s.highlightAreas && sel >= 0 && (Sudoku.ROW[i] === selR || Sudoku.COL[i] === selC || Sudoku.BOX[i] === selB)) cls += ' related';
      if (s.highlightIdentical && selVal && v === selVal && i !== sel) cls += ' same';
      c.className = cls;
      c._val.textContent = v || '';
      const notes = v === 0 ? g.notes[i] : 0;
      if (notes !== c._notesMask || hlBit !== c._hlBit) {
        c._notesMask = notes; c._hlBit = hlBit;
        for (let d = 1; d <= 9; d++) {
          const n = c._notes[d - 1]; const on = notes & (1 << (d - 1));
          n.textContent = on ? d : '';
          n.className = on && (hlBit & (1 << (d - 1))) ? 'note-hl' : '';
        }
      }
    }
  }

  function hasConflict(g, i, v) {
    for (const j of Sudoku.PEERS[i]) if (g.board[j] === v) return true;
    return false;
  }

  function renderControls() {
    const g = state.game; if (!g) return;
    el.notesBadge.textContent = state.notesMode ? 'ON' : 'OFF';
    el.notesBadge.className = 'badge ' + (state.notesMode ? 'badge-on' : 'badge-off');
    el.ctrlNotes.classList.toggle('on', state.notesMode);
    el.hintBadge.textContent = g.hints;
    el.hintBadge.className = 'badge badge-count' + (g.hints <= 0 ? ' badge-zero' : '');
    el.ctrlUndo.classList.toggle('disabled', g.undo.length === 0);
  }

  function renderNumpad() {
    const g = state.game; if (!g) return;
    const counts = new Array(10).fill(0);
    for (let i = 0; i < 81; i++) counts[g.board[i]]++;
    el.numpad.classList.toggle('no-remaining', !state.settings.showRemaining);
    for (let d = 1; d <= 9; d++) {
      const b = numButtons[d - 1]; const rem = 9 - counts[d];
      b._rem.textContent = rem > 0 ? rem : '';
      b.classList.toggle('done', rem <= 0);
      b.classList.toggle('active', state.settings.numberFirst && state.activeNumber === d);
    }
  }

  // ---------------------------------------------------------------
  // Screens, sheets, modals
  // ---------------------------------------------------------------
  function showScreen(name) {
    state.screen = name;
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
    el.tabbar.hidden = name === 'game';
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.screen === name));
    if (name === 'home') refreshHome();
    if (name === 'daily') renderCalendar();
    if (name === 'stats') renderStats();
  }

  function openSheet(id) {
    closeSheet(true);
    const sh = $(id); sh.hidden = false;
    el.backdrop.hidden = false;
    setTimeout(() => { if (state.openSheet === id) { sh.classList.add('open'); el.backdrop.classList.add('show'); } }, 15);
    state.openSheet = id;
  }
  function closeSheet(immediate) {
    const id = state.openSheet; if (!id) return;
    const sh = $(id);
    sh.classList.remove('open'); el.backdrop.classList.remove('show');
    state.openSheet = null;
    const done = () => { if (state.openSheet !== id) sh.hidden = true; if (!state.openSheet) el.backdrop.hidden = true; };
    if (immediate) done(); else setTimeout(done, 260);
  }
  function openModal(name) { $('modal-' + name).hidden = false; }
  function closeModal(name) { $('modal-' + name).hidden = true; }
  function closeAllModals() { ['pause', 'gameover', 'win'].forEach(closeModal); }
  function showLoading(on) { el.loading.hidden = !on; }
  let toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg; el.toast.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.toast.hidden = true; }, 1800);
  }

  function openNewGameSheet(context) {
    state.sheetContext = context; // 'home' | 'game' | 'after'
    const g = state.game;
    const inGame = context === 'game' && g && g.status === 'playing';
    el.btnRestart.hidden = !inGame;
    el.newgameSub.hidden = !(inGame || (context === 'home' && el.btnContinue.hidden === false));
    const current = g ? g.difficulty : null;
    el.diffList.querySelectorAll('.btn-list').forEach((b) => b.classList.toggle('active', b.dataset.diff === current && !!g && context !== 'home'));
    openSheet('sheet-newgame');
  }
  function cancelNewGameSheet() {
    const ctx = state.sheetContext;
    closeSheet();
    if (ctx === 'after') goHome();
    else if (ctx === 'game' && state.paused) { /* stay paused: reopen pause modal */ openModal('pause'); }
  }

  // ---------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------
  async function refreshHome() {
    const g = await loadSaved('classic', null);
    el.btnContinue.hidden = !g;
    if (g) el.continueInfo.textContent = fmtTime(g.seconds) + ' · ' + t(g.difficulty);
    await loadDailyMap();
    const key = todayKey();
    const d = state.dailyMap[key];
    el.dailyCardDate.textContent = fmtDateLong(new Date());
    el.dailyCardBtn.classList.toggle('done', !!(d && d.status === 'done'));
    el.dailyCardBtn.textContent = d && d.status === 'done' ? t('completed') : d && d.status === 'playing' ? t('continue') : t('play');
  }

  // ---------------------------------------------------------------
  // Daily calendar
  // ---------------------------------------------------------------
  function renderCalendar() {
    const now = new Date();
    if (!state.cal) state.cal = { year: now.getFullYear(), month: now.getMonth() };
    if (!state.dailySelected) state.dailySelected = todayKey();
    const { year, month } = state.cal;
    el.calTitle.textContent = fmtMonth(year, month);
    const isCurrent = year === now.getFullYear() && month === now.getMonth();
    el.btnNextMonth.disabled = isCurrent;
    el.btnNextMonth.style.visibility = isCurrent ? 'hidden' : 'visible';

    // Weekday headers (Monday first)
    const wd = [];
    for (let i = 0; i < 7; i++) { const d = new Date(2024, 0, 1 + i); wd.push(new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(d).replace('.', '')); }
    el.calWeekdays.innerHTML = wd.map((w) => `<div>${w}</div>`).join('');

    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tKey = todayKey();
    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="cal-day empty"></div>';
    let done = 0, total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = year + '-' + pad2(month + 1) + '-' + pad2(d);
      const st = state.dailyMap[key];
      const future = key > tKey;
      if (!future) total++;
      let cls = 'cal-day';
      if (future) cls += ' future';
      if (key === tKey) cls += ' today';
      if (key === state.dailySelected) cls += ' selected';
      if (st && st.status === 'done') { cls += ' done'; done++; }
      else if (st && st.status === 'playing') cls += ' inprogress';
      html += `<div class="${cls}" data-key="${key}"><span>${d}</span>${st && st.status === 'done' ? TROPHY_SVG : ''}</div>`;
    }
    el.calGrid.innerHTML = html;
    el.dailyProgress.textContent = t('dailyProgress', { done, total });
    renderDailyFooter();
  }
  const TROPHY_SVG = '<svg viewBox="0 0 48 48"><path d="M14 6h20v10a10 10 0 0 1-20 0z" fill="#ffc63a"/><path d="M14 9H8a2 2 0 0 0-2 2c0 5 3.5 9 8 9.5V17c-1.5 0-3-2.5-3-6h3zM34 9h6a2 2 0 0 1 2 2c0 5-3.5 9-8 9.5V17c1.5 0 3-2.5 3-6h-3z" fill="#f2b21e"/><rect x="21" y="25" width="6" height="8" fill="#e0a319"/><rect x="15" y="33" width="18" height="5" rx="1.5" fill="#ffc63a"/><rect x="12" y="38" width="24" height="4" rx="1.5" fill="#e0a319"/></svg>';

  function renderDailyFooter() {
    const key = state.dailySelected; if (!key) return;
    const st = state.dailyMap[key];
    const d = keyToDate(key);
    let info = fmtDateLong(d);
    if (st && st.status === 'done') info += ' · ' + t('completed') + ' · ' + fmtTime(st.time);
    else if (st && st.status === 'playing') info += ' · ' + t('inProgress');
    el.dailySelected.textContent = info;
    el.btnDailyPlay.textContent = st && st.status === 'done' ? t('replay') : st && st.status === 'playing' ? t('continue') : t('play');
    el.btnDailyPlay.disabled = key > todayKey();
  }

  // ---------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------
  async function renderStats() {
    let recs = [];
    try { recs = (await DB.allGames()) || []; } catch (e) { /* ignore */ }
    const diff = state.statsDiff;
    el.statsTabs.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c.dataset.diff === diff));
    const rs = recs.filter((r) => r.difficulty === diff).sort((a, b) => (a.finishedAt || a.date) - (b.finishedAt || b.date));
    const finished = rs.filter((r) => r.finished);
    const won = finished.filter((r) => r.won);
    const started = rs.length;
    const winRate = started ? Math.round((won.length / started) * 100) : 0;
    const perfect = won.filter((r) => r.mistakes === 0).length;
    const bestTime = won.length ? Math.min(...won.map((r) => r.time)) : 0;
    const avgTime = won.length ? Math.round(won.reduce((s, r) => s + r.time, 0) / won.length) : 0;
    const bestScore = won.length ? Math.max(...won.map((r) => r.score)) : 0;
    const avgScore = won.length ? Math.round(won.reduce((s, r) => s + r.score, 0) / won.length) : 0;
    let cur = 0, best = 0;
    for (const r of finished) { cur = r.won ? cur + 1 : 0; if (cur > best) best = cur; }
    const section = (title, rows) => `<div class="stats-section"><h3>${title}</h3>${rows.map(([k, v]) => `<div class="stats-row"><span class="stats-label">${k}</span><b>${v}</b></div>`).join('')}</div>`;
    el.statsContent.innerHTML =
      section(t('games'), [[t('gamesStarted'), started], [t('gamesWon'), won.length], [t('winRate'), winRate + '%'], [t('perfectWins'), perfect]]) +
      section(t('timeSection'), [[t('bestTime'), won.length ? fmtTime(bestTime) : '-'], [t('avgTime'), won.length ? fmtTime(avgTime) : '-']]) +
      section(t('streaks'), [[t('currentStreak'), cur], [t('bestStreak'), best]]) +
      section(t('scoreSection'), [[t('bestScore'), won.length ? fmtScore(bestScore) : '-'], [t('avgScore'), won.length ? fmtScore(avgScore) : '-']]) +
      `<button class="btn btn-danger" id="btn-reset-stats">${t('resetStats')}</button>`;
    $('btn-reset-stats').addEventListener('click', async () => {
      if (!confirm(t('resetStatsConfirm'))) return;
      try { await DB.clearGames(); } catch (e) { /* ignore */ }
      renderStats();
    });
  }

  // ---------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------
  function renderSettings() {
    let html = `<div class="setting"><span>${t('language')}</span><div class="segment" id="lang-seg"><button data-lang="es" class="${state.settings.lang === 'es' ? 'active' : ''}">ES</button><button data-lang="en" class="${state.settings.lang === 'en' ? 'active' : ''}">EN</button></div></div>`;
    for (const def of SETTING_DEFS) {
      html += `<div class="setting" data-key="${def.key}"><span>${t(def.label)}${def.desc ? `<span class="setting-desc">${t(def.desc)}</span>` : ''}</span><button class="toggle ${state.settings[def.key] ? 'on' : ''}" role="switch" aria-checked="${state.settings[def.key]}"></button></div>`;
    }
    el.settingsList.innerHTML = html;
  }
  function applyI18n() {
    document.documentElement.lang = state.settings.lang;
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    el.diffList.querySelectorAll('.btn-list').forEach((b) => { b.querySelector('.diff-name').textContent = t(b.dataset.diff); });
    el.statsTabs.querySelectorAll('.chip').forEach((c) => { c.textContent = t(c.dataset.diff); });
  }
  async function setSetting(key, value) {
    state.settings[key] = value;
    await saveSettings();
    if (key === 'lang') { applyI18n(); renderSettings(); refreshHome(); if (state.screen === 'daily') renderCalendar(); if (state.screen === 'stats') renderStats(); }
    if (key === 'numberFirst') state.activeNumber = 0;
    if (state.game) renderAll();
  }

  // ---------------------------------------------------------------
  // DOM building & events
  // ---------------------------------------------------------------
  function buildBoard() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 81; i++) {
      const r = Sudoku.ROW[i], c = Sudoku.COL[i];
      const cell = document.createElement('div');
      let border = '';
      if (c % 3 === 2 && c < 8) border += ' br';
      if (r % 3 === 2 && r < 8) border += ' bb';
      if (c === 8) border += ' last-col';
      if (r === 8) border += ' last-row';
      cell.dataset.border = border;
      cell.dataset.i = i;
      cell.className = 'cell' + border;
      const val = document.createElement('span'); val.className = 'val';
      const notes = document.createElement('div'); notes.className = 'notes';
      cell._notes = [];
      for (let d = 1; d <= 9; d++) { const n = document.createElement('span'); notes.appendChild(n); cell._notes.push(n); }
      cell._val = val; cell._notesMask = 0; cell._hlBit = 0;
      cell.appendChild(val); cell.appendChild(notes);
      frag.appendChild(cell); cells.push(cell);
    }
    el.board.appendChild(frag);
    el.board.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const cell = e.target.closest('.cell'); if (!cell) return;
      e.preventDefault();
      selectCell(Number(cell.dataset.i));
    });
    el.boardPaused.addEventListener('click', resumeGame);
  }

  function buildNumpad() {
    for (let d = 1; d <= 9; d++) {
      const b = document.createElement('button');
      b.className = 'num'; b.dataset.d = d;
      const v = document.createElement('span'); v.className = 'num-val'; v.textContent = d;
      const rem = document.createElement('span'); rem.className = 'num-rem';
      b._rem = rem; b.appendChild(v); b.appendChild(rem);
      el.numpad.appendChild(b); numButtons.push(b);
    }
    el.numpad.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const b = e.target.closest('.num'); if (!b) return;
      e.preventDefault();
      onNumpad(Number(b.dataset.d));
    });
  }

  function buildDiffList() {
    el.diffList.innerHTML = DIFFS.map((d) => `<button class="btn btn-list" data-diff="${d}"><svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3zm2 2v4.3h4.3V5H5zm6.3 0v4.3h4.4V5h-4.4zm6.4 0v4.3H19V5h-1.3zM5 11.3v4.4h4.3v-4.4H5zm6.3 0v4.4h4.4v-4.4h-4.4zm6.4 0v4.4H19v-4.4h-1.3zM5 17.7V19h4.3v-1.3H5zm6.3 0V19h4.4v-1.3h-4.4zm6.4 0V19H19v-1.3h-1.3z"/></svg><span class="diff-name">${d}</span></button>`).join('');
    el.diffList.addEventListener('click', (e) => {
      const b = e.target.closest('.btn-list'); if (!b) return;
      startNewGame(b.dataset.diff, 'classic', null);
    });
  }

  function buildStatsTabs() {
    el.statsTabs.innerHTML = DIFFS.map((d) => `<button class="chip" data-diff="${d}">${d}</button>`).join('');
    el.statsTabs.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      state.statsDiff = c.dataset.diff; renderStats();
    });
  }

  function bindEvents() {
    // Home
    $('btn-new-game').addEventListener('click', () => openNewGameSheet('home'));
    el.btnContinue.addEventListener('click', continueClassic);
    el.dailyCardBtn.addEventListener('click', () => openDaily(todayKey()));
    $('btn-settings-home').addEventListener('click', () => { renderSettings(); openSheet('sheet-settings'); });
    $('btn-stats-home').addEventListener('click', () => showScreen('stats'));
    // Tab bar
    el.tabbar.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) showScreen(b.dataset.screen); });
    // Game
    $('btn-back').addEventListener('click', goHome);
    $('btn-game-settings').addEventListener('click', () => { renderSettings(); openSheet('sheet-settings'); });
    $('btn-pause').addEventListener('click', pauseGame);
    $('btn-resume').addEventListener('click', resumeGame);
    $('ctrl-undo').addEventListener('click', undo);
    $('ctrl-erase').addEventListener('click', eraseCell);
    $('ctrl-notes').addEventListener('click', toggleNotes);
    $('ctrl-hint').addEventListener('click', useHint);
    // Sheets
    el.btnRestart.addEventListener('click', () => { if (confirm(t('confirmRestart'))) restartGame(); });
    $('btn-cancel-newgame').addEventListener('click', cancelNewGameSheet);
    $('btn-close-settings').addEventListener('click', () => closeSheet());
    el.backdrop.addEventListener('click', () => { if (state.openSheet === 'sheet-newgame') cancelNewGameSheet(); else closeSheet(); });
    el.settingsList.addEventListener('click', (e) => {
      const lang = e.target.closest('[data-lang]'); if (lang) { setSetting('lang', lang.dataset.lang); return; }
      const tg = e.target.closest('.toggle'); if (!tg) return;
      const key = tg.closest('.setting').dataset.key;
      setSetting(key, !state.settings[key]);
      tg.classList.toggle('on', state.settings[key]);
      tg.setAttribute('aria-checked', String(state.settings[key]));
    });
    // Modals
    el.btnSecondChance.addEventListener('click', secondChance);
    $('btn-gameover-new').addEventListener('click', abandonAndNewGame);
    $('btn-win-new').addEventListener('click', abandonAndNewGame);
    $('btn-win-home').addEventListener('click', goHome);
    // Pause modal: allow starting a new game from there
    const pauseNew = document.createElement('button');
    pauseNew.className = 'btn btn-text'; pauseNew.dataset.i18n = 'newGame'; pauseNew.textContent = t('newGame');
    pauseNew.addEventListener('click', () => { closeModal('pause'); openNewGameSheet('game'); });
    $('modal-pause').querySelector('.modal-card').appendChild(pauseNew);
    // Daily
    el.btnPrevMonth.addEventListener('click', () => { const c = state.cal; c.month--; if (c.month < 0) { c.month = 11; c.year--; } renderCalendar(); });
    el.btnNextMonth.addEventListener('click', () => { const c = state.cal; c.month++; if (c.month > 11) { c.month = 0; c.year++; } renderCalendar(); });
    el.calGrid.addEventListener('click', (e) => {
      const d = e.target.closest('.cal-day'); if (!d || d.classList.contains('empty') || d.classList.contains('future')) return;
      state.dailySelected = d.dataset.key; renderCalendar();
    });
    el.btnDailyPlay.addEventListener('click', () => { if (state.dailySelected) openDaily(state.dailySelected); });
    // Keyboard (desktop)
    document.addEventListener('keydown', (e) => {
      if (state.screen !== 'game') return;
      if (e.key >= '1' && e.key <= '9') { onNumpad(Number(e.key)); return; }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { eraseCell(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { undo(); e.preventDefault(); return; }
      if (e.key.toLowerCase() === 'n') { toggleNotes(); return; }
      if (e.key.toLowerCase() === 'h') { useHint(); return; }
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') { if (state.paused) resumeGame(); else pauseGame(); return; }
      const arrows = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
      if (e.key in arrows && playing()) {
        e.preventDefault();
        let i = state.selected < 0 ? 0 : state.selected + arrows[e.key];
        if (i < 0) i += 81; if (i > 80) i -= 81;
        state.selected = i; renderBoard();
      }
    });
    // Auto-pause when app goes to background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (state.screen === 'game' && playing()) pauseGame(); else if (state.game) saveGame(); }
      else state.lastTick = Date.now();
    });
    window.addEventListener('pagehide', () => { if (state.game && state.game.status === 'playing') saveGame(); });
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  async function init() {
    Object.assign(el, {
      board: $('board'), boardPaused: $('board-paused'), numpad: $('numpad'), tabbar: $('tabbar'),
      stDiff: $('st-diff'), stMist: $('st-mist'), stScore: $('st-score'), stTime: $('st-time'), gameStats: document.querySelector('.game-stats'), gameTitle: $('game-title'),
      notesBadge: $('notes-badge'), hintBadge: $('hint-badge'), ctrlNotes: $('ctrl-notes'), ctrlUndo: $('ctrl-undo'),
      backdrop: $('backdrop'), diffList: $('diff-list'), btnRestart: $('btn-restart'), newgameSub: $('newgame-sub'),
      settingsList: $('settings-list'), pauseRows: $('pause-rows'), winRows: $('win-rows'), winText: $('win-text'), btnSecondChance: $('btn-second-chance'),
      loading: $('loading'), toast: $('toast'),
      btnContinue: $('btn-continue'), continueInfo: $('continue-info'), dailyCardDate: $('daily-card-date'), dailyCardBtn: $('daily-card-btn'),
      calTitle: $('cal-title'), calWeekdays: $('cal-weekdays'), calGrid: $('cal-grid'), dailyProgress: $('daily-progress'), dailySelected: $('daily-selected'),
      btnDailyPlay: $('btn-daily-play'), btnPrevMonth: $('btn-prev-month'), btnNextMonth: $('btn-next-month'),
      statsTabs: $('stats-tabs'), statsContent: $('stats-content'),
    });
    try { const saved = await DB.get('settings'); if (saved) state.settings = { ...DEFAULT_SETTINGS, ...saved }; } catch (e) { /* ignore */ }
    buildBoard(); buildNumpad(); buildDiffList(); buildStatsTabs();
    bindEvents();
    applyI18n();
    document.querySelectorAll('#screen-home, #screen-daily, #screen-stats').forEach((s) => s.classList.add('with-tabbar'));
    await loadDailyMap();
    showScreen('home');
    if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
