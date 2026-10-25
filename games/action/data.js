// "Chain Reaction" (action): real-time side-on stealth. Rows are floors (0 = top); x runs left to right.
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
  HP: 3, GUARD_HP: 2, VIS: 300, CLOSE: 42, REACH: 44, GUN_RANGE: 440, GUARD_RANGE: 360,
  WALK: 110, CROUCH: 55, PATROL: 55, INVESTIGATE: 95, ALERT: 130,
  FUSE: 1.6, BLAST: 125, SPOTTED_SIPHON: 5,
};

export const LEVELS = [
  {
    id: 'semi', name: 'The Semi', place: 'A suburban house', theme: { wall: '#ecd9b6', floor: '#9a7048', bg: '#2a2230' },
    brief: 'Mercenaries hold the Parkes family in their own lounge, and a laptop in the study is feeding their data to a billionaire\'s AI. Free the family and pull the plug. Mind the grenades near the family.',
    width: 1500, start: { x: 90, f: 1 },
    floors: [{ name: 'Upstairs', segs: [[0, 1500]] }, { name: 'Downstairs', segs: [[0, 1500]] }],
    rooms: [{ f: 0, x: 0, name: 'Bedroom' }, { f: 0, x: 500, name: 'Landing' }, { f: 0, x: 1000, name: 'Study' }, { f: 1, x: 0, name: 'Kitchen' }, { f: 1, x: 480, name: 'Hall' }, { f: 1, x: 980, name: 'Lounge' }],
    stairs: [{ x: 720, a: 0, b: 1 }],
    doors: [{ f: 0, x: 500 }, { f: 0, x: 1000 }, { f: 1, x: 480 }, { f: 1, x: 980 }],
    guards: [{ id: 'g1', f: 1, x: 1220, dir: -1 }, { id: 'g2', f: 1, x: 600, dir: 1, patrol: [560, 900] }, { id: 'g3', f: 0, x: 1150, dir: 1, patrol: [1080, 1280] }],
    hostages: [{ id: 'parkes', f: 1, x: 1390, name: 'the Parkes family' }],
    items: [],
    terminals: [{ id: 'laptop', f: 0, x: 1380, rate: 0.45, name: 'the family laptop' }],
  },
  {
    id: 'market', name: 'Market Street', place: 'A high street at dusk', theme: { wall: '#c9d3dc', floor: '#6c7480', bg: '#1d2430' },
    brief: 'A courier is locked in a flat above the market, half the plans are in a van, and a drone on the café roof is copying everything. Free the courier, take the plans, kill the drone.',
    width: 2400, start: { x: 60, f: 1 },
    floors: [{ name: 'Upper', segs: [[500, 1100], [1800, 2400]] }, { name: 'Street', segs: [[0, 2400]] }],
    rooms: [{ f: 0, x: 500, name: 'Flat' }, { f: 0, x: 1800, name: 'Roof' }, { f: 1, x: 0, name: 'Corner' }, { f: 1, x: 1010, name: 'Square' }, { f: 1, x: 1500, name: 'Van lot' }, { f: 1, x: 1960, name: 'Café' }],
    stairs: [{ x: 800, a: 0, b: 1 }, { x: 2200, a: 0, b: 1 }],
    doors: [{ f: 1, x: 1000 }, { f: 1, x: 1500 }, { f: 1, x: 1950 }],
    guards: [{ id: 's1', f: 1, x: 300, dir: 1, patrol: [220, 700] }, { id: 's2', f: 1, x: 1150, dir: 1, patrol: [1060, 1440] }, { id: 's3', f: 1, x: 1800, dir: -1 },
      { id: 's4', f: 1, x: 2100, dir: 1, patrol: [1990, 2350] }, { id: 's5', f: 0, x: 960, dir: -1 }, { id: 's6', f: 0, x: 1950, dir: 1, patrol: [1860, 2150] }],
    hostages: [{ id: 'courier', f: 0, x: 620, name: 'the courier' }],
    items: [{ id: 'plans', f: 1, x: 1750, name: 'the plans', icon: '📁' }],
    terminals: [{ id: 'drone', f: 0, x: 2330, rate: 0.6, name: 'the spy drone' }],
  },
  {
    id: 'tower', name: 'Vantage Tower', place: 'An office block at night', theme: { wall: '#dfe6ee', floor: '#7a8794', bg: '#141a26' },
    brief: 'The billionaire\'s command floors. Three machines are siphoning a rival lab\'s research and engineers are held in the lobby annexe. Pull every plug and free the engineers before the data is gone.',
    width: 1800, start: { x: 90, f: 2 },
    floors: [{ name: 'Executive', segs: [[0, 1800]] }, { name: 'Open plan', segs: [[0, 1800]] }, { name: 'Lobby', segs: [[0, 1800]] }],
    rooms: [{ f: 0, x: 0, name: 'Exec office' }, { f: 0, x: 600, name: 'Corridor' }, { f: 0, x: 1200, name: 'Boardroom' }, { f: 1, x: 0, name: 'Open plan' }, { f: 1, x: 900, name: 'Server room' }, { f: 2, x: 0, name: 'Lobby' }, { f: 2, x: 700, name: 'Atrium' }, { f: 2, x: 1300, name: 'Annexe' }],
    stairs: [{ x: 300, a: 1, b: 2 }, { x: 1500, a: 0, b: 1 }],
    doors: [{ f: 0, x: 600 }, { f: 0, x: 1200 }, { f: 1, x: 900 }, { f: 2, x: 700 }, { f: 2, x: 1300 }],
    guards: [{ id: 't1', f: 2, x: 800, dir: 1, patrol: [760, 1240] }, { id: 't2', f: 2, x: 1550, dir: -1 }, { id: 't3', f: 1, x: 400, dir: 1, patrol: [120, 840] },
      { id: 't4', f: 1, x: 1300, dir: -1 }, { id: 't5', f: 0, x: 800, dir: 1, patrol: [660, 1140] }, { id: 't6', f: 0, x: 1450, dir: -1 }],
    hostages: [{ id: 'engineers', f: 2, x: 1680, name: 'the engineers' }],
    items: [],
    terminals: [{ id: 'core', f: 1, x: 1650, rate: 0.3, name: 'the server' }, { id: 'exec', f: 0, x: 200, rate: 0.35, name: 'the exec terminal' }, { id: 'ai', f: 0, x: 1720, rate: 0.3, name: 'the AI core' }],
    tycoon: { f: 0, x: 1600 },
  },
];

export const TEXT = {
  siphon: 'The progress bar hits 100%. Somewhere, a very smug AI has learned everything.',
  down: 'One of the three is down. The crew leaves nobody behind, and the mission is over.',
  hostage: 'The grenade went off beside the people you came to save. Mind where you roll them.',
  win: ['Everyone out, every plug pulled. The billionaires will have an awkward morning.', 'Walt puts the kettle on. Imani counts the spent shells. Dale asks who left the stairs light on.'],
};
