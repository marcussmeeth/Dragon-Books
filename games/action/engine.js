// Pure real-time logic (no DOM): update(g, dt, input) each frame, act(g, name) for button presses.
import { LEVELS, CREW, CREW_ORDER, K, TEXT } from './data.js';

export const level = (g) => LEVELS[g.level];
const sign = (n) => (n < 0 ? -1 : 1);

export function newGame(li = 0, seed = 1) {
  const L = LEVELS[li];
  return {
    level: li, t: 0, siphon: 0, over: null, seed, alertCool: 0, events: [], effects: [], grenades: [],
    active: 'dale', use: { target: null, prog: 0 },
    crew: CREW_ORDER.map((id, i) => ({ id, x: L.start.x - i * 28, f: L.start.f, dir: 1, hp: K.HP, alive: true, crouch: i > 0, cool: 0, stair: 0,
      ammo: CREW[id].ammo, gren: CREW[id].gren, bottles: CREW[id].bottles, moving: false })),
    guards: L.guards.map((x) => ({ id: x.id, x: x.x, f: x.f, dir: x.dir, hp: K.GUARD_HP, mode: x.patrol ? 'patrol' : 'idle', patrol: x.patrol || null,
      home: { x: x.x, dir: x.dir }, wait: 0, scan: 2 + Math.random() * 2, det: 0, target: null, look: 0, lostT: 0, cool: 0, ko: false, hurt: 0, found: false, moving: false })),
    doors: L.doors.map((d) => ({ ...d, open: false })),
    hostages: L.hostages.map((h) => ({ ...h, freed: false })),
    items: L.items.map((i) => ({ ...i, got: false })),
    terminals: L.terminals.map((t) => ({ ...t, off: false })),
  };
}

const rnd = (g) => { g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0; return g.seed / 4294967296; };
const say = (g, text, kind = 'info') => g.events.push({ text, kind });
export const activeCrew = (g) => g.crew.find((c) => c.id === g.active);
export const sirenRate = (g) => g.terminals.filter((t) => !t.off).reduce((s, t) => s + t.rate, 0);

function segOf(g, f, x) {
  const segs = level(g).floors[f].segs;
  return segs.find((s) => x >= s[0] && x <= s[1]) || segs.slice().sort((a, b) => Math.abs(x - (a[0] + a[1]) / 2) - Math.abs(x - (b[0] + b[1]) / 2))[0];
}
export function blocked(g, f, xa, xb) {
  const lo = Math.min(xa, xb), hi = Math.max(xa, xb);
  return g.doors.some((d) => d.f === f && !d.open && d.x > lo && d.x < hi);
}

// Move along a floor. Closed doors open on contact (and stop you for that frame).
function move(g, e, dx) {
  if (!dx) return;
  const seg = segOf(g, e.f, e.x); let nx = e.x + dx;
  for (const d of g.doors) {
    if (d.f !== e.f || d.open) continue;
    if ((dx > 0 && e.x <= d.x && nx > d.x) || (dx < 0 && e.x >= d.x && nx < d.x)) { d.open = true; nx = d.x - sign(dx) * 8; }
  }
  e.x = Math.max(seg[0] + 12, Math.min(seg[1] - 12, nx));
}

const stairsAt = (g, f) => level(g).stairs.filter((s) => s.a === f || s.b === f);
const otherFloor = (s, f) => (s.a === f ? s.b : s.a);

// Walk toward (tx, tf), using stairs if the target is on another floor. Returns true on arrival.
function headToward(g, gd, tx, tf, speed, dt) {
  if (gd.f === tf) {
    if (Math.abs(gd.x - tx) < 8) return true;
    gd.dir = sign(tx - gd.x); move(g, gd, gd.dir * speed * dt); gd.moving = true; return false;
  }
  const st = stairsAt(g, gd.f).sort((a, b) => Math.abs(otherFloor(a, gd.f) - tf) - Math.abs(otherFloor(b, gd.f) - tf))[0];
  if (!st) return true;
  if (Math.abs(gd.x - st.x) < 8) { gd.f = otherFloor(st, gd.f); gd.x = st.x; return false; }
  gd.dir = sign(st.x - gd.x); move(g, gd, gd.dir * speed * dt); gd.moving = true; return false;
}

export function noise(g, x, f, r) {
  for (const gd of g.guards) {
    if (gd.ko || gd.mode === 'alert') continue;
    const rows = Math.abs(gd.f - f); const dx = Math.abs(gd.x - x);
    if ((rows === 0 && dx <= r) || (rows === 1 && dx <= r * 0.6)) { gd.mode = 'investigate'; gd.target = { x, f }; gd.look = 0; }
  }
}

function alertGuard(g, gd, quiet) {
  if (gd.mode === 'alert' || gd.ko) return;
  gd.mode = 'alert'; gd.det = 1; gd.lostT = 0;
  if (g.alertCool <= 0 && !quiet) { g.siphon = Math.min(100, g.siphon + K.SPOTTED_SIPHON); g.alertCool = 2; say(g, 'Spotted! The alarm goes up.', 'bad'); }
  for (const o of g.guards) if (!o.ko && o.mode !== 'alert' && o.f === gd.f && Math.abs(o.x - gd.x) < 280) { o.mode = 'alert'; o.det = 1; o.lostT = 0; }
}

function koGuard(g, gd) { gd.ko = true; gd.hp = 0; gd.mode = 'ko'; }

function hurtCrew(g, c, n) {
  c.hp -= n; g.effects.push({ type: 'hit', x: c.x, f: c.f, t: 0 });
  if (c.hp <= 0) { c.hp = 0; c.alive = false; g.over = 'down'; }
}

function explode(g, gr) {
  g.effects.push({ type: 'boom', x: gr.x, f: gr.f, t: 0 });
  for (const gd of g.guards) if (!gd.ko && gd.f === gr.f && Math.abs(gd.x - gr.x) <= K.BLAST && !blocked(g, gr.f, gd.x, gr.x)) koGuard(g, gd);
  for (const c of g.crew) if (c.alive && c.f === gr.f && Math.abs(c.x - gr.x) <= K.BLAST && !blocked(g, gr.f, c.x, gr.x)) { hurtCrew(g, c, 2); say(g, `${CREW[c.id].name.split(' ')[0]} is caught in the blast.`, 'bad'); }
  for (const h of g.hostages) if (!h.freed && h.f === gr.f && Math.abs(h.x - gr.x) <= K.BLAST + 20) g.over = g.over || 'hostage';
  for (const d of g.doors) if (d.f === gr.f && Math.abs(d.x - gr.x) <= K.BLAST) d.open = true;
  noise(g, gr.x, gr.f, 900);
}

function seesCrew(g, gd) {
  let best = null; let rate = 0;
  for (const c of g.crew) {
    if (!c.alive || c.f !== gd.f) continue;
    const dx = c.x - gd.x; const d = Math.abs(dx);
    let range = dx * gd.dir > 0 ? K.VIS * (c.crouch ? 0.55 : 1) : 0;
    if (d < K.CLOSE) range = Math.max(range, K.CLOSE);
    if (d > range || blocked(g, gd.f, gd.x, c.x)) continue;
    const r = 0.9 + (1 - d / Math.max(range, 1)) * 2.6;
    if (r > rate) { rate = r; best = c; }
  }
  return { c: best, rate };
}

function guardUpdate(g, gd, dt) {
  gd.moving = false; gd.cool = Math.max(0, gd.cool - dt); gd.hurt = Math.max(0, gd.hurt - dt);
  const { c, rate } = seesCrew(g, gd);
  if (c) { gd.det = Math.min(1, gd.det + (gd.mode === 'alert' ? 3 : 1) * rate * dt); gd.last = { x: c.x, f: c.f }; gd.lostT = 0; }
  else { gd.det = Math.max(0, gd.det - 0.45 * dt); if (gd.mode === 'alert') gd.lostT += dt; }
  if (gd.det >= 1 && gd.mode !== 'alert') alertGuard(g, gd);

  if (gd.mode !== 'alert') {
    for (const b of g.guards) {
      if (!b.ko || b.found || b.f !== gd.f) continue;
      const dx = b.x - gd.x;
      if (dx * gd.dir > 0 && Math.abs(dx) < K.VIS * 0.8 && !blocked(g, gd.f, gd.x, b.x)) { b.found = true; gd.mode = 'investigate'; gd.target = { x: b.x, f: b.f }; gd.look = 0; say(g, 'A guard has found a body.', 'warn'); }
    }
  }

  if (gd.mode === 'alert') {
    if (c) {
      gd.dir = sign(c.x - gd.x); const d = Math.abs(c.x - gd.x);
      if (d > 170) { move(g, gd, gd.dir * K.ALERT * dt); gd.moving = true; }
      if (d < K.GUARD_RANGE && gd.cool <= 0) {
        gd.cool = 0.95; g.effects.push({ type: 'shot', x: gd.x, f: gd.f, to: c.x, t: 0 });
        if (rnd(g) < (c.crouch ? 0.35 : 0.55)) hurtCrew(g, c, 1);
        noise(g, gd.x, gd.f, 350);
      }
    } else if (gd.last) {
      if (headToward(g, gd, gd.last.x, gd.last.f, K.ALERT, dt) && gd.lostT > 3) { gd.mode = 'investigate'; gd.target = { ...gd.last }; gd.look = 0; gd.det = 0.3; }
      if (gd.lostT > 8) { gd.mode = 'investigate'; gd.target = { ...gd.last }; gd.look = 0; gd.det = 0; }
    }
    return;
  }
  if (c && gd.det > 0.45) { gd.dir = sign(c.x - gd.x); return; } // noticed something: stop and stare
  if (gd.mode === 'investigate') {
    if (headToward(g, gd, gd.target.x, gd.target.f, K.INVESTIGATE, dt)) {
      gd.look += dt; if (gd.look > 1.2 && gd.look - dt <= 1.2) gd.dir = -gd.dir;
      if (gd.look > 3) { gd.mode = gd.patrol ? 'patrol' : 'idle'; gd.target = null; }
    }
    return;
  }
  if (gd.mode === 'patrol') {
    if (gd.f !== gd.homeF && gd.homeF !== undefined) { /* stays where it is after chasing */ }
    if (gd.wait > 0) { gd.wait -= dt; return; }
    move(g, gd, gd.dir * K.PATROL * dt); gd.moving = true;
    if (gd.x <= gd.patrol[0]) { gd.dir = 1; gd.wait = 1.2; } else if (gd.x >= gd.patrol[1]) { gd.dir = -1; gd.wait = 1.2; }
    return;
  }
  gd.scan -= dt; if (gd.scan <= 0) { gd.dir = -gd.dir; gd.scan = 3 + rnd(g) * 2; }
}

function interactTarget(g, c) {
  const near = (o) => o.f === c.f && Math.abs(o.x - c.x) < 46;
  const h = g.hostages.find((o) => !o.freed && near(o)); if (h) return { kind: 'hostage', o: h, need: 1 };
  const i = g.items.find((o) => !o.got && near(o)); if (i) return { kind: 'item', o: i, need: 0.3 };
  const t = g.terminals.find((o) => !o.off && near(o)); if (t) return { kind: 'terminal', o: t, need: 1.6 };
  return null;
}

export const objectivesLeft = (g) => g.hostages.filter((h) => !h.freed).length + g.items.filter((i) => !i.got).length + g.terminals.filter((t) => !t.off).length;

// input: { move: -1|0|1, vert: -1 (up) | 0 | 1 (down), use: bool }
export function update(g, dt, input = {}) {
  if (g.over) return;
  g.t += dt; g.alertCool = Math.max(0, g.alertCool - dt);
  const c = activeCrew(g);
  for (const o of g.crew) { o.cool = Math.max(0, o.cool - dt); o.stair = Math.max(0, o.stair - dt); o.moving = false; }
  const mv = input.move || 0;
  if (mv) { c.dir = mv; c.moving = true; move(g, c, mv * (c.crouch ? K.CROUCH : K.WALK) * dt); }
  if (input.vert && c.stair <= 0) {
    const want = c.f + input.vert;
    const st = stairsAt(g, c.f).find((s) => otherFloor(s, c.f) === want && Math.abs(s.x - c.x) < 36);
    if (st) { c.f = want; c.x = st.x; c.stair = 0.4; }
  }
  const tgt = input.use && !mv ? interactTarget(g, c) : null;
  if (tgt && g.use.target === tgt.o) g.use.prog += dt / tgt.need; else { g.use.target = tgt ? tgt.o : null; g.use.prog = 0; }
  if (tgt && g.use.prog >= 1) {
    if (tgt.kind === 'hostage') { tgt.o.freed = true; say(g, `You freed ${tgt.o.name}.`, 'good'); }
    if (tgt.kind === 'item') { tgt.o.got = true; say(g, `You have ${tgt.o.name}.`, 'good'); }
    if (tgt.kind === 'terminal') { tgt.o.off = true; say(g, `You pulled the plug on ${tgt.o.name}.`, 'good'); }
    g.use = { target: null, prog: 0 };
  }
  for (const gd of g.guards) if (!gd.ko) guardUpdate(g, gd, dt);
  for (const gr of g.grenades) {
    gr.fuse -= dt; const before = gr.x; const seg = segOf(g, gr.f, gr.x);
    gr.vx = Math.max(0, Math.abs(gr.vx) - 220 * dt) * sign(gr.vx); gr.x += gr.vx * dt;
    for (const d of g.doors) if (d.f === gr.f && !d.open && ((before < d.x && gr.x >= d.x) || (before > d.x && gr.x <= d.x))) { gr.x = d.x - sign(gr.vx) * 6; gr.vx = -gr.vx * 0.4; }
    if (gr.x < seg[0] + 8 || gr.x > seg[1] - 8) { gr.x = Math.max(seg[0] + 8, Math.min(seg[1] - 8, gr.x)); gr.vx = -gr.vx * 0.4; }
  }
  for (const gr of g.grenades.filter((q) => q.fuse <= 0)) explode(g, gr);
  g.grenades = g.grenades.filter((q) => q.fuse > 0);
  for (const e of g.effects) e.t += dt;
  g.effects = g.effects.filter((e) => e.t < 0.7);
  g.siphon = Math.min(100, g.siphon + sirenRate(g) * dt);
  if (!g.over && g.siphon >= 100) g.over = 'siphon';
  if (!g.over && objectivesLeft(g) === 0) g.over = 'win';
}

export function act(g, name) {
  if (g.over) return false;
  const c = activeCrew(g);
  if (name === 'crouch') { c.crouch = !c.crouch; return true; }
  if (name === 'switch') {
    const alive = g.crew.filter((o) => o.alive); const i = alive.indexOf(c);
    c.crouch = true; g.active = alive[(i + 1) % alive.length].id; return true;
  }
  if (c.cool > 0) return false;
  if (name === 'stab') {
    const gd = g.guards.filter((q) => !q.ko && q.f === c.f && Math.abs(q.x - c.x) <= K.REACH).sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
    c.cool = 0.5; if (!gd) return false;
    c.dir = sign(gd.x - c.x);
    const behind = (c.x - gd.x) * gd.dir < 0;
    if (gd.mode !== 'alert' && behind) { koGuard(g, gd); g.effects.push({ type: 'stab', x: gd.x, f: gd.f, t: 0 }); say(g, 'Silent takedown.', 'good'); return true; }
    gd.hp -= 1; gd.hurt = 0.4; g.effects.push({ type: 'stab', x: gd.x, f: gd.f, t: 0 }); noise(g, gd.x, gd.f, 180);
    if (gd.hp <= 0) { koGuard(g, gd); say(g, 'Takedown, but not a quiet one.', 'warn'); } else { alertGuard(g, gd); }
    return true;
  }
  if (name === 'shoot') {
    if (!CREW[c.id].gun || c.ammo <= 0) { say(g, 'No ammo.', 'warn'); return false; }
    c.ammo -= 1; c.cool = 0.45;
    const loud = CREW[c.id].gun === 'loud'; g.effects.push({ type: 'shot', x: c.x, f: c.f, to: c.x + c.dir * K.GUN_RANGE, t: 0, friendly: true });
    const gd = g.guards.filter((q) => !q.ko && q.f === c.f && (q.x - c.x) * c.dir > 0 && Math.abs(q.x - c.x) <= K.GUN_RANGE && !blocked(g, c.f, c.x, q.x))
      .sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
    noise(g, c.x, c.f, loud ? 480 : 90);
    if (gd) {
      const unaware = gd.mode !== 'alert'; gd.hp -= unaware ? 2 : 1; gd.hurt = 0.4;
      if (gd.hp <= 0) { koGuard(g, gd); say(g, unaware ? 'Sneak shot.' : 'Guard down.', 'good'); } else alertGuard(g, gd);
      if (loud && !gd.ko) alertGuard(g, gd);
    }
    return true;
  }
  if (name === 'grenade') {
    if (c.gren <= 0) { say(g, 'No grenades.', 'warn'); return false; }
    c.gren -= 1; c.cool = 0.6; g.grenades.push({ x: c.x + c.dir * 24, f: c.f, vx: c.dir * 300, fuse: K.FUSE }); return true;
  }
  if (name === 'bottle') {
    if (c.bottles <= 0) { say(g, 'No bottles.', 'warn'); return false; }
    c.bottles -= 1; c.cool = 0.5; const seg = segOf(g, c.f, c.x);
    let lx = Math.max(seg[0] + 12, Math.min(seg[1] - 12, c.x + c.dir * 240));
    for (const d of g.doors) if (d.f === c.f && !d.open && d.x > Math.min(c.x, lx) && d.x < Math.max(c.x, lx)) lx = d.x - c.dir * 10;
    g.effects.push({ type: 'clink', x: lx, f: c.f, t: 0 }); noise(g, lx, c.f, 300); say(g, 'A bottle clinks across the floor.'); return true;
  }
  return false;
}
export { TEXT };
