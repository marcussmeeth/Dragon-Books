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
| **Chain Reaction** (`games/chain`) | Playable | Three veterans rescue innocents from tech-billionaire mercenaries across a house, a street and an office tower. |

- `shared/chars.js` + `shared/chars.css`: the character kit lifted from Brew Empire, plus a new `worried` mood.
- `games/<name>/engine.js`: pure game logic, tested in Node. `main.js`: the browser UI.
- `docs/CONCEPTS.md`: concept doc and the book shelf.

## A note on rights
Ideas, premises and genres are free to borrow; names, characters and text are not. The games here are original
stories with the shape of their inspiration. Public-domain books (Sherlock Holmes, Oliver Twist, A Christmas Carol,
The 39 Steps, Around the World in 80 Days) can be adapted directly.
