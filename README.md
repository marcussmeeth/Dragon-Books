# 🐉 Dragon Books

Small, playable games inspired by books, drawn with the big-headed little people from
[Brew Empire](https://github.com/marcussmeeth/brew-empire). Plain HTML/CSS/JavaScript, no build step.

```
npm start      # serves this folder at http://localhost:8080
npm test       # headless checks of the game logic
```

| Game | Status | Premise |
| --- | --- | --- |
| **The Last Course** (`games/inspector`) | Playable | An Inspector-Calls style interrogation of a rich family at dinner. |
| **Chain Reaction** (`games/action`) | Playable | Real-time side-on stealth: three veterans sneak, stab, shoot and roll grenades through a house, a street and an office tower. |
| **Chain Reaction: Tactics** (`games/chain`) | Playable | The same mission as a turn-based puzzle. |

- `shared/chars.js` + `shared/chars.css`: the character kit lifted from Brew Empire, plus a new `worried` mood.
- `games/<name>/engine.js`: pure game logic, tested in Node. `main.js`: the browser UI.
- `docs/CONCEPTS.md`: concept doc and the book shelf.

## Licence
All rights reserved. You may play the games and read the code, but not copy, modify or redistribute them without permission. See `LICENSE`.

## A note on rights
Ideas, premises and genres are free to borrow; names, characters and text are not. The games here are original
stories with the shape of their inspiration. Public-domain books (Sherlock Holmes, Oliver Twist, A Christmas Carol,
The 39 Steps, Around the World in 80 Days) can be adapted directly.

## Play on a phone
The `Deploy web version` workflow publishes the site to GitHub Pages on every push to `main` (it runs `npm test` first).
One-off setup: repo **Settings -> Pages -> Source: GitHub Actions**. Free accounts need a public repo for Pages.
Then open the Pages URL on the phone and use *Share -> Add to Home Screen* (iPhone) or *Install app* (Android).
After the first load the games work offline. If you change any game file, bump `CACHE` in `sw.js` so installed copies refresh.
