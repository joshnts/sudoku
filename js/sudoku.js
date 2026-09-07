/* Sudoku engine: solver (bitmask + MRV), generator with unique solution,
   difficulty by clue count + "singles-solvable" gating, seeded RNG for daily puzzles. */
const Sudoku = (() => {
  'use strict';

  // ---------- RNG ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^ h >>> 16) >>> 0;
  }
  function rng(seed) {
    if (typeof seed === 'string') seed = hashStr(seed);
    if (seed === undefined || seed === null) seed = (Math.random() * 4294967296) >>> 0;
    return mulberry32(seed >>> 0);
  }
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- Geometry ----------
  const ROW = new Uint8Array(81), COL = new Uint8Array(81), BOX = new Uint8Array(81);
  const PEERS = [];
  for (let i = 0; i < 81; i++) {
    ROW[i] = (i / 9) | 0; COL[i] = i % 9;
    BOX[i] = ((ROW[i] / 3) | 0) * 3 + ((COL[i] / 3) | 0);
  }
  for (let i = 0; i < 81; i++) {
    const p = [];
    for (let j = 0; j < 81; j++) {
      if (j !== i && (ROW[j] === ROW[i] || COL[j] === COL[i] || BOX[j] === BOX[i])) p.push(j);
    }
    PEERS.push(p);
  }
  const ALL = 0x1FF;
  function popcount(x) { x = x - ((x >>> 1) & 0x55555555); x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; }

  // ---------- Solver ----------
  // Counts solutions up to `limit`. Returns { count, solution } (solution = first found).
  function solve(grid, limit = 2) {
    const g = Uint8Array.from(grid);
    const rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
    for (let i = 0; i < 81; i++) {
      const v = g[i];
      if (v) { const b = 1 << (v - 1); rows[ROW[i]] |= b; cols[COL[i]] |= b; boxes[BOX[i]] |= b; }
    }
    let count = 0, solution = null;
    function rec() {
      let best = -1, bestMask = 0, bestN = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const mask = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & ALL;
        const n = popcount(mask);
        if (n === 0) return;
        if (n < bestN) { bestN = n; best = i; bestMask = mask; if (n === 1) break; }
      }
      if (best === -1) { count++; if (count === 1) solution = Uint8Array.from(g); return; }
      const r = ROW[best], c = COL[best], b = BOX[best];
      let m = bestMask;
      while (m) {
        const bit = m & -m; m ^= bit;
        const v = 31 - Math.clz32(bit) + 1;
        g[best] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        rec();
        g[best] = 0; rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
        if (count >= limit) return;
      }
    }
    rec();
    return { count, solution };
  }

  // Solve only with naked singles + hidden singles. Returns true if fully solvable that way.
  function singlesSolvable(grid) {
    const g = Uint8Array.from(grid);
    const rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
    let empty = 0;
    for (let i = 0; i < 81; i++) {
      const v = g[i];
      if (v) { const b = 1 << (v - 1); rows[ROW[i]] |= b; cols[COL[i]] |= b; boxes[BOX[i]] |= b; } else empty++;
    }
    const place = (i, bit) => { g[i] = 31 - Math.clz32(bit) + 1; rows[ROW[i]] |= bit; cols[COL[i]] |= bit; boxes[BOX[i]] |= bit; empty--; };
    let progress = true;
    while (empty > 0 && progress) {
      progress = false;
      // naked singles
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const mask = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & ALL;
        if (mask === 0) return false;
        if ((mask & (mask - 1)) === 0) { place(i, mask); progress = true; }
      }
      if (progress) continue;
      // hidden singles per unit
      for (let u = 0; u < 27; u++) {
        const cells = unitCells(u);
        for (let bit = 1; bit <= 0x100; bit <<= 1) {
          let where = -1, n = 0, present = false;
          for (let k = 0; k < 9; k++) {
            const i = cells[k];
            if (g[i]) { if ((1 << (g[i] - 1)) === bit) { present = true; break; } continue; }
            const mask = ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & ALL;
            if (mask & bit) { n++; where = i; }
          }
          if (present) continue;
          if (n === 0) return false;
          if (n === 1) { place(where, bit); progress = true; }
        }
      }
    }
    return empty === 0;
  }
  const UNITS = [];
  for (let r = 0; r < 9; r++) { const u = []; for (let c = 0; c < 9; c++) u.push(r * 9 + c); UNITS.push(u); }
  for (let c = 0; c < 9; c++) { const u = []; for (let r = 0; r < 9; r++) u.push(r * 9 + c); UNITS.push(u); }
  for (let b = 0; b < 9; b++) { const u = []; const r0 = ((b / 3) | 0) * 3, c0 = (b % 3) * 3; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) u.push((r0 + r) * 9 + c0 + c); UNITS.push(u); }
  function unitCells(u) { return UNITS[u]; }

  // ---------- Full grid ----------
  function fullGrid(rnd) {
    const g = new Uint8Array(81);
    const rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    function rec(i) {
      if (i === 81) return true;
      const r = ROW[i], c = COL[i], b = BOX[i];
      const used = rows[r] | cols[c] | boxes[b];
      shuffle(digits, rnd);
      for (let k = 0; k < 9; k++) {
        const v = digits[k], bit = 1 << (v - 1);
        if (used & bit) continue;
        g[i] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        if (rec(i + 1)) return true;
        g[i] = 0; rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit;
      }
      return false;
    }
    rec(0);
    return g;
  }

  // ---------- Generator ----------
  // Target clue counts (approximate sudoku.com ranges) and gating rules.
  const LEVELS = {
    easy:    { clues: 40, singles: true,  wantHard: false, attempts: 3 },
    medium:  { clues: 34, singles: true,  wantHard: false, attempts: 3 },
    hard:    { clues: 29, singles: false, wantHard: true,  attempts: 4 },
    expert:  { clues: 26, singles: false, wantHard: true,  attempts: 6 },
    master:  { clues: 24, singles: false, wantHard: true,  attempts: 8 },
    extreme: { clues: 21, singles: false, wantHard: true,  attempts: 12 },
  };

  function generate(difficulty, rnd) {
    rnd = rnd || rng();
    const L = LEVELS[difficulty] || LEVELS.medium;
    const solution = fullGrid(rnd);
    let best = null, bestClues = 82;
    for (let attempt = 0; attempt < L.attempts; attempt++) {
      const puzzle = Uint8Array.from(solution);
      const order = shuffle(Array.from({ length: 81 }, (_, i) => i), rnd);
      let clues = 81;
      for (let k = 0; k < 81 && clues > L.clues; k++) {
        const i = order[k];
        const v = puzzle[i];
        puzzle[i] = 0;
        if (solve(puzzle, 2).count !== 1) { puzzle[i] = v; continue; }
        if (L.singles && !singlesSolvable(puzzle)) { puzzle[i] = v; continue; }
        clues--;
      }
      const isSingles = singlesSolvable(puzzle);
      const ok = clues <= L.clues && (!L.wantHard || !isSingles);
      if (ok) return { puzzle, solution, clues };
      // keep the best fallback (fewest clues; prefer non-singles for hard levels)
      const score = clues + (L.wantHard && isSingles ? 5 : 0);
      if (score < bestClues) { bestClues = score; best = { puzzle, solution, clues }; }
    }
    return best;
  }

  function dailySeed(dateKey) { return hashStr('sudoku-daily-' + dateKey); }
  function dailyDifficulty(dateKey) {
    const r = rng(hashStr('sudoku-daily-diff-' + dateKey))();
    return r < 0.35 ? 'medium' : r < 0.75 ? 'hard' : 'expert';
  }

  return { rng, hashStr, shuffle, solve, singlesSolvable, generate, fullGrid, ROW, COL, BOX, PEERS, UNITS, LEVELS, dailySeed, dailyDifficulty };
})();
