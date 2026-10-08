# Wickd — Project State

*Snapshot: October 8, 2026 · GitHub: justinbsantos/candle-quest3 (`main`)*

Everything built and decided so far, in one place. **The final character and room designs are still TBA.** The game ships with working placeholder versions, and the concepts we are choosing between are in `docs/concepts/`.

---

## 1. What Wickd is

A mobile game for teens (13–17) where you trade a live practice market, learn to read price like a pro, earn coins for good trades, and grow from a run-down tiny room to a penthouse.

- **Audience:** teens 13–17, girls and boys equally. Parents are the paying customer.
- **What it teaches:**
  - **How price moves:** candles, swing highs and lows, liquidity, sweeps, fair value gaps, market structure shifts, and the full setup (sweep → structure shift with a gap → entry on the retrace → stop beyond the sweep → target at the opposite liquidity).
  - **Risk management above all:** every trade has a stop, and a small risk per trade is how an account survives and compounds.
- **Tone:** a real, fun mobile game first and education second. It should feel premium, not childish.
- **Money is play money.** Coins are earned only and can never be bought or cashed out.
- **Branding:** "ICT" is a third party's term, so it is never used in marketing or in the game. The game uses the generic concept names.

## 2. What's built and playable today

The bottom tab bar has five areas: **Home · Trade · League · My room · Me**. The top bar shows **gems** (tap it for the gem shop) and **coins**.

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

### My room (current placeholder, final design TBA)
- **Six homes:** Bedroom → Garage studio → Downtown office → Skyscraper floor → Penthouse → Moon base.
- **Eight upgrade lines:**
  - **Screens:** +5% take-profit coins per level.
  - **Trading bot:** earns 12–240 coins an hour, up to 8 hours.
  - **Cosmetic:** desk, chair, lights, decor, plant, pet.
- The room is drawn live, with your character at the desk.

### Me
- **Profile:** your full-body character, an Edit my look button, the gem shop, stats, 29 badges, sound settings and a "For grown-ups" note.
- **Character creator (current placeholder, final design TBA):** a soft 3D character. It already has the full system: tabs, colors, free and gem-priced items, try-on before buying, and shuffle.

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

## 3. Character: concepts (TBA)

Concept files and previews are in `docs/concepts/`, and live versions are on the design board in Claude.

| Concept | Idea | Status |
|---|---|---|
| Soft 3D trader | Chibi human, full outfits, skin tones | Built into the game as the placeholder |
| Wicklings | Squishy capsule bodies (party-game style), costume halves, emotes, a candle flame on top | Concept |
| **Animal crew** (latest) | Same squishy body as 8 animals: Bull, Bear, Wolf, Fox, Frog, Cat, Bunny, Panda | **Leading direction, not final** |

**Animal crew details (`animal-crew.png`):**
- **Bull and Bear come first:** in trading, bulls bet prices go up and bears bet they go down, so picking your animal is a lesson and a team identity.
- **Cute / Cool / Both vibe switch:** filters items so everyone can find their style; mixing is always allowed.
  - **Cute:** bows, bucket hat, puffer, skirt, overalls, hearts and dots, pastels.
  - **Cool:** shades, "locked in" eyes, cap, beanie, headphones, hoodie, varsity jacket, lightning patterns, deep colors.
  - **Both:** the Crown and Gold flame, which are league rewards.
- **Customization:** fur color and patterns (including a candlestick pattern), eyes, mouth, top, bottom and headwear. The "Wick flame" is an accessory.
- **Emotes:** idle wobble, wave, jump, dance.
- **Presets:** Bull run, Bear market, Night wolf, Sakura bunny, Boba panda, Matcha frog, Gold fox.

## 4. Home and room: concepts (TBA)

| Concept | Idea | Status |
|---|---|---|
| Canvas bedroom | Side-view room with 6 home tiers | Built into the game as the placeholder |
| **Diorama room** (latest) | Isometric cutaway "dollhouse" room, based on Justin's reference image | **Leading direction, not final** |
| Lifestyle: home & garage | Homes and cars that unlock as the Pro Account grows | Concept |

**Diorama room: start small and broke, then upgrade (`room-progression.png`):**
- **Homes:** Tiny room (6×6) → Bedroom (8×8) → Studio apartment (10×10) → loft, house, villa, penthouse.
- **The start is deliberately rough:** grey walls, cracked concrete, a water stain, a taped-up poster, a mattress on the floor, an old laptop on a cardboard box, a milk-crate seat and one bare bulb.
- **Upgrade lines, each with a gameplay perk:**
  - **Screens:** laptop → 1 monitor → dual screens + PC → triple curved + RGB desk. +5% take-profit coins per level.
  - **Lighting:** bulb → desk lamp → hex LEDs → full neon. Kill zone bonus from level 2.
  - **Seating:** crate → bean bags → gaming chair. A streak freeze slot from level 2.
  - **Media wall:** TV console → TV wall + shelves. Needs the Bedroom.
- **Each home caps how far upgrades can go,** so moving up is the goal.
- **Themes:** Midnight, Cozy, Clean.

**Lifestyle (concept):**
- **Two kinds of progress:** coins buy your trading setup, while homes and cars unlock by growing your Pro Account. That ties the lifestyle to disciplined compounding.
- **Homes:** Bedroom → Studio apartment ($2k) → City loft ($10k) → Family house ($50k) → Beach villa ($250k) → Sky penthouse ($1M).
- **Cars:** e-scooter → city hatch ($5k) → sport coupe ($25k) → hyper GT ($250k).
- Car designs are made up, with no real brands. Gems can buy paint but never the car itself.

### Art direction decisions
- **Characters stay drawn in code from layered vector parts.** Every combination works, it animates, files are tiny, and it's human-authored. Purely AI-generated art generally can't be copyrighted in the US, so the mascot should be human-made.
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
- **Colors:**
  - page `#0B0920`;
  - brand gradient `#7C5CFF → #FF4FD8`;
  - buy/up `#3CFFB1`;
  - sell/down `#FF4D6D`;
  - coins `#FFC94A`;
  - gems `#5BE3FF`.
- **Type:** Unbounded (display) + Plus Jakarta Sans (body).
- **Brand:** the lowercase "wickd" wordmark with a flame on the i; Pip the coach is a glowing orb.

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
  - `js/room.js`: room
  - `js/avatar.js`: character
  - `js/gems.js`: gems and shop
  - `js/store.js`: save, economy, sounds
  - `js/app.js`: screens
- **Going native:** wrap the app with Capacitor for iOS and Android.

## 8. Next steps

1. **Pick the final character and room:** animal crew plus diorama room are leading. Build them into the game in place of the placeholders.
2. **Lifestyle:** homes and garage tied to Pro Account milestones.
3. **Accounts and cloud saves,** then a real online leaderboard and friends.
4. **Real checkout:** App Store and Google Play billing with Ask to Buy and Family Link, a parent dashboard with spending limits, and the Season 1 pass.
5. **Compliance:** a neutral age gate and under-13 flow, a lawyer review of purchases, and trademark clearance for "Wickd".
6. **Beta:** 50–100 teens. Targets: day-1 retention of 40% or more and day-7 retention of 20% or more.

## 9. Challenge note (for the Grok comparison)

- **Start point:** this snapshot.
- **Keep the core:** live market, trading with stops and targets, teen audience, earn-only coins, the room tycoon, and gems for cosmetics only.
- **Judging:**
  - **Fun:** would a 15-year-old play it daily?
  - **Learning:** do players get better at reading charts and managing risk?
  - **Look and feel.**
  - **Retention.**
  - **Monetization readiness.**
  - **Code quality and tests.**
