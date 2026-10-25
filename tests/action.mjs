import assert from 'node:assert/strict';
import { newGame, update, act, activeCrew, findPath, sightBlocked, visionPoly, objectivesLeft } from '../games/action/engine.js';
import { LEVELS, K } from '../games/action/data.js';

const step = (g, secs, input = {}) => { for (let t = 0; t < secs; t += 1 / 30) update(g, 1 / 30, input); };
// Open street (market level) with no guards, all crew parked out of the way, so each test sets up exactly what it needs.
const bare = () => { const g = newGame(1); g.guards.length = 0; for (const c of g.crew) { c.x = 40; c.y = 960; c.crouch = true; } return g; };
const alone = (g, id, x, y, aim = 0) => { g.active = id; const c = g.crew.find((q) => q.id === id); c.x = x; c.y = y; c.aim = aim; c.crouch = false; return c; };
const guard = (g, o) => { g.guards.push({ id: 'x' + g.guards.length, hp: 2, state: 'routine', sub: '', routine: [{ look: 0, t: 999 }], step: 0, stepT: 0, anchor: { x: o.x, y: o.y }, path: null, pathT: 0, det: 0, target: null, look: 0,
  lostT: 0, cool: 0, ko: false, busy: false, hurt: 0, found: false, moving: false, stuck: 0, last: null, ...o, face: (o.face || 0) * Math.PI / 180 }); return g.guards.at(-1); };

// Maps: everything sits in open floor and is reachable on foot.
for (let li = 0; li < LEVELS.length; li++) {
  const g = newGame(li); const L = LEVELS[li];
  const free = (p) => !g.walls.concat(g.obst).some(([rx, ry, rw, rh]) => p.x > rx - 6 && p.x < rx + rw + 6 && p.y > ry - 6 && p.y < ry + rh + 6);
  for (const p of [L.start, ...L.hostages, ...L.items, ...L.terminals, ...L.guards]) assert.ok(free(p), `${L.id} ${p.id || 'start'} is inside a wall`);
  for (const o of [...L.hostages, ...L.items, ...L.terminals]) assert.ok(findPath(g, L.start.x, L.start.y, o.x, o.y), `${L.id} ${o.id} unreachable`);
  for (const gd of L.guards) for (const s of gd.routine) if (s.go) assert.ok(findPath(g, gd.x, gd.y, s.go[0], s.go[1]), `${L.id} ${gd.id} route`);
}

// Vision cone: seen in front, not behind, crouching shrinks the range, walls and closed doors block it.
{
  const g = bare(); const a = guard(g, { x: 400, y: 540, face: 0 }); const c = alone(g, 'dale', 600, 540);
  step(g, 2); assert.equal(a.state, 'alert');
  const g2 = bare(); const a2 = guard(g2, { x: 400, y: 540, face: 0 }); alone(g2, 'dale', 200, 540); step(g2, 3); assert.equal(a2.state, 'routine'); // behind him
  const g3 = bare(); const a3 = guard(g3, { x: 400, y: 540, face: 0 }); alone(g3, 'dale', 600, 540).crouch = true; step(g3, 3); assert.equal(a3.state, 'routine'); // 200 > 0.55 * 280
  const g4 = bare(); const a4 = guard(g4, { x: 400, y: 540, face: 0 }); alone(g4, 'dale', 400, 440); step(g4, 3); assert.equal(a4.state, 'routine'); // off to the side
  assert.ok(sightBlocked(newGame(0), 200, 100, 600, 100), 'wall between kitchen and hall');
}
// A distracted (busy) guard sees much less: you can walk up from the side.
{
  const g = bare(); const a = guard(g, { x: 400, y: 540, face: 0, busy: true, routine: [{ look: 0, t: 999, busy: true }] }); alone(g, 'dale', 520, 540).crouch = true;
  step(g, 2); assert.equal(a.state, 'routine', 'busy guard misses a crouching crew 120 away');
}
// Guard routines turn: after the look step the guard faces away and a crew member can creep up behind.
{
  const g = bare(); const a = guard(g, { x: 400, y: 540, face: 0, routine: [{ look: 0, t: 1 }, { look: 180, t: 5 }] }); const c = alone(g, 'dale', 600, 540); c.crouch = true;
  step(g, 3); assert.ok(Math.abs(Math.abs(a.face) - Math.PI) < 0.3, 'guard is now looking away');
}
// Stab from behind (or while he is distracted) is silent; from the front it wounds and alerts.
{
  const g = bare(); const a = guard(g, { x: 400, y: 540, face: 0 }); const b = guard(g, { x: 560, y: 540, face: 0 }); const c = alone(g, 'dale', 380, 540); c.crouch = true;
  assert.ok(act(g, 'stab')); assert.equal(a.ko, true); step(g, 0.5); assert.equal(b.state, 'routine');
  const g2 = bare(); const f = guard(g2, { x: 400, y: 540, face: 180 }); alone(g2, 'dale', 380, 540); act(g2, 'stab'); assert.equal(f.ko, false); assert.equal(f.state, 'alert');
}
// Doors block sight and open when walked into.
{
  const g = bare(); const d = g.doors[0]; const [rx, ry, rw, rh] = d.r; assert.equal(d.open, false);
  const c = alone(g, 'dale', rx + rw / 2, ry + rh + 30, -Math.PI / 2); step(g, 1.2, { mx: 0, my: -1 }); assert.equal(d.open, true);
}
// A bottle lures an unaware guard to investigate without raising the alarm.
{
  const g = bare(); const a = guard(g, { x: 560, y: 540, face: 0 }); const w = alone(g, 'walt', 300, 540, 0); w.bottles = 4; w.crouch = true;
  act(g, 'bottle'); assert.equal(a.state, 'investigate'); const x0 = a.x; step(g, 2); assert.notEqual(a.x, x0); assert.notEqual(a.state, 'alert');
}
// Silenced shots kill an unaware guard quietly; loud shots wake the neighbours.
{
  const g = bare(); const a = guard(g, { x: 560, y: 540, face: 180 }); const b = guard(g, { x: 560, y: 740, face: 180 }); alone(g, 'imani', 300, 540, 0).crouch = true;
  act(g, 'shoot'); assert.equal(a.ko, true); assert.equal(b.state, 'routine');
  const g2 = bare(); const a2 = guard(g2, { x: 560, y: 540, face: 180 }); const b2 = guard(g2, { x: 560, y: 700, face: 180 }); alone(g2, 'dale', 300, 540, 0);
  act(g2, 'shoot'); assert.equal(a2.ko, true); assert.equal(b2.state, 'investigate');
}
// Grenades roll, bounce, kill guards and hurt friends; blasting hostages fails the mission.
{
  const g = bare(); const a = guard(g, { x: 560, y: 540, face: 180 }); const c = alone(g, 'dale', 300, 540, 0); c.crouch = true;
  act(g, 'grenade'); step(g, 2); assert.equal(a.ko, true); assert.equal(c.hp, 3);
  const g2 = bare(); g2.hostages[0].x = 460; g2.hostages[0].y = 540; alone(g2, 'dale', 300, 540, 0); act(g2, 'grenade'); step(g2, 2); assert.equal(g2.over, 'hostage');
  const g3 = bare(); const e = alone(g3, 'dale', 300, 540, 0); g3.grenades.push({ x: 310, y: 540, vx: 0, vy: 0, fuse: 0.1 }); step(g3, 0.5); assert.equal(e.hp, 1);
  const g4 = newGame(0); g4.guards.length = 0; const h = alone(g4, 'dale', 700, 640, 0); g4.grenades.push({ x: 722, y: 100, vx: 0, vy: 0, fuse: 0.1 }); step(g4, 0.5); assert.equal(h.hp, 3, 'a wall shields from the blast');
}
// Interactions and winning.
{
  const g = newGame(0); g.guards.length = 0; const c = alone(g, 'dale', 1090, 640); step(g, 2, { use: true }); assert.equal(g.terminals[0].off, true);
  alone(g, 'dale', 1110, 190); step(g, 1.4, { use: true }); assert.equal(g.hostages[0].freed, true); assert.equal(g.over, 'win');
}
// Siphon loses the game; getting shot to death does too.
{
  const g = bare(); g.siphon = 99.9; step(g, 1); assert.equal(g.over, 'siphon');
  const g2 = bare(); guard(g2, { x: 500, y: 540, face: 0, state: 'alert' }); alone(g2, 'dale', 640, 540); step(g2, 60); assert.equal(g2.over, 'down');
}
// A guard who lost you comes looking, then returns to his post.
{
  const g = bare(); const a = guard(g, { x: 500, y: 540, face: 0 }); const c = alone(g, 'dale', 640, 540); step(g, 1.5);
  assert.equal(a.state, 'alert'); c.x = 40; c.y = 960; c.crouch = true; for (const o of g.crew) { o.x = 40; o.y = 960; } step(g, 40); assert.notEqual(a.state, 'alert');
}
// Vision polygon stops at walls.
{
  const g = newGame(0); const gd = g.guards.find((q) => q.id === 'g4'); gd.face = 0; const pts = visionPoly(g, gd);
  assert.ok(pts.every(([x]) => x < 440), 'kitchen guard cannot see through the hall wall');
}
// Fuzz: random inputs never throw or leave NaNs, on every level.
for (let li = 0; li < LEVELS.length; li++) {
  const g = newGame(li, 7); let s = 3;
  for (let i = 0; i < 4000 && !g.over; i++) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0; const r = s / 4294967296;
    if (r < 0.02) act(g, ['stab', 'shoot', 'grenade', 'bottle', 'switch', 'crouch'][Math.floor(r * 300) % 6]);
    update(g, 1 / 30, { mx: Math.cos(i / 40) * (r < 0.8 ? 1 : 0), my: Math.sin(i / 55) * (r < 0.8 ? 1 : 0), use: r > 0.5 });
    for (const c of g.crew) assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.hp));
    for (const q of g.guards) assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.face));
  }
}
console.log('action tests passed');
