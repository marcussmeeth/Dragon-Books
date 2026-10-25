// Shared character kit, lifted from Brew Empire (www/js/art.js). Big-headed SVG people with moods.
// Usage: charSVG(seed, { look }) returns an SVG <g>; toggle mood with class m-neutral|m-happy|m-angry|m-sleepy|m-worried.
const SKINS = ['#f6d3b3', '#eab98f', '#d29b6b', '#b27449', '#8a5533', '#5e3a22'];
const HAIRS = ['#2b1a12', '#4a2e1b', '#7b4a24', '#c98b3a', '#e3c27a', '#9a9a9a', '#b8452c', '#1d1d2b'];
const SHIRTS = ['#e0584b', '#4aa3a2', '#f2b84b', '#6c8ebf', '#8cc084', '#c47bb5', '#ef8a5b', '#5b6fd6', '#f4e3c3'];
const PANTS = ['#3f4a6b', '#5a4a3a', '#2e3a46', '#6b5a7a', '#495e49'];

export const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// ---------- chunky characters: big heads, soft shading, readable faces ----------
export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); const t = k < 0 ? 0 : 255; const f = Math.abs(k);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + (t - v) * f))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
let CHAR_UID = 0;
const HAIR_STYLES = [
  (c) => ({ back: '', front: `<path d="M-24 -56 C-26 -82 26 -82 24 -56 C14 -67 -14 -67 -24 -56z" fill="${c}"/>` }),
  (c) => ({ back: '', front: `<g fill="${c}"><circle cx="-15" cy="-72" r="13"/><circle cx="0" cy="-78" r="15"/><circle cx="15" cy="-72" r="13"/><path d="M-23 -58 C-20 -72 20 -72 23 -58 C12 -64 -12 -64 -23 -58z"/></g>` }),
  (c) => ({ back: '', front: `<g fill="${c}"><path d="M-24 -56 C-26 -82 26 -82 24 -56 C14 -67 -14 -67 -24 -56z"/><circle cx="0" cy="-84" r="10"/></g>` }),
  (c) => ({ back: `<path d="M-28 -50 C-32 -86 32 -86 28 -50 L28 -32 C28 -27 21 -27 21 -32 L21 -50 L-21 -50 L-21 -32 C-21 -27 -28 -27 -28 -32z" fill="${c}"/>`, front: `<path d="M-24 -56 C-14 -76 14 -76 24 -56 C10 -62 -10 -62 -24 -56z" fill="${c}"/>` }),
  (c) => ({ back: '', front: `<g fill="${c}">${Array.from({ length: 7 }, (_, i) => { const a = Math.PI + (i / 6) * Math.PI; return `<circle cx="${(Math.cos(a) * 21).toFixed(1)}" cy="${(-54 + Math.sin(a) * 21).toFixed(1)}" r="9"/>`; }).join('')}<circle cx="0" cy="-74" r="10"/></g>` }),
  (c) => ({ back: '', front: `<g fill="${c}"><circle cx="-23" cy="-56" r="6"/><circle cx="23" cy="-56" r="6"/></g>` }),
];
const BROW = {
  neutral: '<path d="M-14 -64 q5 -3 10 0 M4 -64 q5 -3 10 0" stroke="#4a2e1b" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  happy: '<path d="M-14 -66 q5 -5 10 0 M4 -66 q5 -5 10 0" stroke="#4a2e1b" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  angry: '<path d="M-15 -68 l11 5 M15 -68 l-11 5" stroke="#3a1c10" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
  worried: '<path d="M-15 -61 l11 -6 M15 -61 l-11 -6" stroke="#4a2e1b" stroke-width="2.8" fill="none" stroke-linecap="round"/>',
  sleepy: '<path d="M-14 -62 h10 M4 -62 h10" stroke="#4a2e1b" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
};
const SKILL_LOOK = {
  martial: '<path d="M-25 -66 C-12 -73 12 -73 25 -66 l0 7 C12 -66 -12 -66 -25 -59z" fill="#e0584b"/><path d="M24 -63 l17 5 l-14 4z M24 -63 l15 12 l-12 -4z" fill="#e0584b"/>',
  chef: '<g fill="#fff8ea"><rect x="-19" y="-88" width="38" height="16" rx="6"/><circle cx="-13" cy="-92" r="10"/><circle cx="0" cy="-97" r="12"/><circle cx="13" cy="-92" r="10"/><rect x="-22" y="-80" width="44" height="9" rx="4.5" fill="#efe4cc"/></g>',
  bruiser: '<path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#15121c"/>',
  fixer: '<path d="M-31 -66 h62 v4 h-62z" fill="#555"/><path d="M-17 -84 q17 -8 34 0 v18 h-34z" fill="#555"/><path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#15121c"/>',
  admin: '<g fill="none" stroke="#2b1a12" stroke-width="2"><circle cx="-9" cy="-53" r="6.4"/><circle cx="9" cy="-53" r="6.4"/><path d="M-2.6 -53 h5.2"/></g>',
  charmer: '<circle cx="14" cy="-72" r="5.5" fill="#ff7aa8"/><circle cx="14" cy="-72" r="2.2" fill="#ffd24a"/>',
  influencer: '',
};
const SKILL_BODY = {
  admin: '<path d="M0 -41 l-3 3 l3 24 l3 -24z" fill="#3b6fb0"/>',
  martial: '<rect x="-17" y="-24" width="34" height="6" rx="3" fill="#15121c"/><path d="M-3 -24 l-5 14 M3 -24 l5 14" stroke="#15121c" stroke-width="4" stroke-linecap="round"/>',
  chef: '<g fill="#cfc3a8"><circle cx="0" cy="-34" r="1.8"/><circle cx="0" cy="-27" r="1.8"/><circle cx="0" cy="-20" r="1.8"/></g>',
};
const dogSVG = () => `<g class="dog" transform="translate(-44 0)"><ellipse cx="0" cy="1" rx="19" ry="4.500" fill="#000" opacity=".16"/>
  <path class="tail" d="M-16 -17 q-12 -6 -9 -18" stroke="#d8934a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <rect x="-12" y="-14" width="7" height="14" rx="3.500" fill="#b87530"/><rect x="5" y="-14" width="7" height="14" rx="3.500" fill="#b87530"/>
  <ellipse cx="0" cy="-19" rx="19" ry="12" fill="#e0a25a"/><ellipse cx="-3" cy="-15" rx="10" ry="6" fill="#fff4dd"/>
  <circle cx="17" cy="-30" r="12" fill="#e0a25a"/><path d="M8 -42 l-5 12 l12 -3z" fill="#b87530"/><path d="M24 -42 l6 11 l-12 -2z" fill="#b87530"/>
  <ellipse cx="23" cy="-26" rx="6.500" ry="5" fill="#fff4dd"/><circle cx="26" cy="-28" r="2.200" fill="#2b1a12"/><circle cx="14" cy="-32" r="2.200" fill="#2b1a12"/><circle cx="13.400" cy="-32.800" r=".8" fill="#fff"/>
  <path d="M22 -21 q3 8 6 0z" fill="#ff7a8a"/></g>`;


const P_GLASSES = '<g fill="none" stroke="#2b1a12" stroke-width="2"><circle cx="-9" cy="-53" r="6.400"/><circle cx="9" cy="-53" r="6.400"/><path d="M-2.600 -53 h5.200"/></g>';
const P_SHADES = '<path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#15121c"/><path d="M-14 -55 l5 0" stroke="#fff" stroke-width="1.600" opacity=".6"/>';
const PRESETS = {
  pip: { skin: '#e9b98a', hair: '#c9c9c9', hs: 5, top: '#8a5a38', pants: '#3b3a46', face: P_GLASSES,
    body: '<path d="M0 -41 l-8 -5 v10z M0 -41 l8 -5 v10z" fill="#e0584b"/><circle cx="0" cy="-41" r="2.600" fill="#b6392d"/>',
    hand: '<g transform="translate(6 -4) rotate(12)"><rect x="-8" y="-12" width="16" height="22" rx="2.500" fill="#d9b27a"/><rect x="-5.500" y="-9" width="11" height="16" rx="1.500" fill="#fff"/><path d="M-3 -4 h6 M-3 0 h6 M-3 4 h4" stroke="#999" stroke-width="1.200"/></g>' },
  tina: { hideHair: true, skin: '#8a5533', hair: '#2b1a12', hs: 1, top: '#f2b84b', pants: '#6b8f5a',
    hat: '<g><ellipse cx="0" cy="-72" rx="38" ry="10" fill="#f4d08a"/><path d="M-22 -72 C-22 -92 22 -92 22 -72z" fill="#f0c36a"/><path d="M-22 -73 h44" stroke="#e0584b" stroke-width="5"/></g>',
    hand: '<g transform="translate(-14 -4)"><rect x="-13" y="-8" width="26" height="16" rx="4" fill="#3a3f4a"/><circle cx="0" cy="0" r="6" fill="#222"/><circle cx="0" cy="0" r="3.600" fill="#7fb8d8"/></g>' },
  rosie: { skin: '#f3c08f', hair: '#e8c27a', hs: 1, top: '#fff1f6', pants: '#2a2a33', face: P_SHADES,
    body: '<path d="M-18 -42 q18 12 36 0 l0 8 q-18 10 -36 0z" fill="#c47bb5"/><path d="M9 -36 l4 18 l-9 1z" fill="#b068a3"/>',
    hand: '<g transform="translate(2 -3)"><path d="M-6 -8 h12 l-2 15 h-8z" fill="#fff"/><rect x="-7" y="-11" width="14" height="4" rx="2" fill="#3b2418"/></g>' },
  dex: { skin: '#b9794b', hair: '#1d1d2b', hs: 4, top: '#6c8ebf', pants: '#3d4660',
    body: '<path d="M-14 -42 q14 10 28 0 q-3 -4 -14 -4 q-11 0 -14 4z" fill="#4e6fa0"/><rect x="-9" y="-22" width="18" height="9" rx="4" fill="#4e6fa0" opacity=".7"/>',
    hand: '<g transform="translate(2 -6) rotate(8)"><rect x="-5" y="-9" width="10" height="17" rx="2.500" fill="#222"/><rect x="-3.600" y="-7" width="7.200" height="12" rx="1.200" fill="#8fd0ff"/></g>' },
  jo: { skin: '#f3c08f', hair: '#b8452c', hs: 2, top: '#ef8a5b', pants: '#2e3a46',
    hat: '<path d="M-25 -66 C-12 -73 12 -73 25 -66 l0 6 C12 -66 -12 -60 -25 -60z" fill="#fff8ea"/>' },
};

export function charSVG(seed, opts = {}) {
  const r = rng(seed); const id = 'k' + CHAR_UID++;
  const P = opts.look || (opts.preset ? PRESETS[opts.preset] : null); const thug = !!opts.thug;
  const skin = P ? P.skin : pick(r, SKINS); const hair = P ? P.hair : pick(r, HAIRS);
  const top = P ? P.top : thug ? '#23232f' : (opts.shirt || pick(r, SHIRTS)); const pants = P ? P.pants : thug ? '#15151d' : pick(r, PANTS);
  const hs = P ? P.hs : Math.floor(r() * HAIR_STYLES.length); const accent = pick(r, SHIRTS);
  const sx = (thug ? 1.04 : 0.86) + r() * 0.2; const sy = 0.94 + r() * 0.12;
  const plain = !opts.apron && !thug && !opts.skill && !P;
  const hatKind = plain && r() < 0.2 ? (r() < 0.5 ? 'beanie' : 'cap') : '';
  const glasses = r() < 0.2 && !P; const scarf = plain && r() < 0.14; const pack = plain && r() < 0.22; const dog = plain && r() < 0.13;
  const h = HAIR_STYLES[hs](hair);
  const skinL = shade(skin, 0.3); const skinD = shade(skin, -0.2); const topL = shade(top, 0.28); const topD = shade(top, -0.22);
  const hat = hatKind === 'beanie'
    ? `<path d="M-25 -62 C-22 -86 22 -86 25 -62 C12 -68 -12 -68 -25 -62z" fill="${accent}"/><rect x="-26" y="-67" width="52" height="8" rx="4" fill="${shade(accent, -0.15)}"/><circle cx="0" cy="-84" r="6" fill="${shade(accent, 0.3)}"/>`
    : hatKind === 'cap' ? `<path d="M-25 -62 C-22 -86 22 -86 25 -62 z" fill="${accent}"/><path d="M-4 -63 q22 -4 34 6 l-1 5 q-16 -8 -33 -2z" fill="${shade(accent, -0.2)}"/>` : '';
  const thugLook = thug ? '<path d="M-31 -66 h62 v4 h-62z" fill="#111"/><path d="M-17 -84 q17 -8 34 0 v18 h-34z" fill="#111"/><rect x="-17" y="-72" width="34" height="5" fill="#7a1f1f"/><path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#000"/>' : '';
  const skillLook = thug ? thugLook : (opts.skill ? (SKILL_LOOK[opts.skill] || '') : '');
  const glassesSvg = glasses && opts.skill !== 'admin' && !thug ? SKILL_LOOK.admin : '';
  const apron = opts.apron ? '<path d="M-11 -37 h22 v26 q-11 5 -22 0z" fill="#fff8ea" opacity=".96"/><path d="M-11 -37 q11 6 22 0" fill="none" stroke="#e8d9bd" stroke-width="2"/>' : '';
  const bodyExtra = thug ? '<path d="M0 -43 l-3 4 l3 28 l3 -28z" fill="#7a1f1f"/>' : (SKILL_BODY[opts.skill] || '');
  const scarfSvg = scarf ? `<path d="M-18 -42 q18 12 36 0 l0 8 q-18 10 -36 0z" fill="${accent}"/><path d="M9 -36 l4 18 l-9 1z" fill="${shade(accent, -0.15)}"/>` : '';
  const packSvg = pack ? `<rect x="-24" y="-40" width="14" height="24" rx="6" fill="${accent}"/>` : '';
  const phone = opts.skill === 'influencer' ? '<g transform="translate(26 -26) rotate(8)"><rect x="-5" y="-9" width="10" height="17" rx="2.5" fill="#222"/><rect x="-3.600" y="-7" width="7.200" height="12" rx="1.200" fill="#8fd0ff"/></g>' : '';
  return `<g class="char m-neutral" transform="scale(${(sx * 0.86).toFixed(2)} ${(sy * 0.86).toFixed(2)})">
    <defs><radialGradient id="${id}h" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="${skinL}"/><stop offset=".65" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></radialGradient>
    <radialGradient id="${id}b" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="${topL}"/><stop offset="1" stop-color="${topD}"/></radialGradient></defs>
    <ellipse cx="0" cy="1" rx="22" ry="5.500" fill="#000" opacity=".2"/>
    ${dog ? dogSVG() : ''}
    <g class="bob"><g class="rig">
      ${packSvg}
      <g class="legL"><rect x="-12" y="-14" width="10" height="13" rx="5" fill="${pants}"/><ellipse cx="-8" cy="-2" rx="9" ry="5" fill="#4a3228"/><ellipse cx="-10" cy="-4" rx="3" ry="1.600" fill="#fff" opacity=".25"/></g>
      <g class="legR"><rect x="2" y="-14" width="10" height="13" rx="5" fill="${pants}"/><ellipse cx="8" cy="-2" rx="9" ry="5" fill="#4a3228"/><ellipse cx="6" cy="-4" rx="3" ry="1.600" fill="#fff" opacity=".25"/></g>
      <path d="M-18 -12 C-24 -28 -15 -43 0 -43 C15 -43 24 -28 18 -12 C9 -7 -9 -7 -18 -12z" fill="url(#${id}b)"/>
      <ellipse cx="-6" cy="-30" rx="6" ry="9" fill="#fff" opacity=".12"/>
      ${apron}${bodyExtra}${scarfSvg}${P && P.body ? P.body : ''}
      <g class="armL"><rect x="-27" y="-41" width="11" height="22" rx="5.500" fill="${top}"/><circle cx="-21.500" cy="-19" r="6" fill="${skin}"/></g>
      <g class="armR"><rect x="16" y="-41" width="11" height="22" rx="5.500" fill="${top}"/><circle cx="21.500" cy="-19" r="6" fill="${skin}"/>${P && P.hand ? P.hand : ''}</g>
      <g class="head">
        ${h.back}
        <circle cx="-24" cy="-53" r="5.500" fill="${skin}"/><circle cx="24" cy="-53" r="5.500" fill="${skin}"/>
        <circle cx="0" cy="-54" r="25" fill="url(#${id}h)"/>
        <circle class="tint" cx="0" cy="-54" r="25" fill="#ff3a1a" opacity=".24"/>
        ${hatKind || (P && P.hideHair) ? '' : h.front}
        <g class="eyes"><ellipse cx="-9" cy="-53" rx="4" ry="5.200" fill="#2b1a12"/><ellipse cx="9" cy="-53" rx="4" ry="5.200" fill="#2b1a12"/><circle cx="-7.600" cy="-55.200" r="1.700" fill="#fff"/><circle cx="10.400" cy="-55.200" r="1.700" fill="#fff"/><circle cx="-10" cy="-51" r=".8" fill="#fff" opacity=".8"/><circle cx="8" cy="-51" r=".8" fill="#fff" opacity=".8"/></g>
        <g class="eyes-closed"><path d="M-14 -53 q5 4 10 0 M4 -53 q5 4 10 0" stroke="#2b1a12" stroke-width="2.600" fill="none" stroke-linecap="round"/></g>
        <g class="brow neutral">${BROW.neutral}</g><g class="brow happy">${BROW.happy}</g><g class="brow angry">${BROW.angry}</g><g class="brow sleepy">${BROW.sleepy}</g><g class="brow worried">${BROW.worried}</g>
        <ellipse cx="-15" cy="-45" rx="5" ry="3.200" fill="#ff7a7a" opacity=".38"/><ellipse cx="15" cy="-45" rx="5" ry="3.200" fill="#ff7a7a" opacity=".38"/>
        <g class="mouth neutral"><path d="M-5 -43 q5 4 10 0" stroke="#7a3b2b" stroke-width="2.400" fill="none" stroke-linecap="round"/></g>
        <g class="mouth happy"><path d="M-9 -46 q9 14 18 0z" fill="#8a2b2b"/><path d="M-5 -41 q5 4 10 0" fill="#ff8a8a"/></g>
        <g class="mouth angry"><path d="M-6 -39 q6 -6 12 0" stroke="#7a3b2b" stroke-width="2.800" fill="none" stroke-linecap="round"/></g>
        <g class="mouth worried"><path d="M-6 -39 q6 -4 12 0 q-2 3 -6 1 q-4 2 -6 -1z" fill="none" stroke="#7a3b2b" stroke-width="2.4" stroke-linecap="round"/></g>
        <g class="sweat"><path d="M27 -66 q-5 8 0 11 q5 -3 0 -11z" fill="#8fd0ff"/></g>
        <g class="mouth sleepy"><ellipse cx="0" cy="-41" rx="4.400" ry="5.400" fill="#8a2b2b"/></g>
        ${glassesSvg}${P && P.face ? P.face : ''}
        <g class="zzz"><text x="22" y="-76" font-size="15" font-family="Fredoka, sans-serif" font-weight="700" fill="#6a7fd6">z</text><text x="30" y="-86" font-size="11" font-family="Fredoka, sans-serif" font-weight="700" fill="#6a7fd6">z</text></g>
        ${hat}${skillLook}${P && P.hat ? P.hat : ''}
      </g>
      ${phone}
      <g class="held" transform="translate(25 -22) scale(.62)"></g>
    </g></g></g>`;
}
