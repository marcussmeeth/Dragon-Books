// "The Last Course": an Inspector-calls style interrogation. All names and plot are original.
// Look objects feed charSVG (shared/chars.js): skin, hair, hs (hair style 0-5), top, pants, plus optional svg bits.

export const START = { turns: 16, clockStart: 8 * 60 + 40, minutesPerTurn: 5 };

export const EVIDENCE = {
  photo: { name: 'Photo of Wren', icon: '🖼️', text: 'A girl of nineteen in a roaster\'s apron, laughing at someone off camera. Found in her coat. Her name was Wren Alder.' },
  diary: { name: 'Diary page', icon: '📓', text: '"Thurs. Called up to the top-floor office. Cleared my locker by noon. The last thing I saw was the brass plate on the door: CHAIRMAN."' },
  dismissal: { name: 'Dismissal slip', icon: '📄', text: '"Employment ended, effective at once. Any hardship request to be made to Lady H.\'s committee."' },
  charitycard: { name: 'Committee card', icon: '🗂️', text: '"ALDER, W. Hardship fund: DECLINED. Character doubtful (per C.H.). Do not reconsider."' },
  ticket: { name: 'Opera stubs', icon: '🎟️', text: 'Two stubs for Box 6, last Saturday, with a pressed red carnation folded between them.' },
  recipe: { name: 'Recipe card', icon: '☕', text: 'A blend in Wren\'s handwriting: "Reserve No. 7". On the back, a later stamp: "AV Roasters, registered this year."' },
};

const bowtie = '<path d="M-7 -41 l-8 -4 v9z M7 -41 l8 -4 v9z" fill="#15151d"/><circle cx="0" cy="-41" r="3" fill="#15151d"/>';
const pearls = '<g fill="#fff8ea">' + [-12, -7, -2, 3, 8, 13].map((x, i) => `<circle cx="${x}" cy="${-40 + Math.abs(x) / 3}" r="2.4"/>`).join('') + '</g>';

// soft: the approach that works on them ('press' or 'gentle'). key: evidence that breaks them. gives: evidence they hand over.
export const SUSPECTS = {
  teddy: {
    name: 'Teddy Hollowell', role: 'The son', x: 215, composure: 70, soft: 'gentle', keys: ['photo'], gives: 'ticket',
    look: { skin: '#f6d3b3', hair: '#c98b3a', hs: 4, top: '#8a5a38', pants: '#3b3a46' },
    start: 'worried',
    intro: '"I... think I\'ll have another. No. No, I won\'t." He pushes his glass away.',
    press_bad: '"Leave off! I haven\'t done anything!" (That is not, strictly, a denial.)',
    gentle_good: '"You\'re the first person tonight who hasn\'t looked straight through me," he says, and some of the fight goes out of him.',
    wrong: '"Dunno what that is. Honest."',
    near: 'He goes grey. "Where did you get that?" Notice that he doesn\'t ask who she is.',
    confess: '"Her name\'s Wren. She ran the roaster on the second floor, and she let me sit with her when Father... well. On Saturday she asked me to speak up for her. I said I would. Then Father looked at me over the breakfast table and I said nothing." He lays a crumpled paper on the cloth. "She left her coat in my motor. These were in the pocket."',
    note: 'Teddy was Wren\'s friend. She asked for his help and he stayed silent. He kept her coat.',
    after: 'Teddy has his head in his hands.',
  },
  alistair: {
    name: 'Sir Alistair Hollowell', role: 'The Chairman', x: 365, composure: 80, soft: 'press', keys: ['diary'], gives: 'dismissal',
    look: { skin: '#f3c08f', hair: '#9a9a9a', hs: 0, top: '#2b2f3a', pants: '#15151d', body: bowtie },
    start: 'happy',
    intro: '"My dear fellow, we are mid-pudding. Whatever this is, it can wait until Monday."',
    press_good: 'He goes red to the ears. "I won\'t be bullied in my own dining room!" His hand shakes a little on the tablecloth.',
    gentle_bad: '"Don\'t pat my hand, Inspector. I employ four hundred people."',
    wrong: '"Never seen it. Is this what the police waste their time on?"',
    wrongBy: { photo: '"A shopgirl? I employ four hundred people. I can\'t be expected to know them all."' },
    near: 'His eyes flick to the line about the top-floor office. "The scribbling of a girl with a grievance," he says, a little too quickly.',
    confess: '"All right! She organised a petition: fair pay, shorter hours, in MY warehouse. I had her out by noon, slip signed before lunch." He slumps. "I didn\'t think. I never think about the small ones."',
    note: 'Sir Alistair sacked Wren over a pay petition. The slip sends hardship requests to Lady Hollowell\'s committee.',
    after: 'Sir Alistair stares at his untouched pudding.',
  },
  marguerite: {
    name: 'Lady Marguerite', role: 'The mother', x: 515, composure: 90, soft: 'gentle', keys: ['dismissal'], gives: 'charitycard',
    look: { skin: '#f6d3b3', hair: '#cfcfcf', hs: 1, top: '#6b2a4a', pants: '#2a2a33', body: pearls },
    start: 'neutral',
    intro: '"A girl? We hold a charity table every month, Inspector. One cannot remember every unfortunate."',
    press_bad: '"I will not be shouted at over my own silver." She sits straighter. The pearls do not move.',
    gentle_good: 'You ask, kindly, about the committee. Her fingers loosen on the napkin. "It is tiring, sometimes, being the one who must say no."',
    wrong: '"I have no idea what that is." Her smile is a locked door.',
    wrongBy: { photo: '"Pretty. They always are." She looks away.' },
    near: 'Her eyes drop to "Lady H.\'s committee" and stay there. "Many people mention my name," she says quietly.',
    confess: '"She came on Friday afternoon, eyes red, no coat. She wanted six weeks\' rent, that was all. There was a note: doubtful character. I let it stand." She presses the napkin to her mouth. "Six weeks\' rent. We spend more than that on flowers."',
    note: 'Lady Marguerite refused Wren\'s hardship request because of a note: "doubtful character (per C.H.)".',
    after: 'Lady Marguerite has put her napkin down and will not pick it up.',
  },
  clara: {
    name: 'Clara Hollowell', role: 'The bride-to-be', x: 665, composure: 70, soft: 'gentle', keys: ['charitycard', 'ticket'], gives: null,
    look: { skin: '#f6d3b3', hair: '#7b4a24', hs: 3, top: '#3b7fa8', pants: '#2e3a46' },
    start: 'happy',
    intro: '"Is this about the engagement? Rupert, tell him it\'s nothing." She turns her ring.',
    press_bad: '"Stop it! Everyone\'s looking!"',
    gentle_good: '"It\'s been such a strange evening," she says. "I keep thinking I ought to be happier."',
    wrong: '"I don\'t know what that is. Why are you looking at me?"',
    wrongBy: { photo: '"She\'s... no. No, I don\'t know her." The ring turns again.' },
    near: 'She reads it twice. "C.H.," she whispers. "That could be anyone." It could not.',
    confess: '"I told Mummy she was doubtful! I\'d seen them at the opera, her and Rupert, his carnation in her hand. I was jealous, and I said the worst thing I could think of to the one person who could make it stick." She is crying now. "I never thought anyone would listen."',
    note: 'Clara called Wren "doubtful" out of jealousy over Rupert.',
    after: 'Clara has stopped turning her ring.',
  },
  rupert: {
    name: 'Rupert Ashby-Vane', role: 'The fiancé', x: 815, composure: 75, soft: 'press', keys: ['ticket'], gives: 'recipe',
    look: { skin: '#eab98f', hair: '#2b1a12', hs: 0, top: '#1d1d2b', pants: '#15151d', body: '<circle cx="9" cy="-37" r="4" fill="#d9302c"/><path d="M5 -41 l8 -2" stroke="#4f8a45" stroke-width="2"/>' },
    start: 'happy',
    intro: '"Frightfully sorry, Inspector, but you\'ve the wrong house. Have a glass of the claret."',
    press_good: 'His smile slips by a hair. "Steady on. I\'m a guest here."',
    gentle_bad: '"Charm won\'t work on me, old boy. I invented it."',
    wrong: '"Fascinating. Is there a point?"',
    wrongBy: { photo: '"Charming girl. Staff, I suppose?" Too smooth.' },
    near: 'A flicker. "Anyone might go to the opera." His hand strays to his lapel, to the carnation.',
    confess: '"Fine. We met at the shop on Fenn Street. She had a blend, brilliant stuff, and told me everything because I let her think I\'d help her launch it. Three weeks later it was my uncle\'s Reserve, with his name on the tin. She wrote me four letters." He picks at the carnation. "I didn\'t read them."',
    note: 'Rupert took Wren\'s blend for his uncle\'s firm and ignored her letters.',
    after: 'Rupert\'s carnation has lost two petals. He hasn\'t noticed.',
  },
};

export const ORDER = ['teddy', 'alistair', 'marguerite', 'clara', 'rupert'];

export const INSPECTOR = {
  name: 'Inspector Quill',
  look: { skin: '#d29b6b', hair: '#2b1a12', hs: 0, hideHair: true, top: '#6b5a44', pants: '#2e3a46',
    body: '<rect x="-17" y="-24" width="34" height="5" rx="2.500" fill="#3d3226"/><path d="M0 -43 v32" stroke="#3d3226" stroke-width="2"/>',
    hat: '<g><ellipse cx="0" cy="-70" rx="34" ry="8" fill="#4a3d2c"/><path d="M-21 -70 C-21 -90 21 -90 21 -70z" fill="#5a4a36"/><path d="M-21 -72 h42" stroke="#2b2118" stroke-width="5"/></g>',
    hand: '<g transform="translate(6 -4) rotate(12)"><rect x="-8" y="-12" width="16" height="22" rx="2.500" fill="#2f3f5a"/><path d="M-4 -6 h8 M-4 -1 h8" stroke="#fff" stroke-width="1.400" opacity=".6"/></g>' },
};

export const TEXT = {
  intro: [
    'Hollowell House. A quarter to nine. The Hollowells are toasting their daughter\'s engagement when you arrive uninvited.',
    'This afternoon, Wren Alder, nineteen, a roaster at the family\'s coffee firm, was found at the foot of the warehouse stairs. Nobody pushed her. But everyone at this table helped her get there.',
    'You have 16 questions before the clock strikes ten. Tap a diner to question them. Read their mood, soften the proud with a push and the frightened with kindness, then show the right evidence at the right moment.',
  ],
  press_lost: 'Sir Alistair stands. "That is quite enough. Dawson, the Inspector is leaving." You are shown the door.',
  wrongNote: 'A blank look. That is not their secret.',
  chain: 'The family sees the cracks. Everyone else shifts in their seat.',
};

export const ENDINGS = {
  reckoning: { title: 'The Reckoning', stars: 3, text: [
    'One by one, the Hollowells say it aloud. Nobody argues. The clock chimes ten.',
    'You take off your hat. "Quill. Factory Inspectorate. Wren\'s petition reached my desk on Friday. I came to see for myself."',
    'Then the telephone in the hall begins to ring. Sir Alistair lifts the receiver, listens, and turns very pale. It is the police. A girl has been found at the foot of the warehouse stairs.',
  ] },
  cracks: { title: 'Cracks in the Glass', stars: 2, text: [
    'The clock chimes ten. Some of the Hollowells have told the truth. Others have decided, together and silently, that they will not.',
    'You leave behind a family that will never again sit quite comfortably at the same table.',
    'In the hall the telephone starts ringing. Nobody moves to answer it.',
  ] },
  closed: { title: 'Closed Ranks', stars: 1, text: [
    'By ten o\'clock the family has closed ranks over the pudding. "A misunderstanding," says Sir Alistair. "An overzealous young man."',
    'You step out into the rain. Behind you, laughter starts again.',
    'Somewhere across town, another girl is cleaning out her locker.',
  ] },
  door: { title: 'Shown the Door', stars: 0, text: [
    'You are on the steps and the door is closed. Through the glass you see the family raising their glasses.',
    'You pushed too hard, and the truth went back in the box. Tomorrow, you will try again.',
  ] },
};
