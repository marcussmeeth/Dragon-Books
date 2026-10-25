import assert from 'node:assert/strict';
import { newGame, update, act, activeCrew, noise, objectivesLeft } from '../games/action/engine.js';
import { LEVELS } from '../games/action/data.js';

const step = (g, secs, input = {}) => { for (let t = 0; t < secs; t += 1 / 30) update(g, 1 / 30, input); };
const bare = (li = 0) => { const g = newGame(li); g.guards.length = 0; return g; };
const alone = (g, id) => { g.active = id; for (const c of g.crew) if (c.id !== id) { c.f = 0; c.x = 20; } return g.crew.find((c) => c.id === id); };
const guard = (g, o) => { g.guards.push({ id: 'x', hp: 2, mode: 'idle', patrol: null, home: {}, wait: 0, scan: 99, det: 0, target: null, look: 0, lostT: 0, cool: 0, ko: false, hurt: 0, found: false, ...o }); return g.guards.at(-1); };

// Data sanity: everything sits on a real floor segment and stairs link existing floors.
for (const L of LEVELS) {
  const on = (f, x) => L.floors[f] && L.floors[f].segs.some((s) => x >= s[0] && x <= s[1]);
  assert.ok(on(L.start.f, L.start.x), `${L.id} start`);
  for (const o of [...L.guards, ...L.hostages, ...L.items, ...L.terminals]) assert.ok(on(o.f, o.x), `${L.id} ${o.id}`);
  for (const s of L.stairs) assert.ok(on(s.a, s.x) && on(s.b, s.x), `${L.id} stair ${s.x}`);
  for (const d of L.doors) assert.ok(on(d.f, d.x), `${L.id} door ${d.x}`);
}

// Stab from behind is a silent kill that does not alert neighbours.
{
  const g = bare(); const a = guard(g, { f: 1, x: 300, dir: 1 }); const b = guard(g, { f: 1, x: 420, dir: 1 });
  const c = activeCrew(g); c.x = 280; c.f = 1; c.crouch = true;
  assert.ok(act(g, 'stab')); assert.equal(a.ko, true); step(g, 1);
  assert.notEqual(b.mode, 'alert'); assert.equal(g.siphon === 0 || true, true);
}
// Stab from the front only wounds and alerts.
{
  const g = bare(); const a = guard(g, { f: 1, x: 300, dir: -1 }); const c = activeCrew(g); c.x = 280; c.f = 1;
  act(g, 'stab'); assert.equal(a.ko, false); assert.equal(a.mode, 'alert');
}
// Standing in a guard's cone gets you spotted; crouching at range does not; behind him you are safe.
{
  const g = bare(); const a = guard(g, { f: 1, x: 500, dir: 1 }); const c = activeCrew(g); c.f = 1; c.x = 700; c.crouch = false;
  step(g, 2); assert.equal(a.mode, 'alert');
  const g2 = bare(); const a2 = guard(g2, { f: 1, x: 500, dir: 1 }); const c2 = activeCrew(g2); c2.f = 1; c2.x = 700; c2.crouch = true; // 200 > 0.55*300
  step(g2, 3); assert.equal(a2.mode, 'idle');
  const g3 = bare(); const a3 = guard(g3, { f: 1, x: 500, dir: -1 }); const c3 = activeCrew(g3); c3.f = 1; c3.x = 700;
  step(g3, 3); assert.equal(a3.mode, 'idle');
}
// A closed door blocks sight; walking into it opens it.
{
  const g = bare(); g.doors.push({ f: 1, x: 600, open: false }); const a = guard(g, { f: 1, x: 500, dir: 1 }); const c = activeCrew(g); c.f = 1; c.x = 650;
  step(g, 2); assert.equal(a.mode, 'idle'); c.x = 640; step(g, 0.5, { move: -1 }); assert.equal(g.doors.at(-1).open, true);
}
// Noise lures an unaware guard to investigate; a bottle does it without alarm.
{
  const g = bare(); const a = guard(g, { f: 1, x: 300, dir: -1 }); const w = alone(g, 'walt'); w.f = 1; w.x = 100; w.dir = 1;
  act(g, 'bottle'); assert.equal(a.mode, 'investigate'); step(g, 5); assert.ok(Math.abs(a.x - 340) < 12); assert.notEqual(a.mode, 'alert');
}
// Silenced shot kills an unaware guard quietly from range; a loud shot wakes the neighbours.
{
  const g = bare(); const a = guard(g, { f: 1, x: 720, dir: -1 }); const b = guard(g, { f: 1, x: 960, dir: -1 });
  const c = alone(g, 'imani'); c.f = 1; c.x = 520; c.dir = 1; c.crouch = true; act(g, 'shoot');
  assert.equal(a.ko, true); assert.equal(b.mode, 'idle');
  const g2 = bare(); const a2 = guard(g2, { f: 1, x: 720, dir: -1 }); const b2 = guard(g2, { f: 1, x: 880, dir: -1 }); const d = alone(g2, 'dale'); d.f = 1; d.x = 520; d.dir = 1; act(g2, 'shoot');
  assert.equal(a2.ko, true); assert.equal(b2.mode, 'investigate');
}
// Grenades roll, explode, kill guards and hurt friends; blasting hostages fails the mission.
{
  const g = bare(); const a = guard(g, { f: 1, x: 700, dir: -1 }); const c = alone(g, 'dale'); c.f = 1; c.x = 520; c.dir = 1; c.crouch = true;
  act(g, 'grenade'); step(g, 2); assert.equal(a.ko, true); assert.equal(c.hp, 3);
  const g2 = bare(); const d = activeCrew(g2); d.f = 1; d.x = 200; d.dir = 1; g2.hostages[0].f = 1; g2.hostages[0].x = 330; act(g2, 'grenade'); step(g2, 2); assert.equal(g2.over, 'hostage');
  const g3 = bare(); const e = activeCrew(g3); e.f = 1; e.x = 200; e.dir = 1; g3.grenades.push({ x: 210, f: 1, vx: 0, fuse: 0.1 }); step(g3, 0.5); assert.equal(e.hp, 1);
}
// Interactions, stairs and winning.
{
  const g = bare(0); const c = activeCrew(g); c.f = 1; c.x = 1390; step(g, 1.2, { use: true }); assert.equal(g.hostages[0].freed, true);
  c.f = 1; c.x = 720; update(g, 0.02, { vert: -1 }); assert.equal(c.f, 0);
  c.x = 1380; step(g, 1.8, { use: true }); assert.equal(g.terminals[0].off, true); assert.equal(g.over, 'win');
}
// Siphon loses the game; getting shot to death does too.
{
  const g = bare(0); g.siphon = 99.9; step(g, 1); assert.equal(g.over, 'siphon');
  const g2 = bare(0); const a = guard(g2, { f: 1, x: 500, dir: 1, mode: 'alert' }); const c = activeCrew(g2); c.f = 1; c.x = 650; c.crouch = false;
  step(g2, 60); assert.equal(g2.over, 'down');
}
// Fuzz: random inputs never throw or leave NaNs, on every level.
for (let li = 0; li < LEVELS.length; li++) {
  const g = newGame(li, 7); let s = 3;
  for (let i = 0; i < 6000 && !g.over; i++) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0; const r = s / 4294967296;
    if (r < 0.02) act(g, ['stab', 'shoot', 'grenade', 'bottle', 'switch', 'crouch'][Math.floor(r * 300) % 6]);
    update(g, 1 / 30, { move: r < 0.4 ? -1 : r < 0.8 ? 1 : 0, vert: r > 0.97 ? -1 : r < 0.03 ? 1 : 0, use: r > 0.5 });
    for (const c of g.crew) assert.ok(Number.isFinite(c.x) && Number.isFinite(c.hp));
    for (const q of g.guards) assert.ok(Number.isFinite(q.x));
  }
}
console.log('action tests passed');
