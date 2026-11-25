/* Игровая модель не зависит от DOM и аудио. В тестах источник случайности подменяется. */
(function (root) {
  'use strict';
  const C = Object.freeze({ duration: 75, step: 1 / 60, travel: 2.8, move: .15, damage: 40, recovery: 2 });
  function create() {
    return { status: 'ready', time: 0, gap: 100, lane: 1, from: 1, target: 1, moving: 0,
      hits: 0, immune: 0, nextRow: 5, nextId: 0, rows: [], events: [] };
  }
  function start(s) { if (s.status === 'ready') s.status = 'running'; return s; }
  function pause(s) { if (s.status === 'running') s.status = 'paused'; }
  function resume(s) { if (s.status === 'paused') s.status = 'running'; }
  function move(s, direction) {
    if (s.status !== 'running' || s.moving > 0 || (direction !== -1 && direction !== 1)) return false;
    const next = s.target + direction;
    if (next < 0 || next > 2) return false;
    s.from = s.lane; s.target = next; s.moving = C.move;
    return true;
  }
  function random(rng) { const n = rng(); return Number.isFinite(n) ? Math.max(0, Math.min(.999999, n)) : .5; }
  function spawn(s, rng) {
    // Ряды разделены минимум 1.25 с. Даже смена двух дорожек занимает лишь 0.3 с.
    // Одна дорожка всегда открыта, а весь ряд виден за 2.8 с до линии столкновения.
    const safe = Math.floor(random(rng) * 3);
    const blocked = [0, 1, 2].filter(lane => lane !== safe);
    if (s.time < 25 || random(rng) < .3) blocked.splice(Math.floor(random(rng) * 2), 1);
    s.rows.push({ id: s.nextId++, at: s.time + C.travel, blocked,
      kind: random(rng) < .5 ? 'rock' : 'log', checked: false });
    s.nextRow += Math.max(1.25, 2.2 - .95 * s.time / C.duration);
  }
  function tick(s, dt = C.step, rng = Math.random) {
    s.events = [];
    if (s.status !== 'running' || !Number.isFinite(dt) || dt <= 0) return s;
    // Большой внешний dt разбивается: столкновения не должны «перепрыгиваться».
    let remaining = Math.min(dt, .25);
    while (remaining > 1e-9 && s.status === 'running') {
      const d = Math.min(C.step, remaining, C.duration - s.time);
      remaining -= d; s.time = Math.min(C.duration, s.time + d);
      s.immune = Math.max(0, s.immune - d);
      s.gap = Math.min(100, s.gap + C.recovery * d);
      if (s.moving > 0) {
        s.moving = s.moving - d < 1e-9 ? 0 : s.moving - d;
        s.lane = s.from + (s.target - s.from) * (1 - s.moving / C.move);
      }
      if (s.time >= s.nextRow && s.time + C.travel < C.duration) spawn(s, rng);
      for (const row of s.rows) {
        if (row.checked || s.time < row.at) continue;
        row.checked = true;
        if (s.immune <= 0 && row.blocked.some(lane => Math.abs(s.lane - lane) < .65)) {
          s.hits++; s.gap = Math.max(0, s.gap - C.damage); s.immune = 1; s.events.push('hit');
          if (s.gap === 0) { s.status = 'lost'; s.events.push('lost'); break; }
        } else s.events.push('dodge');
      }
      s.rows = s.rows.filter(row => s.time - row.at < .75);
      // При одновременном столкновении и финише сначала учитываем столкновение.
      if (s.status === 'running' && s.time >= C.duration) { s.status = 'won'; s.events.push('won'); }
    }
    return s;
  }
  const api = { C, create, start, pause, resume, move, tick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BearEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
