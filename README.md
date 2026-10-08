# wickd

**A mobile game for teens: trade a live, moving practice market, learn to read price like a pro, and level up your trading room from a bedroom to a moon base. Coached by Pip, an AI trading coach.**

## The core loop: Trade Live 📈
- Candles form **tick by tick** and the chart scrolls in real time.
- Kids tap **BUY** or **SELL**, then drag their **🎯 Take Profit** and **🛑 Stop Loss** lines right on the chart.
- **Coins when price hits their TP.** Losses only cost the coins they chose to risk (10 / 25 / 50).
- The market is built from real ICT setups: equal highs/lows (liquidity) ➜ sweep ➜ market structure shift ➜ Fair Value Gap ➜ retrace into the gap ➜ run to the liquidity. Some setups fail on purpose, so kids learn why stops matter.
- **Perfect ICT entry** (in the gap, with the setup) = **1.5× coins** on a win, and the trade auto-uses ICT levels: stop beyond the sweep, target at the liquidity.
- **Pip coaches live**: "💰 Equal highs!", "🧹 Sweep!", "⚡ MSS + gap — wait for price to come back", "🟢 Entry zone — tap BUY!". Hints fade out as missions get harder.
- **9 missions** (First Take Profit ➜ Kill Zone Master) with goals, stars and speed-ups, plus an endless **Free Market** to farm coins (hints on/off, 0.5×–2× speed, pause).

## Trading School 🎓
6 worlds and 22 quiz levels that teach each concept on its own:

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
- **Teen-safe:** no ads, no purchases, no chat, no accounts yet; progress saved on the device; handle instead of real name
- **Works offline** as an installable PWA (add to home screen)

## Run it
No build step, no dependencies.

```bash
npm start            # serves on http://localhost:8080
npm test             # validates every quiz chart + 150 live markets (setups, TP/SL behaviour, tick paths)
npm run build:single # dist/candle-quest.html — the whole game in one file
```
Or just open `index.html` in a browser.

## Project layout
```
index.html             app shell
css/style.css          all styles (light + dark)
js/scenarios.js        chart engine: builds each ICT concept + correct answer (pure logic, unit-tested)
js/market.js           live market simulator: endless stream of ICT setups + tick-by-tick candle paths
js/live.js             live trading: moving chart, BUY/SELL, draggable TP/SL, coins, coaching, missions
js/chart.js            canvas renderer for the Trading School quizzes
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


## Order ticket
Tap BUY or SELL to open a ticket: choose Market or Limit, drag the gold entry, red stop loss and green take profit lines on the chart (or tap 1R / 2R / 3R / Coach), see the risk, reward and R:R, then Place. Limit and stop orders wait on the chart and fill by themselves when price reaches the entry. Flip on One-tap trading for instant market orders with the coach's levels.

## Your trader and gems
- **Character creator (Me → Edit my look, or tap your avatar on Home):** a soft 3D character built from layered vector parts: face, skin tone, 8 hairstyles, tops, bottoms, shoes and extras, each with colors. Your character shows on Home, the profile, the league table and sitting at the desk in your room.
- **Two currencies.** Coins are earned only and pay for trading and setup upgrades. Gems are the premium currency for cosmetics only: they never convert to coins, can't be staked on trades, can't be cashed out, and nothing is random.
- **Earning gems free:** level up (+25), new badge (+10), every 7-day streak (+30), league promotion (+50).
- **Gem shop (tap the gem counter):** featured items that rotate daily, a one-time $2.99 starter pack, Wickd Club ($4.99/mo, $39.99/yr, $59.99/yr family), Season 1 pass (coming soon) and gem packs from $0.99 to $49.99 with every price shown in dollars. Purchases require a parent's approval. Checkout is not connected yet; a clearly labeled test mode adds gems without paying.
