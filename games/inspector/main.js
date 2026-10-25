import { charSVG } from '../../shared/chars.js';
import { SUSPECTS, ORDER, INSPECTOR, EVIDENCE, TEXT, START } from './data.js';
import { newGame, act, ending, clock, confessedCount, tone } from './engine.js';

const $ = (id) => document.getElementById(id);
const SHORT = { teddy: 'Teddy', alistair: 'Sir Alistair', marguerite: 'Lady Marguerite', clara: 'Clara', rupert: 'Rupert' };
let g = newGame(); let sel = null; let seed = 7;

function sceneSVG() {
  const place = (id, x, s) => `<g class="hot" data-id="${id}" transform="translate(${x} 452) scale(1.7)">
      <ellipse class="ring" cx="0" cy="-48" rx="38" ry="52" fill="none" stroke="#e8b64c" stroke-width="3" stroke-dasharray="5 4"/>
      <g class="slot" data-char="${id}">${charSVG(seed++, { look: s.look })}</g></g>
    <text class="nameplate" x="${x}" y="488">${SHORT[id]}</text>`;
  const candles = [290, 590].map((x) => `<g transform="translate(${x} 424)"><rect x="-3" y="-30" width="6" height="30" fill="#f4ead2"/><path class="flame" d="M0 -48 q7 10 0 18 q-7 -8 0 -18z" fill="#ffb938"/></g>`).join('');
  return `<svg viewBox="0 0 960 500" role="img" aria-label="Dining room with five diners">
    <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b2a3a"/><stop offset="1" stop-color="#7a3a48"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs>
    <rect width="960" height="500" fill="url(#wall)"/>
    <g opacity=".18" stroke="#000">${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 64} 0 v330"/>`).join('')}</g>
    <rect y="380" width="960" height="120" fill="#4a2f22"/>
    <rect x="70" y="40" width="130" height="190" rx="10" fill="#10172a" stroke="#c89a4a" stroke-width="8"/>
    <g fill="#fff" opacity=".7"><circle cx="110" cy="80" r="1.6"/><circle cx="160" cy="110" r="1.6"/><circle cx="130" cy="170" r="1.6"/></g>
    <path d="M70 40 q35 70 0 190 M200 40 q-35 70 0 190" stroke="#8c2a3c" stroke-width="22" fill="none" opacity=".85"/>
    <g transform="translate(760 120)"><circle r="56" fill="#f4ead2" stroke="#c89a4a" stroke-width="8"/>
      <g id="hands" stroke="#2a2118" stroke-width="5" stroke-linecap="round"><path id="hh" d="M0 0 L0 -26"/><path id="mh" d="M0 0 L0 -40" stroke-width="3.500"/></g><circle r="4" fill="#2a2118"/></g>
    <rect x="320" y="60" width="150" height="100" rx="6" fill="#2b1f33" stroke="#c89a4a" stroke-width="6"/><path d="M335 140 l40 -40 l30 25 l30 -35 l20 30 v30 h-120z" fill="#3d6a58" opacity=".7"/>
    <ellipse cx="480" cy="430" rx="560" ry="130" fill="url(#glow)" opacity=".6"/>
    ${ORDER.map((id) => place(id, SUSPECTS[id].x, SUSPECTS[id])).join('')}
    <rect x="130" y="416" width="810" height="34" rx="6" fill="#f4ead2"/>
    <rect x="130" y="450" width="810" height="50" fill="#e9dcc0"/><path d="M130 450 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 60 0 q30 22 40 0" fill="#e9dcc0"/>
    ${candles}
    <g fill="#fff"><ellipse cx="250" cy="432" rx="26" ry="6"/><ellipse cx="420" cy="432" rx="26" ry="6"/><ellipse cx="540" cy="432" rx="26" ry="6"/><ellipse cx="690" cy="432" rx="26" ry="6"/><ellipse cx="840" cy="432" rx="26" ry="6"/></g>
    <g transform="translate(70 478) scale(1.8)">${charSVG(99, { look: INSPECTOR.look })}</g>
    <rect id="dusk" width="960" height="500" fill="#0a0614" opacity="0" pointer-events="none"/>
  </svg>`;
}

function setMood(id, mood) {
  const c = $('scene').querySelector(`[data-char="${id}"] .char`);
  if (!c) return;
  c.setAttribute('class', `char m-${mood}`);
  c.classList.add(mood === 'angry' ? 'shake' : 'hop');
  setTimeout(() => c.classList.remove('shake', 'hop'), 900);
}

function setClockFace() {
  const used = START.turns - g.turns; const mins = START.clockStart + used * START.minutesPerTurn;
  const h = (mins / 60) % 12, m = mins % 60;
  $('hh').setAttribute('transform', `rotate(${h * 30 + m * 0.5})`);
  $('mh').setAttribute('transform', `rotate(${m * 6})`);
  $('dusk').setAttribute('opacity', (used / START.turns * 0.45).toFixed(2));
}

function hud() {
  $('clock').textContent = clock(g); $('turns').textContent = g.turns; $('tension').style.width = g.tension + '%';
  $('notes').innerHTML = g.notes.map((n) => `<li>${n}</li>`).join('');
  $('items').innerHTML = g.evidence.map((e) => `<li><b>${EVIDENCE[e].icon} ${EVIDENCE[e].name}</b><br>${EVIDENCE[e].text}</li>`).join('');
  setClockFace();
}

function say(who, text, extra = '') {
  $('speech').innerHTML = `<span class="who">${who}</span>${extra}<p>${text}</p>`;
}

function select(id) {
  sel = id;
  $('scene').querySelectorAll('.hot').forEach((h) => h.classList.toggle('sel', h.dataset.id === id));
  $('evid').classList.add('hidden');
  const s = SUSPECTS[id]; const st = g.sus[id];
  say(`${s.name} · ${s.role}`, st.confessed ? s.after : (st.cracked ? s.near : s.intro), st.confessed ? '<span class="tag">confessed</span>' : `<span class="tag">${tone(g, id)}</span>`);
  renderActions();
}

function renderActions() {
  const a = $('actions'); a.innerHTML = '';
  if (g.over || !sel || g.sus[sel].confessed) return;
  const mk = (label, cls, fn) => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = fn; a.appendChild(b); };
  mk('😠 Lean on them', '', () => go({ type: 'press', who: sel }));
  mk('🤝 Be gentle', 'alt', () => go({ type: 'gentle', who: sel }));
  mk('📎 Show evidence…', 'ghost', () => {
    const e = $('evid'); e.classList.toggle('hidden');
    e.innerHTML = g.evidence.map((id) => `<button class="ghost" data-i="${id}">${EVIDENCE[id].icon} ${EVIDENCE[id].name}</button>`).join('');
    e.querySelectorAll('button').forEach((b) => { b.onclick = () => go({ type: 'show', who: sel, item: b.dataset.i }); });
  });
}

function go(action) {
  const r = act(g, action); if (!r) return;
  $('evid').classList.add('hidden');
  setMood(r.who, r.mood);
  const s = SUSPECTS[r.who];
  let extra = r.confessed ? '<span class="tag">confessed</span>' : `<span class="tag">${tone(g, r.who)}</span>`;
  say(s.name, r.line + (r.chain ? `<br><i>${r.chain}</i>` : '') + (r.gained ? `<br><b>New evidence: ${EVIDENCE[r.gained].icon} ${EVIDENCE[r.gained].name}</b>` : ''), extra);
  if (r.confessed) ORDER.forEach((o) => { if (!g.sus[o].confessed && o !== r.who) setMood(o, g.sus[o].mood === 'happy' ? 'neutral' : g.sus[o].mood); });
  hud(); renderActions();
  const end = ending(g);
  if (end) setTimeout(() => showEnding(end), 1400);
}

function modal(html, btn, fn) {
  $('card').innerHTML = html + `<button id="mbtn">${btn}</button>`;
  $('modal').classList.remove('hidden'); $('mbtn').onclick = () => { $('modal').classList.add('hidden'); fn && fn(); };
}

function showEnding(end) {
  const stars = '★'.repeat(end.stars) + '☆'.repeat(3 - end.stars);
  modal(`<h1>${end.title}</h1><p>${stars} · ${end.confessed} of 5 confessed · ${end.turnsLeft} questions to spare</p>${end.text.map((t) => `<p>${t}</p>`).join('')}`, 'Play again', start);
}

function start() {
  g = newGame(); sel = null; seed = 7;
  $('scene').innerHTML = sceneSVG();
  ORDER.forEach((id) => setMood(id, g.sus[id].mood));
  $('scene').querySelectorAll('.hot').forEach((h) => { h.onclick = () => !g.over && select(h.dataset.id); });
  $('actions').innerHTML = ''; say('Inspector Quill', 'Tap a diner to begin.'); hud();
  modal(`<h1>The Last Course</h1>${TEXT.intro.map((t) => `<p>${t}</p>`).join('')}`, 'Take your seat');
}
start();
