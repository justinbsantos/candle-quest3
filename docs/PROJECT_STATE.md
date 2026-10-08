# Wickd — Project State & Challenge Brief

*Snapshot as of October 8, 2026 · GitHub: justinbsantos/candle-quest3 · baseline commit `8285c9f` on `main`*

This document describes exactly where the Wickd game stands today, so any developer (human or AI) can pick it up from here. The development challenge starts from this snapshot: same code, same goals, and the question is who can make it the better game and the better business.

---

## 1. What Wickd is

**One line:** a mobile game for teens (13–17) where you trade a live, moving practice market, learn to read price like a pro trader, earn coins when your trades hit their take profit, and spend those coins upgrading your trading room from a bedroom to a moon base.

- **Audience:** teens 13–17 (chosen deliberately: fits the US high-school personal-finance requirement and avoids the strictest under-13 privacy rules). Parents are the paying customer.
- **What it teaches:** how price actually moves, using concepts from the ICT ("Inner Circle Trader") style of trading: candles and wicks, swing highs and lows, trend, buy-side and sell-side liquidity, liquidity sweeps, fair value gaps (FVGs), order blocks, market structure shifts (MSS), and the full model: sweep → MSS with a gap → entry on the retrace → stop beyond the sweep → target at the opposite liquidity. Above all it teaches risk management: every trade has a stop loss.
- **Tone:** it must feel like a real, fun mobile game first, and education second. No childish visuals.
- **Money is play money.** Coins can never be bought or cashed out (earn-only for now).
- **Branding note:** don't use the trademarked "ICT" name in marketing; use the generic concept names.

## 2. The player experience today

Bottom tab bar with five areas: **Home · Trade · My room · School · Me**.

### Home
- Greeting with the player's avatar (initial inside a colored ring).
- **Live practice market** hero: a real candlestick chart that keeps forming candles tick-by-tick, with a live price tag, and a big "Trade live" button that jumps straight into the next mission.
- Daily chest (claim once a day, streak grows the reward: 20 + 10 × streak coins, max 7).
- My room card (mini live render of your room + trading-bot earnings to collect).
- Shortcuts to Free market and Trading school, plus level / take profits / badges stats.

### Trade (the core loop)
- A **live market** streams candles in real time; each candle is built from ~14 ticks, so price visibly moves up and down inside the candle.
- Player taps **BUY** or **SELL** and picks a risk per trade (10 / 25 / 50 coins).
- On entry, the chart shows a **green take-profit zone and a red stop-loss zone**; both lines can be **dragged** on the chart, and their tags show the coins you'd win or lose.
- Price hitting the TP pays coins (R-multiple × stake, capped at 5R); hitting the SL costs exactly the stake. Player can also close early.
- The market is generated from **ICT setup "episodes"**: equal highs/lows (liquidity) → sweep → displacement candle that breaks structure and leaves an FVG → retrace into the FVG → run to the liquidity target. Some setups **fail on purpose** (stop out) so players learn why stops matter. Random filler moves sit between setups.
- **Perfect ICT entry:** entering inside the gap, in the setup's direction, after the sweep and MSS, auto-places ICT levels (stop beyond the sweep, target at the liquidity) and pays **1.5× coins** on a win.
- **Pip, the AI coach** (a glowing orb), calls out events live: "Equal highs, liquidity is resting above", "Sweep!", "Structure shift and a gap, wait for the retrace", "Entry zone, tap BUY". The right button pulses. Hints fade out as missions get harder.
- **9 missions** with goals and 3 stars each:
  1. First Take Profit (1 TP, full hints, calm speed)
  2. Double Up (2 TPs)
  3. Coin Hunter (finish +40 coins)
  4. Gap Sniper (1 perfect-entry win, fewer hints)
  5. Steady Hands (2 TPs, max 1 stop)
  6. Speed Round (fast market)
  7. No Training Wheels (no hints)
  8. High Roller (+120 coins, bigger stakes)
  9. Kill Zone Master (3 perfect wins, no hints, fast)
  - Stars: reach the goal · finish up with ≤1 stop loss · win at least one perfect entry.
- **Free market:** endless session, hints on/some/off, speed ½× / 1× / 2×, pause.
- Session results screen lists every trade (direction, outcome, coins).

### My room (tycoon / long-term coin sink)
- Six rooms: **Bedroom → Garage studio → Downtown office → Skyscraper floor → Penthouse → Moon base** (moving costs 800 / 2,500 / 6,000 / 14,000 / 35,000 coins).
- Eight upgrade lines, levels 0–6, each room caps how far they go (tier + 2):
  - **Screens** (1 → 8 monitors, each showing live mini charts): **+5% coins on every take profit per level.**
  - **Trading bot** (old laptop → AI supercomputer): **earns 12 / 30 / 60 / 100 / 160 / 240 coins per hour while away**, stores max 8 hours, collected from Home or the room.
  - Desk, Chair, Lights (desk lamp → neon "TAKE PROFIT" sign → chandelier → aurora), Wall decor (posters → golden bull → hall of fame), Plant, Pet (goldfish, cat, puppy, robot dog, baby dragon, phoenix): cosmetic.
- The room is drawn live on canvas: animated monitors, neon flicker, moving clouds, pets, the player sitting at the desk in a hoodie that matches their avatar ring, and Pip floating nearby.
- Costs scale: base × 1.85^level.

### School (structured lessons)
- 6 worlds, 22 quiz levels, 3-page illustrated lessons per world, and an endless Practice Arena (3 lives, streaks).
- Question types: tap the right candle on a chart, predict what happens next (chart plays forward), and full trade setups (Buy/Sell, then the trade plays out).
- Worlds: Candle Island (candles, wicks, highs) · Mountain Trail (swings, trend) · Liquidity Lagoon (BSL/SSL, sweeps) · Gap Canyon (FVGs) · Block Fortress (order blocks, MSS) · Kill Zone Volcano (full model).

### Me
- Profile card (avatar, level, XP bar), stats, 21 badges, sound toggle, and a "For grown-ups" note (practice markets only, play money, no ads, not financial advice, reset progress).

### Style shop (from My room)
- Avatar rings (Ultraviolet free, Mint Wave, Sunset, Ice, Gold, Holo) and chart themes (Glass free, Daylight, Candy Land, Deep Ocean, Jungle, Neon Arcade).

### Economy summary
| Source | Coins |
|---|---|
| Live trade TP | stake × R (×1.5 for perfect entry, × screens bonus) |
| Live trade SL | −stake |
| School correct answer | +10 (boss trade +30) |
| Practice arena correct | +5 |
| Level clear | +15 per star, +25 first clear |
| Mission clear | +20 per star, +30 first clear |
| Daily chest | 20 + 10 × streak (max 7) |
| Trading bot | up to 240/hour, 8-hour cap |
| Out of coins in a session | coach spots 50 coins once |

XP = coins earned; player level n needs 50·n·(n−1) XP.

## 3. Look & feel (current design system)

- **Name/brand:** "wickd" lowercase wordmark; the dot on the i is a gradient flame (the candle wick). App icon: gradient tile with a white wick-and-flame "i".
- **Style:** "glassy social" (Discord/Snapchat energy): frosted-glass cards over a slowly drifting aurora background (violet, pink, cyan, mint), big rounded cards, pill buttons, floating pill tab bar.
- **Colors:** page #0B0920 · brand gradient #7C5CFF → #FF4FD8 · up/buy #3CFFB1 · down/sell #FF4D6D · coins #FFC94A.
- **Type:** Unbounded (display, numbers, buttons) + Plus Jakarta Sans (body).
- **Coach:** Pip is a glowing orb with a flame (no cartoon animal). Player avatar is their initial inside a colored ring.

## 4. Tech

- Plain HTML/CSS/JavaScript, **no build step, no dependencies**, mobile-first, installable PWA (offline via service worker). Canvas for all charts and the room.
- `npm start` (local server) · `npm test` (validates 17 quiz scenario types × 400 charts each, plus 150 simulated live markets: setups behave, winning setups hit target before stop, failing ones stop out, tick paths hit every candle's high and low) · `npm run build:single` (whole game in one HTML file).
- Save data in `localStorage` only (no accounts or backend yet).
- Files:
  - `js/scenarios.js`: procedural chart engine for every concept + correct answers (pure, unit-tested)
  - `js/market.js`: live market simulator (endless ICT episodes, tick paths)
  - `js/live.js`: live trading, positions, TP/SL dragging, coaching, missions, home ticker
  - `js/room.js`: room tycoon (canvas drawing, upgrades, bot income)
  - `js/chart.js`: quiz chart renderer · `js/data.js`: worlds, lessons, shop, badges
  - `js/store.js`: save, coins/XP/levels, daily streak, sounds · `js/mascot.js`: coach + avatars · `js/icons.js`: logo + icon set
  - `js/app.js`: screens and navigation · `css/style.css`: design system
- Going native later: wrap with Capacitor for iOS/Android.

## 5. Business direction (agreed so far)

- **Goal:** a $1M+/year business.
- **Monetization plan (earn-only coins for now):**
  - Family subscription (~$7.99/mo or $59.99/yr; free tier = first missions, bedroom + garage, first school worlds). Optional lifetime unlock.
  - Parent dashboard + weekly progress email (the reason parents pay).
  - Seasonal pass with fixed-price cosmetics, bought by parents (no loot boxes, no pay-to-win).
  - Schools and districts (classroom mode, teacher dashboard; 30 US states now require a personal-finance course for graduation).
  - Sponsors (credit unions/banks) and co-branded editions for trading educators (affiliate/rev-share).
- **Avoid:** ads to minors, loot boxes, coins convertible to real money, "undo a loss" power-ups.

## 6. Known gaps / what's next

1. Accounts + cloud save (backend), privacy-safe analytics.
2. Free vs paid split + checkout (Stripe on web first, then in-app subscriptions).
3. Parent dashboard + weekly progress email.
4. "Pro Floor" mode: no coaching at all, rougher market, coins-as-account with % risk, personal-best scoreboard.
5. Make it feel more like a hit game: season pass, weekly leagues/leaderboards, streaks with freezes, limited-time events, collections, social/friends, better juice (sound, haptics, animations).
6. Beta with 50–100 teens; target D1 ≥ 40%, D7 ≥ 20%.

## 7. Challenge rules (suggested)

- Start from this exact snapshot (commit `8285c9f`).
- Keep the core: live moving market, TP/SL trading for coins, teen audience, ICT-style concepts, earn-only coins, room tycoon.
- Judge on: **fun** (would a 15-year-old play it daily?), **learning** (do they actually get better at reading charts and managing risk?), **look & feel**, **retention mechanics**, **monetization readiness**, and **code quality/tests**.
