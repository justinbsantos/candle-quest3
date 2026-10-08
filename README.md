# 🕯️ Candle Quest

**A mobile-first adventure game that teaches kids to read trading charts — using ICT concepts — with Pip the chart owl 🦉.**

Kids travel through 6 worlds and 22 levels, tapping candles on real-looking candlestick charts, predicting what price does next, and finally taking pretend trades with a stop and target. Every chart is generated fresh, so the game never runs out of practice.

| World | Concepts |
|---|---|
| 🕯️ Candle Island | Bullish / bearish candles, wicks, highs |
| ⛰️ Mountain Trail | Swing highs, swing lows, trend direction |
| 💧 Liquidity Lagoon | Buy-side & sell-side liquidity, equal highs/lows, liquidity sweeps |
| 🏜️ Gap Canyon | Bullish & bearish Fair Value Gaps, price returning to the gap |
| 🏰 Block Fortress | Order blocks, Market Structure Shift |
| 🌋 Kill Zone Volcano | The full ICT model: sweep ➜ MSS ➜ FVG entry ➜ stop & target |

## Game features
- **Real candlestick chart** in every round (canvas, touch-friendly, 6 unlockable chart themes)
- **3 question types:** tap-the-candle, predict-the-future (the chart then plays forward), and boss trades (Buy/Sell with stop/target lines)
- **Progression & account farming:** coins, XP + player levels, 1–3 stars per level, world unlocks, daily treasure with streaks, 15 badges
- **Practice Arena:** endless mode with 3 hearts across every unlocked concept — the coin farm
- **Shop:** hats for Pip and chart themes (play coins only)
- **Lessons:** each world opens with a 3-page illustrated lesson using live example charts
- **Kid-safe:** no ads, no purchases, no chat, no accounts; progress saved on the device; nickname instead of real name
- **Works offline** as an installable PWA (add to home screen)

## Run it
No build step, no dependencies.

```bash
npm start            # serves on http://localhost:8080
npm test             # validates 17 scenario types x 400 random charts each
npm run build:single # dist/candle-quest.html — the whole game in one file
```
Or just open `index.html` in a browser.

## Project layout
```
index.html             app shell
css/style.css          all styles (light + dark)
js/scenarios.js        chart engine: builds each ICT concept + correct answer (pure logic, unit-tested)
js/chart.js            canvas candlestick renderer with annotations & tap detection
js/data.js             worlds, levels, lessons, shop items, badges
js/store.js            save game, coins/XP/levels, daily streak, sound effects
js/mascot.js           Pip the owl (SVG) + hats
js/app.js              screens & game loop
tests/                 scenario correctness tests
docs/GAME_DESIGN.md    design notes & roadmap
```

## Going to the app stores
The game is a standard web app, so it can be wrapped for iOS/Android with [Capacitor](https://capacitorjs.com/):
```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Candle Quest" com.omio.candlequest --web-dir .
npx cap add ios && npx cap add android
```
Before publishing to kids, review Apple's Kids Category and Google Play Families policies and COPPA. See `docs/GAME_DESIGN.md` for the roadmap.

> Candle Quest uses computer-generated practice charts and play money. It is an educational game, not financial advice.
