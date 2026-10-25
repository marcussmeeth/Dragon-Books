// Pure game logic (no DOM) so it runs in the browser and in Node tests.
import { START, SUSPECTS, ORDER, EVIDENCE, TEXT, ENDINGS } from './data.js';

export function newGame() {
  const sus = {};
  for (const id of ORDER) sus[id] = { composure: SUSPECTS[id].composure, mood: SUSPECTS[id].start, confessed: false, cracked: false };
  return {
    turns: START.turns, tension: 0, sus, over: null,
    evidence: ['photo', 'diary'],
    notes: ['Wren Alder, 19, roaster. Dead at the foot of the warehouse stairs. Five people at this table have something to answer for.'],
  };
}

export const clock = (g) => {
  const m = START.clockStart + (START.turns - g.turns) * START.minutesPerTurn;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};
export const confessedCount = (g) => ORDER.filter((id) => g.sus[id].confessed).length;
export const tone = (g, id) => (g.sus[id].composure > 65 ? 'sturdy' : g.sus[id].composure > 30 ? 'wobbling' : 'ready to break');

function spend(g, tension) {
  g.turns -= 1;
  g.tension = Math.max(0, Math.min(100, g.tension + tension));
}

function finish(g) {
  if (g.over) return;
  if (g.tension >= 100) g.over = 'door';
  else if (g.turns <= 0 || confessedCount(g) === ORDER.length) {
    const n = confessedCount(g);
    g.over = n === ORDER.length ? 'reckoning' : n >= 3 ? 'cracks' : 'closed';
  }
}

function confess(g, id, out) {
  const s = SUSPECTS[id]; const st = g.sus[id];
  st.confessed = true; st.mood = 'sleepy'; st.composure = 0;
  g.notes.push(s.note);
  if (s.gives && !g.evidence.includes(s.gives)) { g.evidence.push(s.gives); out.gained = s.gives; }
  for (const o of ORDER) if (!g.sus[o].confessed) g.sus[o].composure = Math.max(5, g.sus[o].composure - 8);
  out.line = s.confess; out.confessed = true; out.chain = TEXT.chain;
}

// action: { type: 'press' | 'gentle' | 'show', who, item }
export function act(g, a) {
  if (g.over) return null;
  const s = SUSPECTS[a.who]; const st = g.sus[a.who];
  const out = { who: a.who, line: '', mood: st.mood };
  if (st.confessed) { out.line = s.after; return out; } // free: no turn spent
  let tension = 0;
  if (a.type === 'press' || a.type === 'gentle') {
    const good = s.soft === a.type;
    st.composure = Math.max(5, st.composure - (good ? 20 : 5));
    tension = a.type === 'press' ? (good ? 10 : 20) : (good ? -10 : 0);
    st.mood = good ? 'worried' : a.type === 'press' ? 'angry' : 'happy';
    out.line = good ? s[`${a.type}_good`] : s[`${a.type}_bad`];
    out.good = good;
  } else if (a.type === 'show') {
    if (!g.evidence.includes(a.item)) return null;
    if (s.keys.includes(a.item)) {
      st.composure = Math.max(0, st.composure - 35);
      if (st.composure <= 30) confess(g, a.who, out);
      else { st.cracked = true; st.mood = 'worried'; out.line = s.near; out.near = true; tension = 5; }
    } else {
      st.composure = Math.min(100, st.composure + 5); st.mood = 'happy'; tension = 8;
      out.line = (s.wrongBy && s.wrongBy[a.item]) || s.wrong; out.wrong = true;
    }
  } else return null;
  out.mood = st.mood;
  spend(g, tension);
  finish(g);
  return out;
}

export function ending(g) { return g.over ? { id: g.over, ...ENDINGS[g.over], confessed: confessedCount(g), turnsLeft: g.turns } : null; }
export { EVIDENCE };
