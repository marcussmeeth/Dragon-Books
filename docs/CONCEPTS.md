# Dragon Books: concept document

## The idea
A shelf of short games, one per book or story shape, sharing one cast of chunky, expressive little people from
Brew Empire (`charSVG`: moods, accessories, costumes, tap-to-chat). Each game should be playable in 10-15 minutes on an
iPad and built as a pure logic engine plus a thin UI.

## Game 1: The Last Course (built)
**Inspired by:** *An Inspector Calls* (the shape: one evening, one room, a visitor, a chain of small cruelties).
**Original story:** Wren Alder, a nineteen-year-old roaster, is dead at the foot of her employer's warehouse stairs.
You are Inspector Quill, and you interrupt the family's engagement dinner. Everyone at the table contributed to her
downfall: the Chairman sacked her, his wife refused her rent money, the daughter slandered her, the fiancé stole her
coffee blend, the son stayed silent.

**Play:** 16 questions before the clock strikes ten. Per diner you choose:
- 😠 *Lean on them*: works on the proud (Sir Alistair, Rupert); makes the fragile dig in.
- 🤝 *Be gentle*: works on the fragile (Teddy, Marguerite, Clara); makes the proud sneer.
- 📎 *Show evidence*: only the right item breaks a diner, and only once they are softened enough (composure <= 30).
  The wrong item makes them smug and the room tenser.
- **Tension** rises when you misjudge people. At 100, Sir Alistair has you thrown out.
- Each confession hands over a new piece of evidence and rattles everyone else.

**Puzzle graph** (two entry points meeting in the middle, so there is a real choice of route):
`Teddy (photo) -> opera stubs -> Rupert -> recipe`, `Alistair (diary) -> dismissal slip -> Marguerite -> committee card`,
and Clara breaks on either the committee card or the opera stubs.

**Endings:** The Reckoning (5 confessions; the Inspector is really from the Factory Inspectorate and the phone rings:
the police have found the body), Cracks in the Glass (3-4), Closed Ranks (0-2), Shown the Door (tension maxed).

**Next:** a second case, optional "what the family says to each other" overheard lines, sound, a daily seed,
and a Brew Empire crossover case set in the Flagship Diner.

## Game 2: Chain Reaction (built: first playable)
**Inspired by:** a Reacher-style thriller (three senior ex-soldiers, one woman, rescuing plans and innocents from
mercenaries hired by tech billionaires who want to steal secrets with AI). Domestic houses, streets and offices.
Premise only; all characters and plot to be original.

- **Crew:** a breacher (strong), a scout (fast, sees through walls via CCTV), a talker (calm, can bluff guards).
- **Core loop:** clear one room at a time in side-on rooms (house, street, office floor, server room). Turn-based
  with a shared action pool.
- **The twist mechanic:** an AI "data siphon" meter fills as the clock runs. Freeing hostages and pulling plugs slows
  it; every turn you choose between speed and quiet.
- **Tone:** cartoon, no gore. Takedowns, stunned guards, comedic alarms. Mercenaries reuse the `thug` look; billionaires
  get a gilet, smartwatch and smug face.
- **Build cost:** highest of the shelf (movement, line of sight, enemy behaviour).

**As built:** a side-on cutaway of rooms (a graph, not a pixel grid). Each round every crew member has 2 actions; then guards
move. Crew: Dale Brandt (Breacher: loud takedown of any guard, noise alerts the next room), Imani Reyes (Scout: sees two
rooms, silent takedowns of unaware guards), Walt Hollis (Talker: bluffs an unaware guard for two rounds). Guards idle or patrol;
a guard that spots you goes on alert (+10% siphon), chases, and hits on the following round. Any crew member going down fails
the mission. Terminals add to a data-siphon meter every round until the plug is pulled; 100% fails the mission.
Three missions: The Semi (house, free a family, one laptop), Market Street (street, courier, plans, spy drone), Vantage Tower
(office floor, three machines and the engineers). `tests/chain.mjs` proves each is winnable and losable with random playouts.

**Action version (`games/action`):** the same crew and missions in real time, on a 3/4 top-down floor plan you can walk around freely
(touch joystick or WASD). Guards run routines: they walk a route, stop and look around, and sometimes get distracted (a phone, a
chat, a coffee). A distracted guard sees much less (blue cone), and a guard looking away is your window to creep up behind and stab
silently. Vision cones are ray-cast, so walls, closed doors and tall furniture block them. Noise draws guards in, closed doors open
on contact, and alert guards path-find after you and shoot back. Guns are loud except Imani's silenced pistol; Walt's bottles lure
guards; grenades roll the way you face, bounce off walls and hurt your own crew (and fail the mission if they reach the hostages).
`tests/action.mjs` checks every objective is reachable on foot, the vision, stealth, noise and weapon rules, and fuzzes all three maps.

**Next:** a level editor, more guard types (camera, dog), a smart-speaker "AI" that reacts to noise, undo, a campaign map.

## The shelf (other candidates)
| Book | Game idea | Reuses | Rights |
| --- | --- | --- | --- |
| Sherlock Holmes | Deduce from what people wear and carry | Random accessories become clues | Public domain |
| Oliver Twist | Run a pickpocket gang through the street, dodge constables | Street scenes, crowds | Public domain |
| A Christmas Carol | A miserly café owner is visited by three ghosts of the business | Lighting and seasons | Public domain |
| The 39 Steps | Chase across stations and moors | Backdrops, weather | Public domain (UK) |
| Around the World in 80 Days | Plan a route against money and time | Brew Empire's economy engine | Public domain |
| Animal Farm | Manage a farm while the rules quietly change | Engine, moods (needs animal art) | UK public domain; US until 2041 |

## Engineering notes
- Character kit copied (not linked) from Brew Empire's `www/js/art.js`; changes: `look` option for custom people,
  `hideHair` flag, and a `worried` mood with a sweat drop. Worth back-porting to Brew Empire later.
- Games are ES modules, no dependencies. Engines are DOM-free so `npm test` can run full playthroughs.
