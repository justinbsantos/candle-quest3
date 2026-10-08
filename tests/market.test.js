/* Run: node tests/market.test.js — checks the live market stream. */
'use strict';
require('../js/scenarios.js');
require('../js/market.js');
const { Market, tickPath } = globalThis.CQMarket;
const { RNG } = globalThis.CQScenarios;

let fails = 0;
const fail = (m) => { fails++; if (fails < 30) console.log('FAIL', m); };

for (let seed = 1; seed <= 150; seed++) {
  const mk = new Market(seed * 7717);
  mk.warmUp(30);
  for (let i = 0; i < 600; i++) mk.finish(mk.take());
  const cs = mk.candles;
  cs.forEach((k, i) => {
    if (k.h + 1e-9 < Math.max(k.o, k.c) || k.l - 1e-9 > Math.min(k.o, k.c)) fail(`seed ${seed} bad candle ${i}`);
    if (i && Math.abs(k.o - cs[i - 1].c) > 1e-6) fail(`seed ${seed} gap at ${i}`);
    if (k.l <= 0) fail(`seed ${seed} non-positive price`);
  });
  for (const s of mk.setups) {
    if (s.end >= cs.length) continue;
    const buy = s.dir === 'buy';
    // the entry candle trades inside the gap
    const e = cs[s.entry];
    if (buy ? !(e.l <= s.gapHi && e.l >= s.gapLo) : !(e.h >= s.gapLo && e.h <= s.gapHi)) fail(`seed ${seed} entry candle not in gap`);
    // after entry: target first (win) or stop first (fail)
    let hitT = -1, hitS = -1;
    for (let i = s.entry + 1; i <= s.end; i++) {
      const k = cs[i];
      if (hitT < 0 && (buy ? k.h >= s.target : k.l <= s.target)) hitT = i;
      if (hitS < 0 && (buy ? k.l <= s.stop : k.h >= s.stop)) hitS = i;
    }
    if (s.fail) { if (hitS < 0 || (hitT >= 0 && hitT < hitS)) fail(`seed ${seed} failing setup did not stop out`); }
    else if (hitT < 0 || (hitS >= 0 && hitS <= hitT)) fail(`seed ${seed} winning setup did not hit target first`);
    if (buy ? !(s.stop < s.gapLo && s.gapHi < s.target) : !(s.stop > s.gapHi && s.gapLo > s.target)) fail(`seed ${seed} level order`);
  }
}

const rng = RNG(42);
for (let t = 0; t < 2000; t++) {
  const o = 100, c = 100 + (rng() * 4 - 2);
  const k = { o, c, h: Math.max(o, c) + rng(), l: Math.min(o, c) - rng() };
  const p = tickPath(k, 14, rng);
  if (p[0] !== k.o || p[p.length - 1] !== k.c) fail('path ends');
  if (Math.max(...p) !== k.h || Math.min(...p) !== k.l) fail('path extremes');
}

if (fails) { console.log(fails + ' failure(s)'); process.exit(1); }
console.log('Market OK: 150 markets x 630 candles, setups behave, tick paths valid.');
