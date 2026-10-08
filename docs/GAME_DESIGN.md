# Candle Quest — Game Design Notes

## Core idea
Kids learn chart reading the way they learn any mobile game: short levels, instant feedback, stars, coins and unlocks. The learning content follows the ICT (Inner Circle Trader) path from basics to a full trade model.

## The learning path
1. **Read the candle** — body, wick, open/close, bullish/bearish, highs.
2. **Read the structure** — swing highs/lows, trend.
3. **Find the liquidity** — equal highs/lows = resting stop orders; sweeps.
4. **Find the imbalance** — Fair Value Gaps and how price returns to them.
5. **Find the institutions' footprint** — order blocks, market structure shift.
6. **Put it together** — sweep ➜ MSS with displacement ➜ retrace into FVG ➜ entry, stop beyond the sweep, target at opposing liquidity.

## How charts are made
`js/scenarios.js` builds each chart from "legs" (moves from price A to B over N candles), then places the concept deliberately (e.g. two equal highs, then a single candle that wicks above them and closes back below). Every scenario returns the correct answer computed from the data, and `tests/scenarios.test.js` checks 400 random charts per type to prove:
- every candle is valid (high ≥ body ≥ low, opens at the previous close)
- the answer is truly correct (the sweep is the *only* candle beyond the line, the FVG detector finds the designed gap, the trade hits target before stop, the target liquidity is untouched before the entry, …)

Bullish and bearish versions come from mirroring the same construction, so both sides are always equally represented.

## Economy
| Action | Coins / XP |
|---|---|
| Correct answer (level) | +10 |
| Winning boss trade | +30 |
| Correct answer (practice) | +5 |
| Level clear | +15 per star, +25 first clear |
| Daily treasure | 20 + 10 × streak (max 7) |

Player level n requires 50·n·(n−1) XP. Passing a level needs 60% correct; 3 stars = no mistakes.

## Roadmap ideas
- **Kill-zone timer rounds** (London / New York sessions) with a real clock on the chart
- **Replay mode** on real historical candles (licensed data) once kids finish World 6
- **Parent dashboard** + optional cloud save (needs COPPA-compliant consent)
- **Leagues** — weekly leaderboard with nicknames only
- **More mascots & seasonal events** to drive daily return
- **Voice-over** for early readers (ElevenLabs)
- **Native wrap** with Capacitor for App Store / Google Play
