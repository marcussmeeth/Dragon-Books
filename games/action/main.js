import { charSVG, shade } from '../../shared/chars.js';
import { LEVELS, CREW, TEXT, TYCOON, K } from './data.js';
import { newGame, update, act, activeCrew, sirenRate, level, visionPoly } from './engine.js';

const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const VW = innerWidth < 560 ? 520 : 840, VH = innerWidth < 560 ? 520 : 540, SCALE = 0.95;
let g, L, world, ents, cam = { x: 0, y: 0 }, paused = true, last = 0, hudT = 0;
const input = { mx: 0, my: 0, use: false, keys: { left: false, right: false, up: false, down: false } };

const el = (tag, attrs = {}, parent = world) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const person = (inner, parent) => { const e = el('g', {}, parent); e.innerHTML = inner; return e; };
const setMood = (e, mood) => { const c = e.querySelector('.char'); if (c) { const cls = `char m-${mood}`; if (c.getAttribute('class') !== cls) c.setAttribute('class', cls); } };

// 3/4 view: every solid is a top face plus a darker front face below it.
function block([x, y, w, h], top, depth, parent = world) {
  el('rect', { x, y: y + depth, width: w, height: h, fill: shade(top, -0.35) }, parent);
  return el('rect', { x, y, width: w, height: h, fill: top }, parent);
}

function build() {
  $('board').innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${L.name}"><rect width="${VW}" height="${VH}" fill="${L.theme.ground}"/><g id="world"></g></svg>`;
  world = $('board').querySelector('#world'); ents = { doors: [], guards: {}, crew: {}, hostages: {}, things: {}, sort: [] };
  el('rect', { x: 0, y: 0, width: L.w, height: L.h, fill: L.theme.ground });
  for (const r of L.rooms) { el('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: r.c }); if (r.n) { const t = el('text', { x: r.x + 14, y: r.y + 28, fill: '#000', opacity: 0.22, 'font-size': 20, 'font-weight': 700 }); t.textContent = r.n; } }
  const under = el('g'); ents.cones = {}; g.guards.forEach((q) => { ents.cones[q.id] = el('polygon', { fill: '#ffd24a', opacity: 0.14 }, under); });
  g.walls.forEach((w) => block(w, L.theme.top, 8));
  L.obstacles.forEach((o) => { const r = block([o.x, o.y, o.w, o.h], o.c, o.tall ? 18 : 8); if (o.tall) el('rect', { x: o.x, y: o.y, width: o.w, height: 4, fill: '#fff', opacity: 0.25 }); });
  g.doors.forEach((d) => { ents.doors.push(el('rect', { x: d.r[0], y: d.r[1], width: d.r[2], height: d.r[3], fill: '#7a5a3a', stroke: '#2a1f14', 'stroke-width': 2 })); });
  for (const t of g.terminals) ents.things[t.id] = Object.assign(el('text', { x: t.x, y: t.y - 6, 'text-anchor': 'middle', 'font-size': 26 }), { textContent: '💻' });
  for (const i of g.items) ents.things[i.id] = Object.assign(el('text', { x: i.x, y: i.y - 4, 'text-anchor': 'middle', 'font-size': 24 }), { textContent: i.icon });
  const layer = el('g'); ents.layer = layer;
  const add = (e, y) => ents.sort.push({ e, y });
  if (L.tycoon) { const e = person(charSVG(777, { look: TYCOON }), layer); setMood(e, 'worried'); e.setAttribute('transform', `translate(${L.tycoon.x} ${L.tycoon.y}) scale(${SCALE})`); }
  g.hostages.forEach((h, i) => { const e = person(charSVG(900 + i, {}), layer); setMood(e, 'worried'); e.setAttribute('transform', `translate(${h.x} ${h.y}) scale(${SCALE})`); ents.hostages[h.id] = e;
    e.plea = Object.assign(el('text', { x: h.x, y: h.y - 74, 'text-anchor': 'middle', 'font-size': 18 }), { textContent: '🙏' }); });
  g.guards.forEach((q, i) => { ents.guards[q.id] = { g: person(charSVG(100 + i * 31, { thug: true }), layer), mark: el('text', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#fff' }) }; });
  g.crew.forEach((c) => { const d = CREW[c.id]; ents.crew[c.id] = { g: person(charSVG(c.id.length * 31, { look: d.look }), layer), ring: el('ellipse', { rx: 14, ry: 6, fill: 'none', stroke: d.color, 'stroke-width': 3 }), tag: el('text', { 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: d.color, stroke: '#000', 'stroke-width': 3, 'paint-order': 'stroke' }) };
    ents.crew[c.id].tag.textContent = d.name.split(' ')[0]; });
  ents.fx = el('g'); ents.bar = el('rect', { height: 6, rx: 3, fill: '#e8b64c', display: 'none' });
}

function readKeys() { const k = input.keys; return { mx: (k.right ? 1 : 0) - (k.left ? 1 : 0), my: (k.down ? 1 : 0) - (k.up ? 1 : 0) }; }

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  if (!paused && g) {
    const kv = readKeys(); const mv = Math.hypot(kv.mx, kv.my) > 0 ? kv : { mx: input.mx, my: input.my };
    update(g, dt, { mx: mv.mx, my: mv.my, use: input.use });
    draw(dt);
    hudT -= dt; if (hudT <= 0) { hud(); hudT = 0.15; }
    for (const e of g.events.splice(0)) toast(e);
    if (g.over && !g.shown) { g.shown = true; paused = true; setTimeout(showEnd, 700); }
  }
  requestAnimationFrame(frame);
}

function draw(dt) {
  const c = activeCrew(g);
  const tx = Math.max(0, Math.min(L.w - VW, c.x - VW / 2)), ty = Math.max(0, Math.min(L.h - VH, c.y - VH / 2 - 10));
  cam.x += (tx - cam.x) * Math.min(1, dt * 7); cam.y += (ty - cam.y) * Math.min(1, dt * 7); world.setAttribute('transform', `translate(${-cam.x.toFixed(1)} ${-cam.y.toFixed(1)})`);
  g.doors.forEach((d, i) => { ents.doors[i].setAttribute('fill', d.open ? 'none' : '#7a5a3a'); ents.doors[i].setAttribute('opacity', d.open ? 0.4 : 1); });
  for (const t of g.terminals) ents.things[t.id].textContent = t.off ? '🔌' : '💻';
  for (const i of g.items) ents.things[i.id].setAttribute('display', i.got ? 'none' : 'inline');
  for (const h of g.hostages) { const e = ents.hostages[h.id]; e.setAttribute('display', h.freed ? 'none' : 'inline'); e.plea.setAttribute('display', h.freed ? 'none' : 'inline'); }
  const bob = (m, k) => (m ? -Math.abs(Math.sin(g.t * 10 + k)) * 2.5 : 0);
  const place = (e, x, y, face, extra = '') => e.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(Math.cos(face) < -0.2 ? -SCALE : SCALE)} ${SCALE})${extra}`);
  const sorted = [];
  g.crew.forEach((q, k) => {
    const e = ents.crew[q.id]; place(e.g, q.x, q.y + bob(q.moving, k), q.aim, `${q.crouch ? ' scale(1 0.82)' : ''}${q.alive ? '' : ' rotate(80)'}`); setMood(e.g, !q.alive ? 'sleepy' : q.hp < 3 ? 'worried' : 'neutral');
    e.ring.setAttribute('cx', q.x); e.ring.setAttribute('cy', q.y + 2); e.ring.setAttribute('opacity', q.id === g.active ? 1 : 0);
    e.tag.setAttribute('x', q.x); e.tag.setAttribute('y', q.y + 20); e.tag.setAttribute('opacity', q.id === g.active ? 1 : 0.55); sorted.push([q.y, e.g]);
  });
  g.guards.forEach((q, k) => {
    const e = ents.guards[q.id]; const cone = ents.cones[q.id];
    place(e.g, q.x, q.y + bob(q.moving, k), q.face, q.ko ? ' rotate(80)' : ''); setMood(e.g, q.ko ? 'sleepy' : q.state === 'alert' ? 'angry' : 'neutral'); sorted.push([q.y, e.g]);
    e.mark.setAttribute('x', q.x); e.mark.setAttribute('y', q.y - 78);
    e.mark.textContent = q.ko ? '' : q.state === 'alert' ? '❗' : q.det > 0.3 ? '❓' : q.state === 'investigate' ? '…' : q.busy ? '💭' : '';
    if (q.ko) { cone.setAttribute('display', 'none'); return; }
    cone.setAttribute('display', 'inline'); cone.setAttribute('points', visionPoly(g, q).map((p) => p.map((v) => v.toFixed(0)).join(',')).join(' '));
    cone.setAttribute('fill', q.state === 'alert' ? '#ff3b2f' : q.det > 0.2 ? '#ff9a2f' : q.busy ? '#9ac8ff' : '#ffd24a'); cone.setAttribute('opacity', q.state === 'alert' ? 0.26 : 0.14 + q.det * 0.2);
  });
  sorted.sort((a, b) => a[0] - b[0]).forEach(([, node]) => ents.layer.appendChild(node));
  ents.fx.innerHTML = '';
  for (const gr of g.grenades) el('circle', { cx: gr.x, cy: gr.y - 4, r: 6, fill: Math.floor(gr.fuse * 6) % 2 ? '#3a6b3a' : '#e0584b', stroke: '#111', 'stroke-width': 2 }, ents.fx);
  for (const f of g.effects) {
    const p = f.t / 0.7;
    if (f.type === 'boom') { el('circle', { cx: f.x, cy: f.y, r: K.BLAST * Math.min(1, p * 2.2), fill: '#ffb938', opacity: 1 - p }, ents.fx); el('circle', { cx: f.x, cy: f.y, r: K.BLAST * 0.55 * Math.min(1, p * 2.2), fill: '#fff3c4', opacity: 1 - p }, ents.fx); }
    else if (f.type === 'shot') el('line', { x1: f.x, y1: f.y, x2: f.tx, y2: f.ty, stroke: f.friendly ? '#ffe9a8' : '#ff6a5a', 'stroke-width': 3, opacity: 1 - p * 1.4 }, ents.fx);
    else if (f.type === 'stab') { const t = el('text', { x: f.x, y: f.y, 'text-anchor': 'middle', 'font-size': 28, opacity: 1 - p }, ents.fx); t.textContent = '💥'; }
    else if (f.type === 'hit') el('circle', { cx: f.x, cy: f.y - 20, r: 10 + p * 24, fill: 'none', stroke: '#ff3b2f', 'stroke-width': 4, opacity: 1 - p }, ents.fx);
    else if (f.type === 'clink') el('circle', { cx: f.x, cy: f.y, r: 6 + p * 40, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 1 - p }, ents.fx);
  }
  const u = g.use; ents.bar.setAttribute('display', u.target ? 'inline' : 'none');
  if (u.target) { ents.bar.setAttribute('x', u.target.x - 30); ents.bar.setAttribute('y', u.target.y - 60); ents.bar.setAttribute('width', 60 * Math.min(1, u.prog)); }
}

function hud() {
  $('lname').textContent = `${L.name} · ${L.place}`;
  $('siphon').style.width = g.siphon + '%'; $('spct').textContent = `${Math.floor(g.siphon)}% (+${sirenRate(g).toFixed(1)}/s)`;
  $('crew').innerHTML = g.crew.map((c) => { const d = CREW[c.id];
    const kit = [d.gun ? `🔫${c.ammo}` : '', `💣${c.gren}`, c.bottles || d.bottles ? `🍾${c.bottles}` : ''].filter(Boolean).join(' ');
    return `<button class="chip${c.id === g.active ? ' sel' : ''}${c.alive ? '' : ' dead'}" data-id="${c.id}"><b>${d.name.split(' ')[0]}</b> ${'♥'.repeat(c.hp)}<small>${kit}${c.crouch ? ' · sneaking' : ''}</small></button>`; }).join('');
  $('crew').querySelectorAll('.chip').forEach((b) => { b.onclick = () => { let n = 0; while (g.active !== b.dataset.id && n++ < 3) act(g, 'switch'); }; });
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
  const lastL = g.level === LEVELS.length - 1;
  if (g.over === 'win') modal(`<h1>Mission complete 🎉</h1><p>${L.name} cleared in ${Math.round(g.t)} seconds with ${Math.floor(g.siphon)}% of the data lost.</p><p>${TEXT.win[lastL ? 1 : 0]}</p>`,
    lastL ? [['Play again', () => start(0)]] : [['Next mission ▶', () => start(g.level + 1)], ['Replay', () => start(g.level)]]);
  else modal(`<h1>Mission failed</h1><p>${TEXT[g.over]}</p>`, [['Try again', () => start(g.level)]]);
}

function start(i) {
  g = newGame(i, Date.now() & 0xffff); L = level(g); const c = activeCrew(g); cam = { x: Math.max(0, c.x - VW / 2), y: Math.max(0, c.y - VH / 2) }; input.mx = input.my = 0; input.use = false;
  build(); hud(); draw(0);
  modal(`<h1>${L.name}</h1><p><i>${L.place}</i></p><p>${L.brief}</p>
    <ul><li>Walk anywhere. <b>Yellow cones</b> show what each guard sees, and walls and cupboards block them. Blue cones (💭) mean he is distracted and sees much less.</li>
    <li>Wait for a guard to look away, then creep up behind (🥷 sneak) and <b>stab</b> for a silent takedown.</li>
    <li>Guns are loud (Imani's is silenced). A <b>bottle</b> pulls a guard to a spot. <b>Grenades</b> roll the way you face, bounce off walls, and hurt your own crew.</li>
    <li>Closed doors block sight. Walk into one to open it. Hold <b>use</b> beside people and machines. On a phone, turn it sideways.</li></ul>`, [['Go in', () => {}]]);
}

const KEYS = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down' };
const ACTS = { j: 'stab', k: 'shoot', l: 'grenade', b: 'bottle', c: 'crouch', q: 'switch', shift: 'crouch' };
addEventListener('keydown', (ev) => { const k = ev.key.toLowerCase(); if (KEYS[k]) { input.keys[KEYS[k]] = true; ev.preventDefault(); } else if (k === 'e') { input.use = true; } else if (ACTS[k] && !ev.repeat && !paused) { act(g, ACTS[k]); ev.preventDefault(); } else if (k === 'tab' && !paused) { act(g, 'switch'); ev.preventDefault(); } });
addEventListener('keyup', (ev) => { const k = ev.key.toLowerCase(); if (KEYS[k]) input.keys[KEYS[k]] = false; if (k === 'e') input.use = false; });
const stick = $('stick'), knob = $('knob'); let sid = null;
const stickMove = (ev) => { const r = stick.getBoundingClientRect(); let dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
  input.mx = Math.abs(dx) < 0.18 ? 0 : dx; input.my = Math.abs(dy) < 0.18 ? 0 : dy; knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`; };
const stickEnd = () => { sid = null; input.mx = input.my = 0; knob.style.transform = ''; };
stick.addEventListener('pointerdown', (ev) => { ev.preventDefault(); sid = ev.pointerId; stick.setPointerCapture(sid); stickMove(ev); });
stick.addEventListener('pointermove', (ev) => { if (ev.pointerId === sid) stickMove(ev); });
['pointerup', 'pointercancel'].forEach((n) => stick.addEventListener(n, stickEnd));
document.querySelectorAll('.hold').forEach((b) => { const on = (v) => (ev) => { ev.preventDefault(); input.use = v; b.classList.toggle('down', v); };
  b.addEventListener('pointerdown', on(true)); ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => b.addEventListener(n, on(false))); });
document.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); if (!paused) act(g, b.dataset.a); }));
addEventListener('blur', () => { stickEnd(); input.use = false; Object.keys(input.keys).forEach((k) => { input.keys[k] = false; }); });
start(Math.min(LEVELS.length - 1, Math.max(0, Number(new URLSearchParams(location.search).get('level')) || 0)));
requestAnimationFrame(frame);
