# Wickd — Project State

*Snapshot: October 8, 2026 · GitHub: justinbsantos/candle-quest3 (`main`)*

Everything built and decided so far, in one place. The app is now built around Justin's four crew characters and a woods-to-skyline camp. Earlier character and room concepts are archived in `docs/concepts/`.

---

## 1. What Wickd is

A mobile game for teens (13–17): pick a trader from the Wickd crew, trade a live practice market, learn to read price like a pro, and work your way from a tent in the woods to a skyline penthouse.

- **Audience:** teens 13–17, girls and boys equally. Parents are the paying customer.
- **What it teaches:**
  - **How price moves:** candles, swing highs and lows, liquidity, sweeps, fair value gaps, market structure shifts, and the full setup (sweep → structure shift with a gap → entry on the retrace → stop beyond the sweep → target at the opposite liquidity).
  - **Risk management above all:** every trade has a stop, and a small risk per trade is how an account survives and compounds.
- **Tone:** a real, fun mobile game first and education second. It should feel premium, not childish.
- **Money is play money.** Coins are earned only and can never be bought or cashed out.
- **Branding:** "ICT" is a third party's term, so it is never used in marketing or in the game. The game uses the generic concept names.

## 2. What's built and playable today

The bottom tab bar has five areas: **Home · Trade · League · Camp · Me**. The top bar shows **gems** (tap it for the gem shop) and **coins**.

### Home
- **Greeting:** your avatar (tap it to edit your look), a streak flame, and a kill zone card. Kill zones are the London, NY AM, NY PM and Asia sessions, in New York time, and they pay 2× coins.
- **Live practice market:** a hero chart with a "Trade live" button that starts the next mission.
- **Daily quests:** 3 a day, with a +100 bonus for finishing all three.
- **League card, daily chest and streak freezes:** a freeze costs 150 coins and you can hold up to 2.
- **Shortcuts:** Pro Account tile, room card and stats.

### Trade
- **Live market:** candles build tick by tick, about 14 moves per candle. The market is generated from teaching setups: equal highs or lows → sweep → structure shift with a gap → retrace → run to the target. Some setups fail on purpose so players learn why stops matter.
- **Order ticket:**
  - Tap BUY or SELL to plan the trade.
  - Drag the red stop-loss and green take-profit lines on the chart, or tap 1R, 2R, 3R or Coach.
  - The ticket shows risk, reward and risk:reward, plus a coaching tip ("At 1:3 you can lose 3 of 4 trades and still break even").
- **Order types:**
  - **Market:** fills right away.
  - **Limit:** a gold entry line you drag into place. The game names the order (buy limit, buy stop, sell limit, sell stop), it waits on the chart, and it fills by itself when price reaches it. You can drag it again or cancel it.
- **One-tap trading:** a toggle for instant market orders that use the coach's levels.
- **Coin payouts:**
  - Payouts scale with how far price moved compared with your risk, capped at 5×.
  - A "perfect entry" (in the gap, after the sweep and the structure shift) pays 1.5× coins.
  - Bonuses: screens +5% per level, kill zone 2×, win streak +10% per win up to +50%.
- **Coaching:** Pip, the AI coach, calls out setups live. Hints fade out as missions get harder.
- **9 missions with stars,** plus a free market with adjustable hints and speed.
- **Pro Account:**
  - $1,000 of play money; you risk 0.5–10% of the balance per trade, so the account compounds.
  - A growth calculator shows compounding and losing-streak drawdowns.
  - If the balance falls below $100 the account is blown, and a restart costs 250 coins.
  - Milestones from $2k to $1M pay coins.
- **Trading school:** 6 worlds, 22 quiz levels, lessons and a practice arena, reached from Trade.

### League
- **Weekly leagues:** 6 tiers of 20 players. The top 5 move up and the bottom 5 move down.
- **AI rivals:** the other players are AI and clearly labeled as such. A real online leaderboard needs accounts and a server, which is planned.
- **Rewards:** coins for your finishing place, plus 50 gems for a promotion.

### Camp
See section 4.

### Me
- **Profile:** your trader, Customize / Switch trader / Gems buttons, stats, 29 badges, sound settings and a "For grown-ups" note.

### Gems (premium currency, built)
- **Two currencies:**
  - **Coins:** earned only; pay for trading and setup upgrades.
  - **Gems:** cosmetics only. They never convert into coins, can't be bet on trades, can't be cashed out, and nothing is random.
- **Earning gems free:** level up +25, new badge +10, every 7-day streak +30, league promotion +50.
- **Gem shop:**
  - Featured items that rotate daily.
  - A $2.99 starter pack (shown after early wins).
  - Wickd Club: $4.99/mo, $39.99/yr, or $59.99/yr for a family of up to 5 kids.
  - A Season 1 pass preview: $4.99 for 6 weeks.
  - Gem packs from $0.99 to $49.99, every price shown in dollars.
- **Parent approval:** every purchase goes to an "Ask a grown-up" screen. Checkout isn't connected yet; a clearly labeled test mode adds gems without paying.

## 3. Characters: the Wickd crew (built)

Justin's four main characters are now the heart of the app (`assets/crew/crew-original.jpg`): Bull, Bear, Fox and Wolf, in matching teal crew jackets and caps with the orange flame patch, on a hill above the city at night.

| Character | Title | Personality |
|---|---|---|
| Bull | The Charger | Buys the breakout and never hesitates |
| Bear | The Closer | Patient; waits for the sweep, then sells the top |
| Fox | The Strategist | Reads the map; knows where the liquidity is (she carries the scroll) |
| Wolf | The Guardian | Protects the pack; risk first, every trade |

- **First launch:** a hero screen with the crew art ("From the woods to the skyline"), a picker for the four characters, and a trader name.
- **Customize (Me → Customize, the camp's Look button, or tapping your avatar):**
  - **Crew color:** recolors the jacket and cap live. Teal, Crimson and Royal are free; Forest, Shadow, Violet, Rose and Sky cost 300 gems; Gold costs 800.
  - **Eyewear:** aviators, shades, heart specs.
  - **Neck:** headphones, gold chain, scarf.
  - **Pin:** flame (free), star, diamond.
  - **Nickname.**
  - Items are tagged cute or cool, and you can try them on before buying with gems.
- **Switch trader** at any time from Me.
- **Where your trader appears:** the round avatar on Home, the profile, and the league table, plus the waist-up figure standing in your camp.
- **Pip, the coach,** is the orange flame emblem from the art.
- **Art pipeline:** `assets/crew/` holds portraits and background-removed cutouts, and `scripts/build-assets.js` packs them into `js/crew-assets.js`. The cutouts come from the group image, so there's slight bleed where characters overlap. **Best next step: separate full-body art of each character on a transparent background** (front-facing works best), plus optional alternate poses for emotes.
- The earlier character concepts (soft 3D trader, Wicklings, animal crew) are archived in `docs/concepts/`. The soft 3D creator code (`js/avatar.js`) is no longer used.

## 4. The camp: from the woods to the skyline (built)

Players start in the woods with a tent and a phone hotspot, and upgrade as they trade.

| Tier | Home | Move cost |
|---|---|---|
| 1 | Woods camp: tent, campfire, log bench, phone hotspot | start |
| 2 | Base camp: bigger tent, tarp over the desk | 800 coins |
| 3 | Log cabin: lit window, porch, city lights closer | 2,500 |
| 4 | City studio: window onto the skyline | 6,000 |
| 5 | Downtown loft: brick walls, tall windows | 14,000 |
| 6 | Skyline penthouse: floor-to-ceiling glass, city below | 35,000 |

**Upgrade lines** (each home caps how far they go):

| Line | Levels | Perk |
|---|---|---|
| Screens | phone → old laptop → laptop + monitor → 2 → 3 → 4 monitors → 6-screen wall | +5% take-profit coins per level |
| Signal & bot | phone hotspot → mobile router → signal booster → satellite dish → fiber → data center link → private server | the trading bot earns 12–240 coins an hour while you're away |
| Desk | log bench → folding table → camp desk → wood → standing → glass → executive | style |
| Seat | tree stump → camp chair → … → throne | style |
| Lighting | campfire → lantern → string lights → desk lamp → LED strip → neon flame sign → skyline glow | style |
| Decor | crew flag → map board → chart posters → trophy shelf → golden bull and bear → hall of fame | style |
| Power | phone battery → power bank → solar panel → generator → grid → battery wall → fusion core | style |
| Companion | firefly jar → owl → raccoon → husky pup → hawk → phoenix | style |

Your chosen trader, in their colors, stands in the scene behind the desk. Saves from the old room carry over.

**Lifestyle (concept, not built yet):** homes and cars that unlock with Pro Account milestones. The diorama room concept is archived in `docs/concepts/`.

### Art direction decisions
- **Characters:** the crew is illustrated art. Customizing is done by recoloring and layering accessories in code. Purely AI-generated art generally can't be copyrighted in the US, so if the crew art was AI-generated, have an artist redraw or substantially rework the final versions so the characters are protectable.
- **AI or 3D art is for room items, homes and cars:**
  1. Lock one style: reference image, palette and camera angle.
  2. Generate the room shell and each item separately.
  3. Remove backgrounds.
  4. Layer the items in the game.
- **Tools already connected:** Arcads (images + background removal), ElevenLabs (images, Pip's voice, sound effects), Canva (marketing).
- **Highest-quality option:** a 3D artist building the room in Blender.
- **Prompt rules:** check each tool's commercial terms, and never use brand names such as "Fall Guys" in prompts.

## 5. Design system

- **Look:** "glassy social": frosted-glass cards over a drifting aurora, big rounded cards, pill buttons, and a floating pill tab bar.
- **Colors (crew palette, from the character art):**
  - page: night navy `#08111F`;
  - crew teal `#2A9DA0`;
  - flame orange `#E8561F → #FF9A3D` (primary buttons);
  - buy/up `#3CFFB1`;
  - sell/down `#FF4D6D`;
  - coins `#FFC94A`;
  - gems `#5BE3FF`.
- **Type:** Unbounded (display) + Plus Jakarta Sans (body).
- **App icon:** an orange flame (`#FF6411`) over a teal wick (`#29A19F`) on night navy (`#081425`). It's redrawn as a vector in `assets/icon.svg` and `mark()` in `js/icons.js`, with PNGs at 32, 180, 192, 512 and 1024 px.
- **Brand:** the lowercase "wickd" wordmark, with the icon's flame as the dot on the i over a teal stem, and the flame patch emblem on the crew jackets; Pip the coach is that flame.

## 6. Business plan

- **Goal:** $1M+ a year. That's about 8,300 paying families at $10 a month, which at a typical 4% payer rate means roughly 200,000 monthly players.
- **Revenue:** gem packs, starter pack, Wickd Club membership (with a family plan), season pass, then school and district licenses and sponsors. The full research with sources is the "Wickd Gem Monetization Plan" doc.
- **Rules we follow:**
  - No loot boxes or random rewards, and no gem-to-coin conversion.
  - Prices always in dollars, and pack sizes that match item prices.
  - Parent approval on every purchase; no one-tap buying.
  - No pressure timers or "friends bought this" nudges.
  - No ads or tracking aimed at minors; chat off by default.
- **Legal background:**
  - FTC: Epic Games 2022, HoYoverse 2025 and Apple 2014 settlements.
  - COPPA rules for under-13s.
  - App Store and Google Play billing rules.
  - The UK Children's Code and EU virtual currency principles.
  - State app store laws (Louisiana's took effect July 2026).
- **Trademarks:** check every name before launch. No exact "WICKD" mark was found, but there are sound-alike "WICKED" marks: an adult-content company's mark covering services that may overlap ours, and Universal's mark for clothing. Get an attorney to clear the name before launch.

## 7. Tech

- **Stack:** plain HTML/CSS/JavaScript with no build step, installable as an offline app, with canvas and SVG rendering. Saves live in the browser only.
- **Commands:**
  - `npm start`
  - `npm test` (scenario, market and meta test suites)
  - `npm run build:single` (one-file build)
- **Files:**
  - `js/scenarios.js`: chart engine
  - `js/market.js`: live market
  - `js/live.js`: trading, order ticket, missions
  - `js/meta.js`: leagues, kill zones, quests
  - `js/pro.js`: Pro Account
  - `js/room.js`: the camp
  - `js/crew.js`: crew picker, customizing, recolor
  - `js/crew-assets.js`: packed crew art (generated)
  - `js/gems.js`: gems and shop
  - `js/store.js`: save, economy, sounds
  - `js/app.js`: screens
- **Going native:** wrap the app with Capacitor for iOS and Android.

## 8. Next steps

1. **Final crew art:** separate full-body, transparent-background art for each character, alternate poses, and optional alternate outfits sold as gem skins.
2. **Lifestyle:** homes and garage tied to Pro Account milestones.
3. **Accounts and cloud saves,** then a real online leaderboard and friends.
4. **Real checkout:** App Store and Google Play billing with Ask to Buy and Family Link, a parent dashboard with spending limits, and the Season 1 pass.
5. **Compliance:** a neutral age gate and under-13 flow, a lawyer review of purchases, and trademark clearance for "Wickd".
6. **Beta:** 50–100 teens. Targets: day-1 retention of 40% or more and day-7 retention of 20% or more.

## 9. Challenge note (for the Grok comparison)

- **Start point:** this snapshot.
- **Keep the core:** live market, trading with stops and targets, teen audience, earn-only coins, the Wickd crew, the camp tycoon, and gems for cosmetics only.
- **Judging:**
  - **Fun:** would a 15-year-old play it daily?
  - **Learning:** do players get better at reading charts and managing risk?
  - **Look and feel.**
  - **Retention.**
  - **Monetization readiness.**
  - **Code quality and tests.**
