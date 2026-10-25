// "Chain Reaction" (action): real-time 3/4 top-down stealth. Free movement on a floor plan; x runs right, y runs down.
// Crew: Dale (loud pistol, grenades), Imani (silenced pistol), Walt (distraction bottles). Cartoon violence only.
import { CREW_LOOKS, TYCOON_LOOK } from '../../shared/cast.js';

export const CREW_ORDER = ['dale', 'imani', 'walt'];
export const CREW = {
  dale: { name: 'Dale Brandt', role: 'Breacher', color: '#e0584b', look: CREW_LOOKS.dale, ammo: 8, gren: 3, bottles: 0, gun: 'loud',
    blurb: 'Loud pistol, three grenades. Hits hard, but everyone hears it.' },
  imani: { name: 'Imani Reyes', role: 'Scout', color: '#3fa7c4', look: CREW_LOOKS.imani, ammo: 7, gren: 1, bottles: 0, gun: 'quiet',
    blurb: 'Silenced pistol: a sneak shot kills quietly from range.' },
  walt: { name: 'Walt Hollis', role: 'Talker', color: '#e8b64c', look: CREW_LOOKS.walt, ammo: 0, gren: 1, bottles: 4, gun: null,
    blurb: 'Throws bottles to lure guards away. Knife and one grenade.' },
};
export const TYCOON = TYCOON_LOOK;

export const K = {
  HP: 3, GUARD_HP: 2, VIS: 280, FOV: 40, BUSY_FOV: 28, BUSY_RANGE: 0.45, CLOSE: 34, BUSY_CLOSE: 20, REACH: 30, GUN_RANGE: 400, GUARD_RANGE: 300,
  WALK: 105, CROUCH: 55, PATROL: 60, INVESTIGATE: 95, ALERT: 130, CREW_R: 9, GUARD_R: 8, CELL: 16,
  FUSE: 1.6, BLAST: 100, SPOTTED_SIPHON: 5, USE_R: 46,
};

// ---- floor-plan helpers: walls are [x, y, w, h] rects; gaps leave doorways ----
const T = 12;
const segs = (a, b, gaps) => { const out = []; let cur = a; for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) { if (g0 > cur) out.push([cur, g0]); cur = g1; } if (cur < b) out.push([cur, b]); return out; };
const H = (y, x0, x1, gaps = []) => segs(x0, x1, gaps).map(([a, b]) => [a, y - T / 2, b - a, T]);
const V = (x, y0, y1, gaps = []) => segs(y0, y1, gaps).map(([a, b]) => [x - T / 2, a, T, b - a]);
const DH = (y, g0, g1) => [g0, y - T / 2, g1 - g0, T];
const DV = (x, g0, g1) => [x - T / 2, g0, T, g1 - g0];
const box = (W, Hh) => [...H(T / 2, 0, W), ...H(Hh - T / 2, 0, W), ...V(T / 2, 0, Hh), ...V(W - T / 2, 0, Hh)];
// Guard routine: { go: [x, y] } walk there; { look: degrees, t: seconds, busy?: true } stand and look (busy = distracted).
// Degrees: 0 = east, 90 = south, 180 = west, 270 = north.
const watch = (...steps) => steps.map(([look, t, busy]) => ({ look, t, busy: !!busy }));

export const LEVELS = [
  {
    id: 'semi', name: 'The Semi', place: 'A suburban house', theme: { ground: '#2a2230', wall: '#6b5a48', top: '#8a7560' },
    brief: 'Mercenaries hold the Parkes family in their lounge, and a laptop in the study is feeding the household\'s data to a billionaire\'s AI. Free the family and pull the plug. Mind the grenades near the family.',
    w: 1200, h: 760, start: { x: 90, y: 660 },
    rooms: [{ x: 6, y: 6, w: 414, h: 300, c: '#e8dcc0', n: 'Kitchen' }, { x: 6, y: 306, w: 414, h: 448, c: '#d8d0b8', n: 'Utility' }, { x: 420, y: 6, w: 360, h: 748, c: '#cfc6a8', n: 'Hall' },
      { x: 780, y: 6, w: 414, h: 400, c: '#e2c9a8', n: 'Lounge' }, { x: 780, y: 406, w: 414, h: 348, c: '#c9d4c0', n: 'Study' }],
    walls: [...box(1200, 760), ...V(420, 6, 754, [[130, 200], [520, 590]]), ...V(780, 6, 754, [[130, 200], [520, 590]]), ...H(306, 6, 420, [[200, 264]]), ...H(406, 780, 1194)],
    doors: [DV(420, 130, 200), DV(420, 520, 590), DV(780, 130, 200), DV(780, 520, 590)],
    obstacles: [{ x: 20, y: 14, w: 380, h: 40, tall: true, c: '#b9a98a', n: 'Counters' }, { x: 140, y: 140, w: 130, h: 70, c: '#a87b4a', n: 'Table' }, { x: 20, y: 330, w: 60, h: 60, tall: true, c: '#cfd6dc', n: 'Washer' },
      { x: 300, y: 600, w: 70, h: 70, tall: true, c: '#a07a4a', n: 'Crates' }, { x: 180, y: 480, w: 110, h: 44, c: '#8f9a7a', n: 'Bench' },
      { x: 470, y: 300, w: 40, h: 110, c: '#a87b4a', n: 'Console' }, { x: 690, y: 90, w: 34, h: 34, tall: true, c: '#7a5a3a', n: 'Coats' }, { x: 540, y: 640, w: 90, h: 36, c: '#8f9a7a', n: 'Bench' },
      { x: 860, y: 260, w: 200, h: 56, c: '#b0506a', n: 'Sofa' }, { x: 1000, y: 16, w: 180, h: 36, tall: true, c: '#4a4a55', n: 'TV unit' },
      { x: 800, y: 420, w: 34, h: 80, tall: true, c: '#7a5a3a', n: 'Shelves' }, { x: 960, y: 600, w: 200, h: 44, c: '#a87b4a', n: 'Desk' }],
    guards: [{ id: 'g1', x: 1000, y: 120, face: 180, routine: watch([180, 3.5], [90, 5, true], [0, 2]) },
      { id: 'g2', x: 600, y: 80, face: 90, routine: [{ go: [600, 80] }, ...watch([90, 1.2]), { go: [600, 700] }, ...watch([270, 1.2])] },
      { id: 'g3', x: 900, y: 560, face: 90, routine: watch([90, 6, true], [0, 2], [270, 2]) },
      { id: 'g4', x: 220, y: 100, face: 270, routine: watch([270, 6, true], [90, 2.5], [0, 1.5]) }],
    hostages: [{ id: 'parkes', x: 1120, y: 170, name: 'the Parkes family' }],
    items: [],
    terminals: [{ id: 'laptop', x: 1060, y: 660, rate: 0.45, name: 'the family laptop' }],
  },
  {
    id: 'market', name: 'Market Street', place: 'A high street at dusk', theme: { ground: '#4a5260', wall: '#59606c', top: '#7a8290' },
    brief: 'A courier is locked in the flat above the market, half the plans are in a van, and a drone in the café office is copying everything. Free the courier, take the plans, pull the drone.',
    w: 1800, h: 1000, start: { x: 60, y: 940 },
    rooms: [{ x: 0, y: 0, w: 1800, h: 1000, c: '#6c7480', n: '' }, { x: 80, y: 40, w: 480, h: 360, c: '#d9c9a8', n: 'Flat' }, { x: 1250, y: 40, w: 470, h: 380, c: '#e0cfae', n: 'Café' }, { x: 1560, y: 40, w: 160, h: 380, c: '#cdd3c0', n: 'Office' }],
    walls: [...box(1800, 1000), ...H(40, 80, 560), ...V(80, 40, 400), ...V(560, 40, 400), ...H(400, 80, 560, [[290, 350]]),
      ...H(40, 1250, 1720), ...V(1250, 40, 420), ...V(1720, 40, 420), ...H(420, 1250, 1720, [[1430, 1490]]), ...V(1560, 40, 420, [[250, 310]])],
    doors: [DH(400, 290, 350), DH(420, 1430, 1490), DV(1560, 250, 310)],
    obstacles: [{ x: 700, y: 40, w: 400, h: 360, tall: true, c: '#8a7a6a', n: 'Market' }, { x: 100, y: 60, w: 120, h: 70, tall: true, c: '#a87b4a', n: 'Wardrobe' }, { x: 380, y: 60, w: 90, h: 60, c: '#b0506a', n: 'Bed' },
      { x: 1280, y: 60, w: 200, h: 50, tall: true, c: '#b9a98a', n: 'Counter' }, { x: 1340, y: 250, w: 60, h: 60, c: '#a87b4a', n: 'Table' }, { x: 1580, y: 60, w: 120, h: 40, tall: true, c: '#4a4a55', n: 'Racks' },
      { x: 820, y: 620, w: 160, h: 76, tall: true, c: '#e8e8ee', n: 'Van' }, { x: 300, y: 600, w: 80, h: 50, tall: true, c: '#3a6b4a', n: 'Dumpster' }, { x: 520, y: 760, w: 100, h: 50, tall: true, c: '#c0392b', n: 'Car' },
      { x: 1120, y: 740, w: 100, h: 50, tall: true, c: '#3b6fb0', n: 'Car' }, { x: 1480, y: 600, w: 80, h: 50, tall: true, c: '#a07a4a', n: 'Crates' }, { x: 640, y: 480, w: 60, h: 30, c: '#8f9a7a', n: 'Bench' }, { x: 1500, y: 860, w: 120, h: 50, tall: true, c: '#e0b040', n: 'Cab' }],
    guards: [{ id: 's1', x: 250, y: 520, face: 0, routine: [{ go: [250, 520] }, ...watch([0, 1.5]), { go: [650, 520] }, ...watch([180, 1.5])] },
      { id: 's2', x: 1000, y: 840, face: 0, routine: [{ go: [1000, 840] }, ...watch([0, 1.5]), { go: [1500, 800] }, ...watch([180, 1.5])] },
      { id: 's3', x: 900, y: 750, face: 90, routine: watch([90, 6, true], [0, 2], [180, 2]) },
      { id: 's4', x: 1150, y: 520, face: 0, routine: watch([0, 6, true], [90, 2.5]) }, { id: 's5', x: 1210, y: 520, face: 180, routine: watch([180, 6, true], [90, 2.5]) },
      { id: 's6', x: 420, y: 250, face: 90, routine: watch([90, 4], [0, 2, true], [180, 2]) },
      { id: 's7', x: 1360, y: 160, face: 90, routine: [{ go: [1360, 160] }, ...watch([90, 1.5]), { go: [1360, 340] }, ...watch([270, 1.5])] }],
    hostages: [{ id: 'courier', x: 300, y: 150, name: 'the courier' }],
    items: [{ id: 'plans', x: 900, y: 730, name: 'the plans', icon: '📁' }],
    terminals: [{ id: 'drone', x: 1640, y: 200, rate: 0.6, name: 'the spy drone' }],
  },
  {
    id: 'tower', name: 'Vantage Tower', place: 'An office floor at night', theme: { ground: '#141a26', wall: '#4a5668', top: '#6c7a90' },
    brief: 'The billionaire\'s command floor. Three machines are siphoning a rival lab\'s research and engineers are held in the annexe. Pull every plug and free the engineers before the data is gone.',
    w: 1600, h: 900, start: { x: 80, y: 820 },
    rooms: [{ x: 6, y: 6, w: 477, h: 388, c: '#d8c8b0', n: 'Exec office' }, { x: 6, y: 394, w: 477, h: 500, c: '#dfe6ee', n: 'Lobby' }, { x: 483, y: 6, w: 620, h: 888, c: '#e6ebf2', n: 'Open plan' },
      { x: 1103, y: 6, w: 491, h: 385, c: '#c9d3e0', n: 'Server room' }, { x: 1103, y: 391, w: 491, h: 252, c: '#d8c8b0', n: 'Boardroom' }, { x: 1103, y: 643, w: 491, h: 251, c: '#dfe6ee', n: 'Annexe' }],
    walls: [...box(1600, 900), ...V(483, 6, 894, [[100, 160], [620, 700]]), ...H(394, 6, 483), ...V(1103, 6, 894, [[300, 360], [470, 530], [740, 800]]), ...H(391, 1103, 1594), ...H(643, 1103, 1594)],
    doors: [DV(483, 100, 160), DV(483, 620, 700), DV(1103, 300, 360), DV(1103, 470, 530), DV(1103, 740, 800)],
    obstacles: [{ x: 60, y: 40, w: 160, h: 56, c: '#a87b4a', n: 'Desk' }, { x: 380, y: 200, w: 60, h: 160, tall: true, c: '#7a5a3a', n: 'Shelves' }, { x: 40, y: 480, w: 200, h: 50, tall: true, c: '#8a96a4', n: 'Reception' }, { x: 300, y: 760, w: 80, h: 80, c: '#3a6b4a', n: 'Plant' },
      { x: 560, y: 120, w: 150, h: 40, c: '#a0aab6', n: 'Desks' }, { x: 560, y: 260, w: 150, h: 40, c: '#a0aab6', n: 'Desks' }, { x: 800, y: 80, w: 20, h: 200, tall: true, c: '#8a96a4', n: 'Partition' }, { x: 900, y: 200, w: 150, h: 40, c: '#a0aab6', n: 'Desks' },
      { x: 560, y: 600, w: 150, h: 40, c: '#a0aab6', n: 'Desks' }, { x: 800, y: 440, w: 20, h: 220, tall: true, c: '#8a96a4', n: 'Partition' }, { x: 900, y: 620, w: 150, h: 40, c: '#a0aab6', n: 'Desks' }, { x: 560, y: 760, w: 60, h: 100, tall: true, c: '#7a5a3a', n: 'Cabinets' },
      { x: 1130, y: 30, w: 40, h: 200, tall: true, c: '#4a4a55', n: 'Server racks' }, { x: 1250, y: 30, w: 40, h: 200, tall: true, c: '#4a4a55', n: 'Server racks' }, { x: 1250, y: 440, w: 220, h: 60, c: '#7a5a3a', n: 'Table' },
      { x: 1500, y: 680, w: 70, h: 60, tall: true, c: '#a07a4a', n: 'Crates' }, { x: 1150, y: 830, w: 80, h: 40, c: '#a0aab6', n: 'Fridge' }],
    guards: [{ id: 't1', x: 240, y: 700, face: 0, routine: watch([0, 4], [90, 4, true], [180, 2]) },
      { id: 't2', x: 740, y: 80, face: 90, routine: [{ go: [740, 80] }, ...watch([90, 1.2]), { go: [740, 830] }, ...watch([270, 1.2])] },
      { id: 't3', x: 560, y: 480, face: 0, routine: [{ go: [560, 480] }, ...watch([0, 1.2]), { go: [1050, 480] }, ...watch([180, 1.2])] },
      { id: 't4', x: 1380, y: 200, face: 180, routine: watch([180, 4], [90, 5, true], [0, 2]) },
      { id: 't5', x: 1300, y: 560, face: 0, routine: watch([0, 6, true], [180, 2], [90, 2]) },
      { id: 't6', x: 1300, y: 780, face: 0, routine: watch([0, 4], [270, 4, true]) },
      { id: 't7', x: 250, y: 200, face: 90, routine: watch([90, 4], [0, 4, true]) }],
    hostages: [{ id: 'engineers', x: 1500, y: 780, name: 'the engineers' }],
    items: [],
    terminals: [{ id: 'core', x: 1450, y: 120, rate: 0.3, name: 'the server' }, { id: 'exec', x: 160, y: 130, rate: 0.35, name: 'the exec terminal' }, { id: 'ai', x: 1500, y: 540, rate: 0.3, name: 'the AI core' }],
    tycoon: { x: 1450, y: 470 },
  },
];

export const TEXT = {
  siphon: 'The progress bar hits 100%. Somewhere, a very smug AI has learned everything.',
  down: 'One of the three is down. The crew leaves nobody behind, and the mission is over.',
  hostage: 'The grenade went off beside the people you came to save. Mind where you roll them.',
  win: ['Everyone out, every plug pulled. The billionaires will have an awkward morning.', 'Walt puts the kettle on. Imani counts the spent shells. Dale asks who left the lights on.'],
};
