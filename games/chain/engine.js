// Pure game logic (no DOM). A level is a graph of rooms; crew act with 2 AP, then guards move.
import { LEVELS, CREW, CREW_ORDER, AP, SPOTTED_SIPHON } from './data.js';

export function newGame(levelIdx = 0) {
  const L = LEVELS[levelIdx];
  return {
    level: levelIdx, round: 1, siphon: 0, over: null, log: [`Round 1. ${L.brief}`],
    crew: CREW_ORDER.map((id) => ({ id, room: L.start, ap: AP, hp: CREW[id].hp, down: false })),
    guards: L.guards.map((x) => ({ id: x.id, room: x.room, route: x.route || null, ri: 0, dir: 1, mode: x.route ? 'patrol' : 'idle', out: false, distracted: 0 })),
    hostages: L.hostages.map((h) => ({ ...h, freed: false })),
    items: L.items.map((i) => ({ ...i, got: false })),
    terminals: L.terminals.map((t) => ({ ...t, off: false })),
  };
}

export const level = (g) => LEVELS[g.level];
export const neighbors = (g, room) => level(g).links.filter((l) => l[0] === room || l[1] === room).map((l) => (l[0] === room ? l[1] : l[0]));
export function dist(g, a, b) {
  if (a === b) return 0;
  const seen = new Set([a]); let frontier = [a]; let d = 0;
  while (frontier.length) {
    d++; const next = [];
    for (const r of frontier) for (const n of neighbors(g, r)) { if (seen.has(n)) continue; if (n === b) return d; seen.add(n); next.push(n); }
    frontier = next;
  }
  return Infinity;
}
function stepToward(g, from, to) {
  return neighbors(g, from).slice().sort((a, b) => dist(g, a, to) - dist(g, b, to))[0] || from;
}

export const sirenRate = (g) => g.terminals.filter((t) => !t.off).reduce((s, t) => s + t.rate, 0);
export const active = (gd) => !gd.out && gd.distracted === 0;
const standing = (g) => g.crew.filter((c) => !c.down);
export const crewIn = (g, room) => standing(g).filter((c) => c.room === room);
export const guardsIn = (g, room) => g.guards.filter((x) => x.room === room && !x.out);

// Guards are only seen within a crew member's vision (the scout sees further).
export function canSee(g, room) {
  return standing(g).some((c) => dist(g, c.room, room) <= CREW[c.id].vision);
}

export function options(g, crewId) {
  const c = g.crew.find((x) => x.id === crewId); const opts = [];
  if (!c || c.down || c.ap < 1 || g.over) return opts;
  for (const n of neighbors(g, c.room)) opts.push({ type: 'move', to: n });
  const gs = guardsIn(g, c.room);
  const anyActive = gs.some(active);
  if (crewId === 'dale') for (const x of gs) opts.push({ type: 'takedown', guard: x.id, label: '💪 Take down (loud)' });
  if (crewId === 'imani') for (const x of gs) if (x.mode !== 'alert') opts.push({ type: 'takedown', guard: x.id, label: '🤫 Silent takedown', silent: true });
  if (crewId === 'walt') for (const x of gs) if (x.mode !== 'alert' && x.distracted === 0) opts.push({ type: 'bluff', guard: x.id, label: '🗣️ Bluff the guard' });
  if (!anyActive) {
    for (const h of g.hostages) if (!h.freed && h.room === c.room) opts.push({ type: 'free', id: h.id, label: `🔓 Free ${h.name}` });
    for (const i of g.items) if (!i.got && i.room === c.room) opts.push({ type: 'grab', id: i.id, label: `${i.icon} Take ${i.name}` });
    for (const t of g.terminals) if (!t.off && t.room === c.room) opts.push({ type: 'plug', id: t.id, label: `🔌 Pull the plug: ${t.name}` });
  }
  return opts;
}

export function objectivesLeft(g) {
  return g.hostages.filter((h) => !h.freed).length + g.items.filter((i) => !i.got).length + g.terminals.filter((t) => !t.off).length;
}

// action: { crew, type, to | guard | id }
export function act(g, a) {
  const c = g.crew.find((x) => x.id === a.crew);
  const legal = options(g, a.crew).find((o) => o.type === a.type && (o.to === a.to) && (o.guard === a.guard) && (o.id === a.id));
  if (!legal) return false;
  const who = CREW[c.id].name.split(' ')[0]; c.ap -= 1;
  if (a.type === 'move') { c.room = a.to; g.log.push(`${who} moves to the ${level(g).rooms[a.to].name}.`); }
  else if (a.type === 'takedown') {
    const x = g.guards.find((q) => q.id === a.guard); x.out = true;
    if (legal.silent) g.log.push(`${who} takes a guard down without a sound.`);
    else {
      g.log.push(`${who} takes a guard down. The noise carries.`);
      for (const o of g.guards) if (!o.out && o !== x && dist(g, o.room, c.room) <= 1) { if (o.mode !== 'alert') g.log.push('A guard next door hears it and comes running.'); o.mode = 'alert'; }
    }
  } else if (a.type === 'bluff') { g.guards.find((q) => q.id === a.guard).distracted = 2; g.log.push(`${who} bluffs a guard into looking elsewhere for two rounds.`); }
  else if (a.type === 'free') { g.hostages.find((h) => h.id === a.id).freed = true; g.log.push(`${who} frees ${legal.label.slice(8)}.`); }
  else if (a.type === 'grab') { g.items.find((i) => i.id === a.id).got = true; g.log.push(`${who} secures the ${legal.label.slice(3)}.`); }
  else if (a.type === 'plug') { g.terminals.find((t) => t.id === a.id).off = true; g.log.push(`${who} pulls the plug. The siphon slows.`); }
  if (objectivesLeft(g) === 0) g.over = 'win';
  return true;
}

function spot(g, gd) { gd.mode = 'alert'; g.siphon = Math.min(100, g.siphon + SPOTTED_SIPHON); g.log.push('A guard spots the crew and radios it in.'); }

export function endRound(g) {
  if (g.over) return;
  g.log.push('— Guards move —');
  for (const gd of g.guards) {
    if (gd.out) continue;
    if (gd.distracted > 0) { gd.distracted--; continue; }
    const here = crewIn(g, gd.room);
    if (gd.mode === 'alert') {
      if (here.length) {
        const t = here.slice().sort((a, b) => a.hp - b.hp)[0]; t.hp -= 1;
        g.log.push(`A guard hits ${CREW[t.id].name.split(' ')[0]} (${Math.max(0, t.hp)} HP left).`);
        if (t.hp <= 0) t.down = true;
      } else {
        const tgt = standing(g).slice().sort((a, b) => dist(g, gd.room, a.room) - dist(g, gd.room, b.room))[0];
        if (tgt) gd.room = stepToward(g, gd.room, tgt.room);
      }
    } else {
      if (here.length) { spot(g, gd); continue; }
      if (gd.route) {
        gd.ri += gd.dir; if (gd.ri < 0 || gd.ri >= gd.route.length) { gd.dir = -gd.dir; gd.ri += 2 * gd.dir; }
        gd.room = gd.route[gd.ri];
        if (crewIn(g, gd.room).length) spot(g, gd);
      }
    }
  }
  g.siphon = Math.min(100, g.siphon + sirenRate(g));
  if (g.crew.some((c) => c.down)) g.over = 'down';
  else if (g.siphon >= 100) g.over = 'siphon';
  g.round += 1;
  for (const c of g.crew) c.ap = AP;
  if (!g.over) g.log.push(`Round ${g.round}.`);
}
