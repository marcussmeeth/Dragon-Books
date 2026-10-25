import { charSVG } from '../../shared/chars.js';
import { LEVELS, CREW, CREW_ORDER, TEXT, TYCOON, K } from './data.js';
import { newGame, update, act, activeCrew, sirenRate, level, objectivesLeft } from './engine.js';

const $ = (id) => document.getElementById(id);
const VW = innerWidth < 560 ? 420 : 640, ROW = 170, SCALE = 1.45;
const top = (r) => 12 + r * ROW; const FY = (r) => top(r) + 152;
const NS = 'http://www.w3.org/2000/svg';
let g, L, svg, world, ents = {}, camX = 0, paused = true, last = 0, hudT = 0;
const input = { left: false, right: false, up: false, down: false, use: false };

const el = (tag, attrs = {}, parent = world) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const person = (inner, parent) => { const e = el('g', {}, parent); e.innerHTML = inner; return e; };
const setMood = (e, mood) => { const c = e.querySelector('.char'); if (c) { const cls = `char m-${mood}`; if (c.getAttribute('class') !== cls) c.setAttribute('class', cls); } };

function build() {
  const H = L.floors.length * ROW + 24;
  $('board').innerHTML = `<svg viewBox="0 0 ${VW} ${H}" role="img" aria-label="${L.name}"><rect width="${VW}" height="${H}" fill="${L.theme.bg}"/><g id="world"></g></svg>`;
  svg = $('board').firstChild; world = svg.querySelector('#world'); ents = { doors: [], guards: {}, crew: {}, hostages: {}, things: {} };
  L.floors.forEach((f, r) => f.segs.forEach(([x0, x1]) => {
    el('rect', { x: x0, y: top(r), width: x1 - x0, height: 150, rx: 6, fill: L.theme.wall });
    el('rect', { x: x0, y: top(r) + 142, width: x1 - x0, height: 22, fill: L.theme.floor });
  }));
  for (const rm of L.rooms) { const t = el('text', { x: rm.x + 12, y: top(rm.f) + 20, fill: '#4b4338', 'font-size': 13, 'font-weight': 700, opacity: 0.8 }); t.textContent = rm.name; }
  for (const s of L.stairs) for (const [r, sym] of [[s.a, '▼'], [s.b, '▲']]) {
    el('rect', { x: s.x - 24, y: FY(r) - 76, width: 48, height: 76, rx: 6, fill: '#34405a', opacity: 0.9 });
    const t = el('text', { x: s.x, y: FY(r) - 30, 'text-anchor': 'middle', fill: '#fff', 'font-size': 20 }); t.textContent = sym;
  }
  g.doors.forEach((d) => { ents.doors.push(el('rect', { x: d.x - 5, y: top(d.f) + 34, width: 10, height: 112, rx: 3, fill: '#7a5a3a', stroke: '#2a1f14' })); });
  for (const t of g.terminals) ents.things[t.id] = Object.assign(el('text', { x: t.x, y: FY(t.f) - 36, 'text-anchor': 'middle', 'font-size': 30 }), { textContent: '💻' });
  for (const i of g.items) ents.things[i.id] = Object.assign(el('text', { x: i.x, y: FY(i.f) - 12, 'text-anchor': 'middle', 'font-size': 28 }), { textContent: i.icon });
  ents.cones = {}; g.guards.forEach((q) => { ents.cones[q.id] = el('polygon', { fill: '#ffd24a', opacity: 0.14 }); });
  if (L.tycoon) { const e = person(charSVG(777, { look: TYCOON }), world); e.setAttribute('transform', `translate(${L.tycoon.x} ${FY(L.tycoon.f)}) scale(${SCALE})`); setMood(e, 'worried'); }
  g.hostages.forEach((h, i) => { ents.hostages[h.id] = person(charSVG(900 + i, {}), world); setMood(ents.hostages[h.id], 'worried'); ents.hostages[h.id].setAttribute('transform', `translate(${h.x} ${FY(h.f)}) scale(${SCALE})`);
    ents.hostages[h.id].plea = Object.assign(el('text', { x: h.x, y: FY(h.f) - 100, 'text-anchor': 'middle', 'font-size': 20 }), { textContent: '🙏' }); });
  g.guards.forEach((q, i) => { ents.guards[q.id] = { g: person(charSVG(100 + i * 31, { thug: true }), world), mark: el('text', { 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 700, fill: '#fff' }) }; });
  g.crew.forEach((c) => { const d = CREW[c.id]; ents.crew[c.id] = { g: person(charSVG(c.id.length * 31, { look: d.look }), world), tag: el('text', { 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700, fill: d.color, stroke: '#000', 'stroke-width': 3, 'paint-order': 'stroke' }) };
    ents.crew[c.id].tag.textContent = d.name.split(' ')[0]; });
  ents.fx = el('g'); ents.bar = el('rect', { height: 6, rx: 3, fill: '#e8b64c', display: 'none' });
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (!paused && g) {
    update(g, dt, { move: (input.right ? 1 : 0) - (input.left ? 1 : 0), vert: input.up ? -1 : input.down ? 1 : 0, use: input.use });
    draw(dt);
    hudT -= dt; if (hudT <= 0) { hud(); hudT = 0.15; }
    for (const e of g.events.splice(0)) toast(e);
    if (g.over && !g.shown) { g.shown = true; paused = true; setTimeout(showEnd, 700); }
  }
  requestAnimationFrame(frame);
}

function draw(dt) {
  const c = activeCrew(g);
  const target = Math.max(0, Math.min(L.width - VW, c.x - VW / 2));
  camX += (target - camX) * Math.min(1, dt * 6); world.setAttribute('transform', `translate(${-camX.toFixed(1)} 0)`);
  g.doors.forEach((d, i) => { ents.doors[i].setAttribute('fill', d.open ? 'none' : '#7a5a3a'); ents.doors[i].setAttribute('opacity', d.open ? 0.35 : 1); });
  for (const t of g.terminals) ents.things[t.id].textContent = t.off ? '🔌' : '💻';
  for (const i of g.items) ents.things[i.id].setAttribute('display', i.got ? 'none' : 'inline');
  for (const h of g.hostages) { const e = ents.hostages[h.id]; e.setAttribute('display', h.freed ? 'none' : 'inline'); e.plea.setAttribute('display', h.freed ? 'none' : 'inline'); }
  const bob = (m, k) => (m ? -Math.abs(Math.sin(g.t * 10 + k)) * 3 : 0);
  g.crew.forEach((q, k) => {
    const e = ents.crew[q.id]; const y = FY(q.f) + bob(q.moving, k);
    e.g.setAttribute('transform', `translate(${q.x.toFixed(1)} ${y.toFixed(1)}) scale(${q.dir * SCALE} ${q.crouch ? SCALE * 0.8 : SCALE})${q.alive ? '' : ' rotate(80)'}`);
    setMood(e.g, !q.alive ? 'sleepy' : q.hp < 3 ? 'worried' : 'neutral');
    e.tag.setAttribute('x', q.x); e.tag.setAttribute('y', FY(q.f) + 15); e.tag.setAttribute('opacity', q.id === g.active ? 1 : 0.55);
  });
  g.guards.forEach((q, k) => {
    const e = ents.guards[q.id]; const cone = ents.cones[q.id];
    e.g.setAttribute('transform', `translate(${q.x.toFixed(1)} ${(FY(q.f) + bob(q.moving, k)).toFixed(1)}) scale(${q.dir * SCALE} ${SCALE})${q.ko ? ' rotate(80)' : ''}`);
    setMood(e.g, q.ko ? 'sleepy' : q.mode === 'alert' ? 'angry' : 'neutral');
    e.mark.setAttribute('x', q.x); e.mark.setAttribute('y', FY(q.f) - 112);
    e.mark.textContent = q.ko ? '' : q.mode === 'alert' ? '❗' : q.det > 0.3 ? '❓' : q.mode === 'investigate' ? '…' : '';
    if (q.ko) { cone.setAttribute('display', 'none'); return; }
    cone.setAttribute('display', 'inline');
    let r = K.VIS; for (const d of g.doors) if (d.f === q.f && !d.open && (d.x - q.x) * q.dir > 0) r = Math.min(r, Math.abs(d.x - q.x));
    const y = FY(q.f) - 52;
    cone.setAttribute('points', `${q.x},${y} ${q.x + q.dir * r},${y - 52} ${q.x + q.dir * r},${y + 48}`);
    cone.setAttribute('fill', q.mode === 'alert' ? '#ff3b2f' : q.det > 0.2 ? '#ff9a2f' : '#ffd24a'); cone.setAttribute('opacity', q.mode === 'alert' ? 0.22 : 0.12 + q.det * 0.2);
  });
  ents.fx.innerHTML = '';
  for (const gr of g.grenades) el('circle', { cx: gr.x, cy: FY(gr.f) - 8, r: 7, fill: Math.floor(gr.fuse * 6) % 2 ? '#3a6b3a' : '#e0584b', stroke: '#111', 'stroke-width': 2 }, ents.fx);
  for (const f of g.effects) {
    const y = FY(f.f) - 50; const p = f.t / 0.7;
    if (f.type === 'boom') { el('circle', { cx: f.x, cy: FY(f.f) - 20, r: K.BLAST * Math.min(1, p * 2.2), fill: '#ffb938', opacity: 1 - p }, ents.fx); el('circle', { cx: f.x, cy: FY(f.f) - 20, r: K.BLAST * 0.55 * Math.min(1, p * 2.2), fill: '#fff3c4', opacity: 1 - p }, ents.fx); }
    else if (f.type === 'shot') el('line', { x1: f.x, y1: y, x2: f.to, y2: y, stroke: f.friendly ? '#ffe9a8' : '#ff6a5a', 'stroke-width': 3, opacity: 1 - p * 1.4 }, ents.fx);
    else if (f.type === 'stab') { const t = el('text', { x: f.x, y: y - 10, 'text-anchor': 'middle', 'font-size': 30, opacity: 1 - p }, ents.fx); t.textContent = '💥'; }
    else if (f.type === 'hit') { el('circle', { cx: f.x, cy: y, r: 10 + p * 24, fill: 'none', stroke: '#ff3b2f', 'stroke-width': 4, opacity: 1 - p }, ents.fx); }
    else if (f.type === 'clink') { el('circle', { cx: f.x, cy: FY(f.f) - 6, r: 6 + p * 40, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 1 - p }, ents.fx); }
  }
  const u = g.use; ents.bar.setAttribute('display', u.target ? 'inline' : 'none');
  if (u.target) { ents.bar.setAttribute('x', u.target.x - 30); ents.bar.setAttribute('y', FY(u.target.f) - 112); ents.bar.setAttribute('width', 60 * Math.min(1, u.prog)); }
}

function hud() {
  $('lname').textContent = `${L.name} · ${L.place}`;
  $('siphon').style.width = g.siphon + '%'; $('spct').textContent = `${Math.floor(g.siphon)}% (+${sirenRate(g).toFixed(1)}/s)`;
  $('crew').innerHTML = g.crew.map((c) => { const d = CREW[c.id];
    const kit = [d.gun ? `🔫${c.ammo}` : '', `💣${c.gren}`, c.bottles || d.bottles ? `🍾${c.bottles}` : ''].filter(Boolean).join(' ');
    return `<button class="chip${c.id === g.active ? ' sel' : ''}${c.alive ? '' : ' dead'}" data-id="${c.id}"><b>${d.name.split(' ')[0]}</b> ${'♥'.repeat(c.hp)}<small>${kit}${c.crouch ? ' · sneaking' : ''}</small></button>`; }).join('');
  $('crew').querySelectorAll('.chip').forEach((b) => { b.onclick = () => { while (g.active !== b.dataset.id && g.crew.find((c) => c.id === b.dataset.id).alive) act(g, 'switch'); }; });
  const c = activeCrew(g);
  $('bBottle').classList.toggle('empty', !c.bottles); $('bCrouch').classList.toggle('on', c.crouch);
  document.querySelector('[data-a=shoot]').classList.toggle('empty', !CREW[c.id].gun || c.ammo <= 0);
  document.querySelector('[data-a=grenade]').classList.toggle('empty', c.gren <= 0);
  const goals = [...g.hostages.map((h) => [h.freed, `Free ${h.name}`]), ...g.items.map((i) => [i.got, `Take ${i.name}`]), ...g.terminals.map((t) => [t.off, `Pull the plug on ${t.name}`])];
  $('goals').innerHTML = goals.map(([d, t]) => `<li class="${d ? 'done' : ''}">${t}</li>`).join('');
}

function toast(e) {
  const t = document.createElement('div'); t.className = `toast ${e.kind}`; t.textContent = e.text; $('toasts').appendChild(t);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => t.remove(), 2600);
}

function modal(html, buttons) {
  paused = true; $('card').innerHTML = html + `<div class="row">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div>`;
  $('modal').classList.remove('hidden');
  $('card').querySelectorAll('button').forEach((b) => { b.onclick = () => { $('modal').classList.add('hidden'); paused = false; buttons[b.dataset.i][1](); }; });
}

function showEnd() {
  const last = g.level === LEVELS.length - 1;
  if (g.over === 'win') modal(`<h1>Mission complete 🎉</h1><p>${L.name} cleared in ${Math.round(g.t)} seconds with ${Math.floor(g.siphon)}% of the data lost.</p><p>${TEXT.win[last ? 1 : 0]}</p>`,
    last ? [['Play again', () => start(0)]] : [['Next mission ▶', () => start(g.level + 1)], ['Replay', () => start(g.level)]]);
  else modal(`<h1>Mission failed</h1><p>${TEXT[g.over]}</p>`, [['Try again', () => start(g.level)]]);
}

function start(i) {
  g = newGame(i, Date.now() & 0xffff); L = level(g); camX = 0; Object.keys(input).forEach((k) => { input[k] = false; });
  build(); hud(); draw(0);
  modal(`<h1>${L.name}</h1><p><i>${L.place}</i></p><p>${L.brief}</p>
    <ul><li>Yellow cones are what guards can see. Crouch (🥷) to shrink them, and stay out of the front of them.</li>
    <li>Creep up behind a guard and <b>stab</b> for a silent takedown. From the front it's noisy.</li>
    <li>Guns are loud (Imani's is silenced). A <b>bottle</b> lures guards. <b>Grenades</b> roll along the floor, and hurt your own crew too.</li>
    <li>On a phone, turn it sideways for a bigger view.</li>
    <li>Closed doors block sight. Walk into one to open it. Hold <b>use</b> beside people and machines.</li></ul>`, [['Go in', () => {}]]);
}

const KEYS = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', e: 'use' };
const ACTS = { j: 'stab', k: 'shoot', l: 'grenade', b: 'bottle', c: 'crouch', q: 'switch', shift: 'crouch' };
addEventListener('keydown', (ev) => { const k = ev.key.toLowerCase(); if (KEYS[k]) { input[KEYS[k]] = true; ev.preventDefault(); } else if (ACTS[k] && !ev.repeat && !paused) { act(g, ACTS[k]); ev.preventDefault(); } else if (k === 'tab' && !paused) { act(g, 'switch'); ev.preventDefault(); } });
addEventListener('keyup', (ev) => { const k = KEYS[ev.key.toLowerCase()]; if (k) input[k] = false; });
document.querySelectorAll('.hold').forEach((b) => {
  const on = (v) => (ev) => { ev.preventDefault(); input[b.dataset.k] = v; b.classList.toggle('down', v); };
  b.addEventListener('pointerdown', on(true)); ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, on(false)));
});
document.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (!paused) act(g, b.dataset.a); }));
addEventListener('blur', () => Object.keys(input).forEach((k) => { input[k] = false; }));
start(Math.min(LEVELS.length - 1, Math.max(0, Number(new URLSearchParams(location.search).get('level')) || 0)));
requestAnimationFrame(frame);
