// "Chain Reaction": three veterans vs. mercenaries hired by tech billionaires who are stealing secrets with AI.
// Original characters and story. Rooms form a side-on cutaway; guards patrol between linked rooms.

const glasses = '<g fill="none" stroke="#2b1a12" stroke-width="2"><circle cx="-9" cy="-53" r="6.400"/><circle cx="9" cy="-53" r="6.400"/><path d="M-2.600 -53 h5.200"/></g>';
const vest = '<path d="M-14 -40 h28 v26 h-28z" fill="#2f3a2a" opacity=".85"/><path d="M-14 -30 h28" stroke="#1d2418" stroke-width="2"/>';

export const CREW = {
  dale: { name: 'Dale Brandt', role: 'Breacher', letter: 'D', color: '#e0584b', vision: 1, hp: 3,
    blurb: 'Retired major. Big, calm, loud when he needs to be. Can take down any guard, but the noise carries to the next room.',
    look: { skin: '#e0b08a', hair: '#9a9a9a', hs: 0, top: '#4b5a3a', pants: '#2e3a46', body: vest } },
  imani: { name: 'Imani Reyes', role: 'Scout', letter: 'I', color: '#3fa7c4', vision: 2, hp: 3,
    blurb: 'Retired sergeant major. Sees two rooms ahead. Silent takedowns, but only on guards who haven\'t spotted anyone.',
    look: { skin: '#8a5533', hair: '#cfcfcf', hs: 4, top: '#3b4a5a', pants: '#252a33' } },
  walt: { name: 'Walt Hollis', role: 'Talker', letter: 'W', color: '#e8b64c', vision: 1, hp: 3,
    blurb: 'Retired colonel. Spectacles, cardigan and absolute authority. Can bluff an unaware guard into looking the other way for two rounds.',
    look: { skin: '#f3c08f', hair: '#f4f4f4', hs: 0, top: '#7a6a52', pants: '#3b3a46', face: glasses } },
};
export const CREW_ORDER = ['dale', 'imani', 'walt'];

export const AP = 2;
export const SPOTTED_SIPHON = 10;

const tycoon = { skin: '#f3c08f', hair: '#2b1a12', hs: 0, top: '#2b4a7a', pants: '#15151d', face: '<path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#15121c"/>', body: '<path d="M-14 -40 h28 v26 h-28z" fill="#3a5a9a"/><path d="M-14 -38 l14 8 l14 -8" stroke="#fff" stroke-width="2" fill="none"/>' };
export const TYCOON = tycoon;

export const LEVELS = [
  {
    id: 'semi', name: 'The Semi', place: 'A suburban house', theme: { wall: '#ecd9b6', floor: '#9a7048', bg: '#2a2230' },
    brief: 'Mercenaries are holding the Parkes family in their own lounge. Their laptop in the study is feeding the household\'s data to a billionaire\'s AI. Free the family. Pull the plug.',
    cols: 3, rows: 2, start: 'kitchen',
    rooms: { bed: { name: 'Bedroom', c: 0, r: 0 }, landing: { name: 'Landing', c: 1, r: 0 }, study: { name: 'Study', c: 2, r: 0 },
      kitchen: { name: 'Kitchen', c: 0, r: 1 }, hall: { name: 'Hall', c: 1, r: 1 }, lounge: { name: 'Lounge', c: 2, r: 1 } },
    links: [['bed', 'landing'], ['landing', 'study'], ['kitchen', 'hall'], ['hall', 'lounge'], ['landing', 'hall', 'stairs']],
    guards: [{ id: 'g1', room: 'lounge' }, { id: 'g2', room: 'hall', route: ['hall', 'kitchen'] }],
    hostages: [{ id: 'parkes', room: 'lounge', name: 'The Parkes family' }],
    items: [],
    terminals: [{ id: 'laptop', room: 'study', rate: 5, name: 'Family laptop' }],
  },
  {
    id: 'market', name: 'Market Street', place: 'A high street', theme: { wall: '#c9d3dc', floor: '#6c7480', bg: '#1d2430' },
    brief: 'A courier is locked in a flat above the market with half the plans for a billionaire\'s rival. The other half is in a van. A drone on the roof is copying everything. Get both, and the drone.',
    cols: 5, rows: 2, start: 'corner',
    rooms: { corner: { name: 'Corner', c: 0, r: 1 }, market: { name: 'Market', c: 1, r: 1 }, square: { name: 'Square', c: 2, r: 1 }, van: { name: 'Van', c: 3, r: 1 }, cafe: { name: 'Café', c: 4, r: 1 },
      flat: { name: 'Flat', c: 1, r: 0 }, roof: { name: 'Roof', c: 4, r: 0 } },
    links: [['corner', 'market'], ['market', 'square'], ['square', 'van'], ['van', 'cafe'], ['market', 'flat', 'stairs'], ['cafe', 'roof', 'stairs']],
    guards: [{ id: 'g1', room: 'market', route: ['market', 'square'] }, { id: 'g2', room: 'van' }, { id: 'g3', room: 'flat' }, { id: 'g4', room: 'cafe', route: ['cafe', 'van'] }],
    hostages: [{ id: 'courier', room: 'flat', name: 'The courier' }],
    items: [{ id: 'plans', room: 'van', name: 'Plans', icon: '📁' }],
    terminals: [{ id: 'drone', room: 'roof', rate: 8, name: 'Spy drone' }],
  },
  {
    id: 'tower', name: 'Vantage Tower', place: 'An office floor', theme: { wall: '#dfe6ee', floor: '#7a8794', bg: '#141a26' },
    brief: 'The billionaire\'s command floor. Three machines are siphoning a rival lab\'s research. Engineers are held in the pantry. Pull every plug before the data is gone, and get the engineers out.',
    cols: 4, rows: 2, start: 'lift',
    rooms: { archive: { name: 'Archive', c: 0, r: 0 }, server: { name: 'Server room', c: 1, r: 0 }, exec: { name: 'Exec office', c: 2, r: 0 }, board: { name: 'Boardroom', c: 3, r: 0 },
      lift: { name: 'Lift lobby', c: 0, r: 1 }, open: { name: 'Open plan', c: 1, r: 1 }, meet: { name: 'Meeting room', c: 2, r: 1 }, pantry: { name: 'Pantry', c: 3, r: 1 } },
    links: [['archive', 'server'], ['server', 'exec'], ['exec', 'board'], ['lift', 'open'], ['open', 'meet'], ['meet', 'pantry'], ['lift', 'archive', 'stairs'], ['meet', 'exec', 'stairs']],
    guards: [{ id: 'g1', room: 'open', route: ['open', 'lift'] }, { id: 'g2', room: 'server' }, { id: 'g3', room: 'exec', route: ['exec', 'board'] }, { id: 'g4', room: 'pantry' }, { id: 'g5', room: 'meet', route: ['meet', 'open'] }],
    hostages: [{ id: 'engineers', room: 'pantry', name: 'The engineers' }],
    items: [],
    terminals: [{ id: 'core', room: 'server', rate: 5, name: 'Server' }, { id: 'exec', room: 'exec', rate: 5, name: 'Exec terminal' }, { id: 'ai', room: 'board', rate: 4, name: 'The AI core' }],
    tycoon: 'board',
  },
];

export const TEXT = {
  win: ['All plugs pulled, everyone out. The billionaires will have a very awkward morning.', 'Quiet nods all round. Walt puts the kettle on.'],
  siphon: 'The progress bar hits 100%. Somewhere, a very smug AI has learned everything.',
  down: 'One of the three is down. The crew doesn\'t leave anyone, and neither does the mission survive it.',
};
