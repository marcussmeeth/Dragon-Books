import assert from 'node:assert/strict';
import { newGame, options, act, endRound, objectivesLeft } from '../games/chain/engine.js';
import { LEVELS } from '../games/chain/data.js';

// Data sanity: every link/room/guard/objective references a real room.
for (const L of LEVELS) {
  const ids = new Set(Object.keys(L.rooms));
  for (const [a, b] of L.links) assert.ok(ids.has(a) && ids.has(b), `${L.id} link ${a}-${b}`);
  for (const x of [...L.guards, ...L.hostages, ...L.items, ...L.terminals]) assert.ok(ids.has(x.room), `${L.id} ${x.id}`);
  for (const x of L.guards) for (const r of x.route || []) assert.ok(ids.has(r));
  assert.ok(ids.has(L.start));
}

// Rule checks on level 1.
{
  const g = newGame(0);
  assert.equal(options(g, 'dale').some((o) => o.type === 'plug'), false, 'no plug in kitchen');
  assert.ok(act(g, { crew: 'dale', type: 'move', to: 'hall' }));
  assert.ok(options(g, 'dale').some((o) => o.type === 'takedown'), 'patrol is in the hall');
  assert.equal(options(g, 'imani').some((o) => o.type === 'takedown'), false, 'imani is in the kitchen');
  assert.ok(act(g, { crew: 'dale', type: 'takedown', guard: 'g2' }));
  assert.equal(g.guards.find((x) => x.id === 'g2').out, true);
  assert.equal(act(g, { crew: 'dale', type: 'move', to: 'kitchen' }), false, 'out of AP after move + takedown');
}
// Alert guards hit, spotted raises siphon, silent takedowns refuse alert guards.
{
  const g = newGame(0);
  act(g, { crew: 'walt', type: 'move', to: 'hall' }); // meets the patrol
  endRound(g);
  assert.ok(g.siphon >= 10 + 5, 'spotted + laptop');
  const gd = g.guards.find((x) => x.id === 'g2'); assert.equal(gd.mode, 'alert');
  assert.equal(options(g, 'imani').some((o) => o.silent), false);
  endRound(g); assert.ok(g.crew.find((c) => c.id === 'walt').hp < 3);
}

// Random playouts: each level must be winnable (proves the design is solvable), and some runs must lose.
function rng(seed) { let a = seed; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function playout(levelIdx, seed) {
  const r = rng(seed); const g = newGame(levelIdx);
  for (let step = 0; step < 600 && !g.over; step++) {
    const acts = ['dale', 'imani', 'walt'].flatMap((c) => options(g, c).map((o) => ({ crew: c, ...o })));
    if (!acts.length || r() < 0.05) { endRound(g); continue; }
    const good = acts.filter((a) => a.type !== 'move');
    const pick = good.length && r() < 0.8 ? good[Math.floor(r() * good.length)] : acts[Math.floor(r() * acts.length)];
    act(g, pick);
  }
  return g;
}
LEVELS.forEach((L, i) => {
  let wins = 0; const N = 4000;
  for (let s = 1; s <= N; s++) if (playout(i, s).over === 'win') wins++;
  console.log(`${L.id}: ${wins}/${N} random playouts won`);
  assert.ok(wins > 0, `${L.id} must be winnable`);
  assert.ok(wins < N, `${L.id} must be possible to lose`);
});
console.log('chain tests passed');
