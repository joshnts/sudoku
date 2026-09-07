/* Tiny IndexedDB wrapper with localStorage fallback.
   Stores: kv (settings, saved games, daily progress) and games (history for statistics). */
const DB = (() => {
  'use strict';
  const NAME = 'sudoku-app', VERSION = 1;
  let dbp = null, fallback = false;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('no-indexeddb'));
      let req;
      try { req = indexedDB.open(NAME, VERSION); } catch (e) { return reject(e); }
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('games')) {
          const s = d.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
          s.createIndex('difficulty', 'difficulty');
          s.createIndex('date', 'date');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked'));
    }).catch(err => { console.warn('IndexedDB unavailable, using localStorage fallback', err); fallback = true; return null; });
    return dbp;
  }

  function tx(store, mode, fn) {
    return open().then(d => {
      if (!d) return fallbackOp(store, mode, fn);
      return new Promise((resolve, reject) => {
        const t = d.transaction(store, mode);
        const s = t.objectStore(store);
        let out;
        const req = fn(s);
        if (req) req.onsuccess = () => { out = req.result; };
        t.oncomplete = () => resolve(out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error('aborted'));
      });
    });
  }

  // ---- localStorage fallback (emulates the few operations we use) ----
  const LS_KV = 'sudoku-kv:', LS_GAMES = 'sudoku-games';
  function lsGames() { try { return JSON.parse(localStorage.getItem(LS_GAMES) || '[]'); } catch { return []; } }
  function lsSetGames(a) { try { localStorage.setItem(LS_GAMES, JSON.stringify(a)); } catch {} }
  function fallbackOp(store, mode, fn) {
    // fn receives a fake store object; we implement the methods we use.
    let result;
    const fake = {
      get: (k) => { if (store === 'kv') { try { const v = localStorage.getItem(LS_KV + k); result = v == null ? undefined : JSON.parse(v); } catch { result = undefined; } } else { result = lsGames().find(g => g.id === k); } return null; },
      put: (v, k) => { if (store === 'kv') { try { localStorage.setItem(LS_KV + k, JSON.stringify(v)); } catch {} } else { const a = lsGames(); const i = a.findIndex(g => g.id === v.id); if (i >= 0) a[i] = v; else a.push(v); lsSetGames(a); result = v.id; } return null; },
      add: (v) => { const a = lsGames(); v.id = (a.reduce((m, g) => Math.max(m, g.id || 0), 0) + 1); a.push(v); lsSetGames(a); result = v.id; return null; },
      delete: (k) => { if (store === 'kv') localStorage.removeItem(LS_KV + k); else lsSetGames(lsGames().filter(g => g.id !== k)); return null; },
      getAll: () => { result = lsGames(); return null; },
      clear: () => { lsSetGames([]); return null; },
    };
    fn(fake);
    return Promise.resolve(result);
  }

  return {
    get: (k) => tx('kv', 'readonly', s => s.get(k)),
    set: (k, v) => tx('kv', 'readwrite', s => s.put(v, k)),
    del: (k) => tx('kv', 'readwrite', s => s.delete(k)),
    addGame: (g) => tx('games', 'readwrite', s => s.add(g)),
    putGame: (g) => tx('games', 'readwrite', s => s.put(g)),
    getGame: (id) => tx('games', 'readonly', s => s.get(id)),
    allGames: () => tx('games', 'readonly', s => s.getAll()),
    clearGames: () => tx('games', 'readwrite', s => s.clear()),
    isFallback: () => fallback,
  };
})();
