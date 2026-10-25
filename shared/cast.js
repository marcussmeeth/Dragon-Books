// Shared look definitions for the three veterans and the tycoon (used by both Chain Reaction games).
const glasses = '<g fill="none" stroke="#2b1a12" stroke-width="2"><circle cx="-9" cy="-53" r="6.400"/><circle cx="9" cy="-53" r="6.400"/><path d="M-2.600 -53 h5.200"/></g>';
const vest = '<path d="M-14 -40 h28 v26 h-28z" fill="#2f3a2a" opacity=".85"/><path d="M-14 -30 h28" stroke="#1d2418" stroke-width="2"/>';

export const CREW_LOOKS = {
  dale: { skin: '#e0b08a', hair: '#9a9a9a', hs: 0, top: '#4b5a3a', pants: '#2e3a46', body: vest },
  imani: { skin: '#8a5533', hair: '#cfcfcf', hs: 4, top: '#3b4a5a', pants: '#252a33' },
  walt: { skin: '#f3c08f', hair: '#f4f4f4', hs: 0, top: '#7a6a52', pants: '#3b3a46', face: glasses },
};

export const TYCOON_LOOK = { skin: '#f3c08f', hair: '#2b1a12', hs: 0, top: '#2b4a7a', pants: '#15151d',
  face: '<path d="M-17 -57 h34 v7 q0 4 -4 4 h-8 q-4 0 -4 -4 v-1 h-2 v1 q0 4 -4 4 h-8 q-4 0 -4 -4z" fill="#15121c"/>',
  body: '<path d="M-14 -40 h28 v26 h-28z" fill="#3a5a9a"/><path d="M-14 -38 l14 8 l14 -8" stroke="#fff" stroke-width="2" fill="none"/>' };
