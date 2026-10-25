import assert from 'node:assert/strict';
import { newGame, act, ending, confessedCount } from '../games/inspector/engine.js';
import { SUSPECTS } from '../games/inspector/data.js';

const run = (g, steps) => steps.map(([type, who, item]) => act(g, { type, who, item }));

// Perfect route: two chains (Teddy->Rupert, Alistair->Marguerite) meeting at Clara, within the turn budget.
{
  const g = newGame();
  run(g, [
    ['gentle', 'teddy'], ['show', 'teddy', 'photo'],
    ['press', 'rupert'], ['show', 'rupert', 'ticket'],
    ['press', 'alistair'], ['show', 'alistair', 'diary'],
    ['gentle', 'marguerite'], ['gentle', 'marguerite'], ['show', 'marguerite', 'dismissal'],
    ['gentle', 'clara'], ['show', 'clara', 'ticket'],
  ]);
  assert.equal(confessedCount(g), 5);
  assert.equal(ending(g).id, 'reckoning');
  assert.ok(g.turns >= 0, 'turn budget');
  console.log('perfect route ok, turns left', g.turns, 'tension', g.tension);
}
// Evidence is locked until someone hands it over.
{
  const g = newGame();
  assert.equal(act(g, { type: 'show', who: 'rupert', item: 'ticket' }), null);
  assert.equal(g.turns, 16);
}
// Wrong evidence never confesses and costs a turn; mis-reading people raises tension.
{
  const g = newGame();
  const r = act(g, { type: 'show', who: 'alistair', item: 'photo' });
  assert.ok(r.wrong && !g.sus.alistair.confessed && g.turns === 15);
  for (let i = 0; i < 6 && !g.over; i++) act(g, { type: 'press', who: 'marguerite' });
  assert.equal(g.over, 'door');
  assert.equal(ending(g).id, 'door');
}
// Idling out is a loss, not a crash.
{
  const g = newGame();
  for (let i = 0; i < 16; i++) act(g, { type: 'gentle', who: 'teddy' });
  assert.ok(g.over);
  assert.equal(act(g, { type: 'gentle', who: 'teddy' }), null);
}
// Every suspect has the lines the engine can ask for.
for (const [id, s] of Object.entries(SUSPECTS)) {
  const bad = s.soft === 'press' ? 'gentle_bad' : 'press_bad';
  for (const k of [`${s.soft}_good`, bad, 'wrong', 'near', 'confess', 'note', 'after', 'intro']) assert.ok(s[k], `${id}.${k}`);
}
console.log('inspector tests passed');
