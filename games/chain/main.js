import { charSVG } from '../../shared/chars.js';
import { LEVELS, CREW, CREW_ORDER, TEXT, TYCOON } from './data.js';
import { newGame, level, options, act, endRound, canSee, guardsIn, crewIn, objectivesLeft, sirenRate } from './engine.js';

const $ = (id) => document.getElementById(id);
const CW = 190, CH = 170, GAP = 16;
let g, sel = 'dale', seedBase = 40;

const thug = (n) => charSVG(100 + n * 7, { thug: true });
const civ = (n) => charSVG(500 + n * 13, {});

function boardSVG() {
  const L = level(g); const W = L.cols * (CW + GAP) + GAP; const H = L.rows * (CH + GAP + 14) + GAP;
  const pos = (id) => ({ x: GAP + L.rooms[id].c * (CW + GAP), y: GAP + L.rooms[id].r * (CH + GAP + 14) });
  const c = options(g, sel).filter((o) => o.type === 'move').map((o) => o.to);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L.name}"><rect width="${W}" height="${H}" fill="${L.theme.bg}"/>`;
  for (const [id, r] of Object.entries(L.rooms)) {
    const { x, y } = pos(id); const seen = canSee(g, id); const go = c.includes(id);
    s += `<g class="room${go ? ' go' : ''}" data-room="${id}" opacity="${seen ? 1 : 0.6}">
      <rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="10" fill="${L.theme.wall}"/><rect x="${x}" y="${y + CH - 22}" width="${CW}" height="22" fill="${L.theme.floor}"/>
      <text class="rname" x="${x + 10}" y="${y + 20}">${r.name}</text>
      <rect class="go-ring" x="${x + 3}" y="${y + 3}" width="${CW - 6}" height="${CH - 6}" rx="9" fill="none" stroke="#e8b64c" stroke-width="4" stroke-dasharray="10 8"/>`;
    const here = [];
    for (const t of g.terminals) if (t.room === id) here.push({ kind: 'term', t });
    for (const i of g.items) if (i.room === id && !i.got) here.push({ kind: 'item', i });
    for (const h of g.hostages) if (h.room === id && !h.freed) here.push({ kind: 'host', h });
    if (L.tycoon === id) here.push({ kind: 'tycoon' });
    for (const k of crewIn(g, id)) here.push({ kind: 'crew', k });
    if (seen) for (const gd of g.guards.filter((q) => q.room === id)) here.push({ kind: 'guard', gd });
    for (const k of g.crew.filter((q) => q.room === id && q.down)) here.push({ kind: 'crew', k });
    const people = here.filter((h) => h.kind !== 'term' && h.kind !== 'item');
    const n = people.length;
    people.forEach((p, i) => {
      const px = x + CW * ((i + 1) / (n + 1)); const py = y + CH - 8; const sc = n > 3 ? 0.95 : 1.15;
      if (p.kind === 'crew') {
        const k = p.k; const def = CREW[k.id]; const mood = k.down ? 'sleepy' : k.hp < 3 ? 'worried' : 'happy';
        s += `<g transform="translate(${px} ${py}) scale(${sc})${k.down ? ' rotate(80)' : ''}">${charSVG(k.id.length * 31, { look: def.look }).replace('class="char m-neutral"', `class="char m-${mood}"`)}</g>
          <rect x="${px - 20}" y="${py + 2}" width="40" height="15" rx="7" fill="${def.color}"/><text class="tag" x="${px}" y="${py + 14}">${def.letter} ${'♥'.repeat(Math.max(0, k.hp))}</text>`;
        if (k.id === sel && !k.down) s += `<ellipse cx="${px}" cy="${py - 40}" rx="30" ry="46" fill="none" stroke="#e8b64c" stroke-width="3" stroke-dasharray="5 4"/>`;
      } else if (p.kind === 'guard') {
        const gd = p.gd; const mood = gd.out ? 'sleepy' : gd.mode === 'alert' ? 'angry' : 'neutral';
        s += `<g transform="translate(${px} ${py}) scale(${sc})${gd.out ? ' rotate(80)' : ''}">${charSVG(100 + gd.id.charCodeAt(1) * 7, { thug: true }).replace('class="char m-neutral"', `class="char m-${mood}"`)}</g>`;
        if (gd.distracted > 0) s += `<text x="${px}" y="${py - 96}" text-anchor="middle" font-size="20">💬</text>`;
        else if (!gd.out && gd.mode === 'alert') s += `<text x="${px}" y="${py - 96}" text-anchor="middle" font-size="22">❗</text>`;
      } else if (p.kind === 'host') {
        s += `<g transform="translate(${px} ${py}) scale(${sc})">${charSVG(900 + i, {}).replace('class="char m-neutral"', 'class="char m-worried"')}</g><text x="${px}" y="${py - 96}" text-anchor="middle" font-size="18">🙏</text>`;
      } else if (p.kind === 'tycoon') {
        s += `<g transform="translate(${px} ${py}) scale(${sc})">${charSVG(777, { look: TYCOON }).replace('class="char m-neutral"', 'class="char m-worried"')}</g>`;
      }
    });
    here.filter((h) => h.kind === 'term' || h.kind === 'item').forEach((o, i) => {
      const ox = x + CW - 24 - i * 30; const oy = y + 42;
      if (o.kind === 'term') s += `<text x="${ox}" y="${oy}" text-anchor="middle" font-size="26" opacity="${o.t.off ? 0.35 : 1}">${o.t.off ? '🔌' : '💻'}</text>`;
      else s += `<text x="${ox}" y="${oy}" text-anchor="middle" font-size="26">${o.i.icon}</text>`;
    });
    s += '</g>';
  }
  for (const [a, b, kind] of L.links) {
    const A = pos(a), B = pos(b); const ra = L.rooms[a], rb = L.rooms[b];
    if (ra.r === rb.r) { const x = Math.min(A.x, B.x) + CW + GAP / 2; s += `<rect x="${x - 7}" y="${A.y + CH - 70}" width="14" height="48" rx="3" fill="#7a5a3a" stroke="#2a1f14"/>`; }
    else { const x = A.x + CW / 2; const y = Math.min(A.y, B.y) + CH + (GAP + 14) / 2; s += `<rect x="${x - 22}" y="${y - 11}" width="44" height="22" rx="6" fill="#34405a"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="#fff" font-size="15">${kind === 'stairs' ? '↕ stairs' : '↕'}</text>`; }
  }
  return s + '</svg>';
}

function render() {
  const L = level(g);
  $('lname').textContent = `${L.name} · ${L.place}`;
  $('round').textContent = g.round; $('siphon').style.width = g.siphon + '%'; $('spct').textContent = `${g.siphon}% (+${sirenRate(g)}/round)`;
  $('board').innerHTML = boardSVG();
  $('board').querySelectorAll('.room.go').forEach((r) => { r.onclick = () => doAct({ crew: sel, type: 'move', to: r.dataset.room }); });
  $('crew').innerHTML = g.crew.map((k) => { const d = CREW[k.id];
    return `<button class="chip${k.id === sel ? ' sel' : ''}${k.ap === 0 && !k.down ? ' spent' : ''}${k.down ? ' down' : ''}" data-k="${k.id}"><b>${d.name}</b><small>${d.role} · ${'♥'.repeat(Math.max(0, k.hp))} · ${k.down ? 'DOWN' : k.ap + ' AP'}</small></button>`; }).join('');
  $('crew').querySelectorAll('.chip').forEach((b) => { b.onclick = () => { sel = b.dataset.k; render(); }; });
  const acts = $('actions'); acts.innerHTML = '';
  const o = options(g, sel).filter((x) => x.type !== 'move');
  if (!g.over) {
    const k = g.crew.find((c) => c.id === sel);
    if (k.ap > 0 && !k.down) { const p = document.createElement('p'); p.className = 'hint'; p.style.width = '100%'; p.textContent = `${CREW[sel].blurb} Tap a gold-outlined room to move.`; acts.appendChild(p); }
    for (const a of o) { const b = document.createElement('button'); b.textContent = a.label; b.onclick = () => doAct({ crew: sel, ...a }); acts.appendChild(b); }
  }
  const spent = g.crew.every((c) => c.down || c.ap === 0);
  $('end').classList.toggle('pulse', spent && !g.over);
  const goals = [...g.hostages.map((h) => [h.freed, `Free ${h.name}`]), ...g.items.map((i) => [i.got, `Take the ${i.name.toLowerCase()}`]), ...g.terminals.map((t) => [t.off, `Pull the plug: ${t.name}`])];
  $('goals').innerHTML = goals.map(([d, t]) => `<li class="${d ? 'done' : ''}">${t}</li>`).join('');
  $('log').innerHTML = g.log.slice(-12).reverse().map((l) => `<li>${l}</li>`).join('');
}

function next() { const k = g.crew.find((c) => c.ap > 0 && !c.down); if (k && g.crew.find((c) => c.id === sel).ap === 0) sel = k.id; }

function doAct(a) { if (g.over) return; if (!act(g, a)) return; next(); render(); check(); }
$('end').onclick = () => { if (g.over) return; endRound(g); next(); render(); check(); };

function modal(html, buttons) {
  $('card').innerHTML = html + `<div class="row">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div>`;
  $('modal').classList.remove('hidden');
  $('card').querySelectorAll('button').forEach((b) => { b.onclick = () => { $('modal').classList.add('hidden'); buttons[b.dataset.i][1](); }; });
}

function check() {
  if (!g.over) return;
  const last = g.level === LEVELS.length - 1;
  setTimeout(() => {
    if (g.over === 'win') {
      modal(`<h1>Mission complete 🎉</h1><p>${level(g).name} cleared in ${g.round - 1 + (g.crew.some((c) => c.ap < 2) ? 1 : 0)} rounds, ${g.siphon}% of the data lost.</p><p>${TEXT.win[last ? 1 : 0]}</p>`,
        last ? [['Play again', () => start(0)]] : [['Next mission ▶', () => start(g.level + 1)], ['Replay', () => start(g.level)]]);
    } else modal(`<h1>Mission failed</h1><p>${g.over === 'siphon' ? TEXT.siphon : TEXT.down}</p>`, [['Try again', () => start(g.level)]]);
  }, 700);
}

function start(i) {
  g = newGame(i); sel = 'dale'; render();
  const L = level(g);
  modal(`<h1>${L.name}</h1><p><i>${L.place}</i></p><p>${L.brief}</p><p>Three retired soldiers, two actions each per round. Guards patrol; spot you and they raise the alarm. Pull plugs fast: the siphon fills every round.</p>`, [['Go in', () => {}]]);
}
start(Math.min(LEVELS.length - 1, Math.max(0, Number(new URLSearchParams(location.search).get('level')) || 0)));
