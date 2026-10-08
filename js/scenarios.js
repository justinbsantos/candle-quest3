/* Wickd — chart scenario engine.
 * Builds procedurally generated candlestick charts that each contain one
 * clearly-designed ICT concept, plus the question, the correct answer and
 * the annotations that explain it. Pure logic: no DOM, so it is unit-tested
 * in Node (see tests/scenarios.test.js).
 */
(function (G) {
  'use strict';

  // ---------- randomness ----------
  function RNG(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rr = (rng, a, b) => a + rng() * (b - a);
  const ri = (rng, a, b) => Math.floor(rr(rng, a, b + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  // ---------- candle path builder ----------
  // A "leg" moves price from A to B in n candles. Steps all point the same
  // way except (sometimes) one small counter-candle, and the counter-candle
  // is always followed by a bigger step, so the leg never overshoots B.
  function legDeltas(rng, n, total) {
    if (n <= 0) return [];
    const w = [];
    for (let i = 0; i < n; i++) w.push(rr(rng, 0.5, 1.5));
    if (n >= 4 && rng() < 0.7) {
      const j = ri(rng, 1, n - 3);
      w[j + 1] = Math.max(w[j + 1], 0.75);
      w[j] = -rr(rng, 0.15, 0.45);
    }
    const s = w.reduce((x, y) => x + y, 0);
    return w.map((x) => (total * x) / s);
  }

  class Path {
    constructor(rng, start) {
      this.rng = rng;
      this.c = [];
      this.p = start;
    }
    get last() { return this.c.length - 1; }
    step(d, h, l) {
      const o = this.p, c = o + d;
      const base = 0.12 + Math.abs(d) * 0.28;
      const hi = h != null ? h : Math.max(o, c) + this.rng() * base;
      const lo = l != null ? l : Math.min(o, c) - this.rng() * base;
      this.c.push({ o, c, h: hi, l: lo });
      this.p = c;
      return this.last;
    }
    to(target, n) {
      for (const d of legDeltas(this.rng, n, target - this.p)) this.step(d);
      return this.last;
    }
    // one candle with absolute close / high / low (open = previous close)
    candle(close, high, low) {
      const o = this.p;
      const h = high != null ? Math.max(high, o, close) : null;
      const l = low != null ? Math.min(low, o, close) : null;
      return this.step(close - o, h, l);
    }
  }

  function capHigh(cs, from, to, cap) {
    for (let i = Math.max(0, from); i <= Math.min(cs.length - 1, to); i++) {
      const b = Math.max(cs[i].o, cs[i].c);
      cs[i].h = Math.max(b, Math.min(cs[i].h, cap));
    }
  }
  function floorLow(cs, from, to, fl) {
    for (let i = Math.max(0, from); i <= Math.min(cs.length - 1, to); i++) {
      const b = Math.min(cs[i].o, cs[i].c);
      cs[i].l = Math.min(b, Math.max(cs[i].l, fl));
    }
  }

  // Mirror a whole scenario upside-down (bullish <-> bearish).
  const MID = 100;
  const fy = (y) => 2 * MID - y;
  function flipCandles(cs) {
    return cs.map((k) => ({ o: fy(k.o), c: fy(k.c), h: fy(k.l), l: fy(k.h) }));
  }
  function flipAnn(list) {
    return (list || []).map((a) => {
      const b = Object.assign({}, a);
      if (b.y != null) b.y = fy(b.y);
      if (b.y0 != null) { const y0 = fy(b.y0), y1 = fy(b.y1); b.y0 = Math.min(y0, y1); b.y1 = Math.max(y0, y1); }
      if (b.pos) b.pos = b.pos === 'above' ? 'below' : 'above';
      return b;
    });
  }

  // Random wandering chart used by the basics levels.
  function wander(rng, n) {
    const P = new Path(rng, 100);
    let left = n;
    while (left > 0) {
      const k = Math.min(left, ri(rng, 2, 5));
      let dir = rng() < 0.5 ? -1 : 1;
      if (P.p > 104) dir = -1;
      if (P.p < 96) dir = 1;
      P.to(P.p + dir * rr(rng, 1.5, 4), k);
      left -= k;
    }
    return P.c;
  }

  const isUp = (k) => k.c > k.o;
  const topWick = (k) => k.h - Math.max(k.o, k.c);

  function findFVGs(cs, dir, min) {
    const m = min == null ? 0.25 : min;
    const out = [];
    for (let i = 1; i < cs.length - 1; i++) {
      const a = cs[i - 1], c = cs[i + 1];
      if (dir === 'bull' ? c.l - a.h >= m : a.l - c.h >= m) out.push(i);
    }
    return out;
  }

  // ---------- scenario builders ----------
  // Each returns:
  // { kind:'tap'|'choice'|'trade', prompt, candles, visible, answers|answer,
  //   choices, annBefore, ann, explain, concept }

  const S = {};

  S.green = (rng) => {
    let cs, ans;
    do {
      cs = wander(rng, ri(rng, 16, 22));
      ans = cs.map((k, i) => (isUp(k) && k.c - k.o > 0.08 ? i : -1)).filter((i) => i >= 0);
    } while (ans.length < 3 || ans.length > cs.length - 3);
    return {
      kind: 'tap', concept: 'Bullish candle',
      prompt: 'Tap a GREEN candle 🟢 — in that candle the buyers won and price went UP!',
      candles: cs, visible: cs.length, answers: ans,
      explain: 'A green (bullish) candle CLOSES higher than it OPENS. Buyers pushed price up during that time.',
    };
  };

  S.red = (rng) => {
    let cs, ans;
    do {
      cs = wander(rng, ri(rng, 16, 22));
      ans = cs.map((k, i) => (!isUp(k) && k.o - k.c > 0.08 ? i : -1)).filter((i) => i >= 0);
    } while (ans.length < 3 || ans.length > cs.length - 3);
    return {
      kind: 'tap', concept: 'Bearish candle',
      prompt: 'Tap a RED candle 🔴 — in that candle the sellers won and price went DOWN!',
      candles: cs, visible: cs.length, answers: ans,
      explain: 'A red (bearish) candle CLOSES lower than it OPENS. Sellers pushed price down.',
    };
  };

  S.wick = (rng) => {
    const cs = wander(rng, ri(rng, 16, 20));
    const k = ri(rng, 3, cs.length - 3);
    cs[k].h = Math.max(cs[k].o, cs[k].c) + rr(rng, 2.6, 3.6);
    const mx = Math.max(...cs.map(topWick));
    const ans = cs.map((c, i) => (topWick(c) >= mx * 0.75 ? i : -1)).filter((i) => i >= 0);
    return {
      kind: 'tap', concept: 'Wicks',
      prompt: 'Tap the candle with the LONGEST WICK on top 🕯️ (the thin line sticking up).',
      candles: cs, visible: cs.length, answers: ans,
      ann: [{ t: 'mark', i: k, label: 'Long wick!', pos: 'above', color: 'gold' }],
      explain: 'The wick shows how far price TRIED to go. A long top wick means price went up, but sellers pushed it back down before the candle closed.',
    };
  };

  S.highest = (rng) => {
    const cs = wander(rng, ri(rng, 18, 22));
    const mx = Math.max(...cs.map((k) => k.h));
    const ans = cs.map((k, i) => (k.h >= mx - 0.05 ? i : -1)).filter((i) => i >= 0);
    return {
      kind: 'tap', concept: 'Highs',
      prompt: 'Tap the candle that reached the HIGHEST price on the whole chart ⬆️',
      candles: cs, visible: cs.length, answers: ans,
      ann: [{ t: 'line', y: mx, i0: 0, i1: cs.length - 1, label: 'Highest high', color: 'gold', dash: true }],
      explain: 'The top of the wick is the highest price that candle reached. Traders always watch the highest and lowest points!',
    };
  };

  function swingHighCore(rng) {
    const P = new Path(rng, rr(rng, 101.5, 102.5));
    P.to(rr(rng, 99, 100), ri(rng, 2, 3));
    const p = P.to(rr(rng, 104, 106.5), ri(rng, 5, 7));
    P.to(rr(rng, 99, 101), ri(rng, 5, 7));
    P.to(P.p + rr(rng, 0.8, 1.8), 3);
    const cs = P.c;
    cs[p].h = Math.max(...cs.map((k) => k.h)) + 0.4;
    return { cs, p };
  }
  S.swingHigh = (rng) => {
    const { cs, p } = swingHighCore(rng);
    return {
      kind: 'tap', concept: 'Swing high',
      prompt: 'Tap the SWING HIGH ⛰️ — the mountain top where price turned around and went down.',
      candles: cs, visible: cs.length, answers: [p],
      ann: [{ t: 'mark', i: p, label: 'Swing high ⛰️', pos: 'above', color: 'gold' }],
      explain: 'A swing high is a peak: the candles on both sides have lower highs. Lots of traders hide their stop orders just above swing highs.',
    };
  };
  S.swingLow = (rng) => {
    const { cs, p } = swingHighCore(rng);
    return {
      kind: 'tap', concept: 'Swing low',
      prompt: 'Tap the SWING LOW 🕳️ — the valley where price turned around and went up.',
      candles: flipCandles(cs), visible: cs.length, answers: [p],
      ann: [{ t: 'mark', i: p, label: 'Swing low 🕳️', pos: 'below', color: 'gold' }],
      explain: 'A swing low is a valley: the candles on both sides have higher lows. Stop orders often hide just below swing lows.',
    };
  };

  S.trend = (rng) => {
    const type = pick(rng, ['up', 'down', 'side']);
    const P = new Path(rng, 96);
    if (type === 'side') {
      P.p = 100;
      for (let z = 0; z < 4; z++) {
        P.to(rr(rng, 102, 103), ri(rng, 2, 4));
        P.to(rr(rng, 97, 98), ri(rng, 2, 4));
      }
    } else {
      for (let z = 0; z < 4; z++) {
        P.to(P.p + rr(rng, 3, 4.5), ri(rng, 3, 4));
        P.to(P.p - rr(rng, 1.4, 2.2), 2);
      }
      P.to(P.p + rr(rng, 1.5, 2.5), 2);
    }
    const cs = type === 'down' ? flipCandles(P.c) : P.c;
    const words = { up: 'UPTREND — higher highs and higher lows, like climbing stairs ⬆️', down: 'DOWNTREND — lower highs and lower lows, like walking down stairs ⬇️', side: 'SIDEWAYS — price bounces between a ceiling and a floor ↔️' };
    return {
      kind: 'choice', concept: 'Trend',
      prompt: 'Look at the whole chart. Which way is the market going?',
      candles: cs, visible: cs.length,
      choices: [{ id: 'up', label: '📈 Uptrend' }, { id: 'down', label: '📉 Downtrend' }, { id: 'side', label: '↔️ Sideways' }],
      answer: type,
      explain: 'This is a ' + words[type] + '.',
    };
  };

  // Equal highs -> sweep above them -> drop. (Flip = equal lows / sell-side.)
  function bslCore(rng, after) {
    const L = 104;
    const P = new Path(rng, 100);
    P.to(100 + rr(rng, 0.6, 1.4), 2);
    const a = P.to(L - rr(rng, 0.4, 0.7), ri(rng, 3, 4));
    P.to(L - rr(rng, 3, 4), ri(rng, 3, 4));
    const b = P.to(L - rr(rng, 0.4, 0.7), ri(rng, 3, 4));
    P.to(L - rr(rng, 2.6, 3.3), ri(rng, 2, 3));
    P.to(L - rr(rng, 0.8, 1.1), ri(rng, 2, 3));
    const o = P.p;
    const s = P.candle(o - rr(rng, 0.35, 0.7), L + rr(rng, 1.0, 1.6), null);
    P.c[s].l = Math.min(P.c[s].o, P.c[s].c) - rr(rng, 0.1, 0.3);
    P.to(L - rr(rng, 5.5, 7.5), after);
    const cs = P.c;
    capHigh(cs, 0, s - 1, L - 0.2);
    cs[a].h = L; cs[b].h = L;
    capHigh(cs, s + 1, cs.length - 1, L - 0.3);
    return { cs, L, a, b, s };
  }

  S.bsl = (rng) => {
    const { cs, L, a, s } = bslCore(rng, ri(rng, 4, 5));
    return {
      kind: 'tap', concept: 'Buy-side liquidity',
      prompt: 'See the two EQUAL HIGHS? 💰 Lots of stop orders hide just above them (buy-side liquidity). Tap the candle that poked above the line and grabbed them!',
      candles: cs, visible: cs.length, answers: [s],
      annBefore: [{ t: 'line', y: L, i0: a, i1: cs.length - 1, label: 'Equal highs 💰', color: 'liq', dash: true }],
      ann: [{ t: 'mark', i: s, label: 'Liquidity grab! 🧹', pos: 'above', color: 'gold' }],
      explain: 'That candle swept the buy-side liquidity: it went above the equal highs, triggered the stop orders, then closed back below. Big players often do this before price falls.',
    };
  };

  S.ssl = (rng) => {
    const { cs, L, a, s } = bslCore(rng, ri(rng, 4, 5));
    return {
      kind: 'tap', concept: 'Sell-side liquidity',
      prompt: 'See the two EQUAL LOWS? 💰 Stop orders hide just below them (sell-side liquidity). Tap the candle that dipped under the line and grabbed them!',
      candles: flipCandles(cs), visible: cs.length, answers: [s],
      annBefore: flipAnn([{ t: 'line', y: L, i0: a, i1: cs.length - 1, label: 'Equal lows 💰', color: 'liq', dash: true }]),
      ann: flipAnn([{ t: 'mark', i: s, label: 'Liquidity grab! 🧹', pos: 'above', color: 'gold' }]),
      explain: 'That candle swept the sell-side liquidity: it dipped below the equal lows, triggered the stops, then closed back above. This often happens right before price goes UP.',
    };
  };

  S.sweepPredict = (rng) => {
    const { cs, L, a, s } = bslCore(rng, ri(rng, 6, 8));
    const bear = rng() < 0.5; // bear = buy-side sweep -> price falls
    const sc = bear ? cs : flipCandles(cs);
    const annB = [
      { t: 'line', y: L, i0: a, i1: cs.length - 1, label: bear ? 'Buy-side liquidity 💰' : 'Sell-side liquidity 💰', color: 'liq', dash: true },
      { t: 'mark', i: s, label: 'Sweep 🧹', pos: 'above', color: 'gold' },
    ];
    return {
      kind: 'choice', concept: 'Liquidity sweep',
      prompt: bear
        ? 'Price just poked ABOVE the equal highs, grabbed the buy-side liquidity 🧹 and snapped back down. Where will price probably go next?'
        : 'Price just dipped BELOW the equal lows, grabbed the sell-side liquidity 🧹 and snapped back up. Where will price probably go next?',
      candles: sc, visible: s + 2,
      annBefore: bear ? annB : flipAnn(annB),
      choices: [{ id: 'up', label: '⬆️ Up' }, { id: 'down', label: '⬇️ Down' }],
      answer: bear ? 'down' : 'up',
      explain: bear
        ? 'After grabbing liquidity ABOVE the highs, price often reverses DOWN. The stop orders gave big players the fuel to sell.'
        : 'After grabbing liquidity BELOW the lows, price often reverses UP. The stop orders gave big players the fuel to buy.',
    };
  };

  // Bullish fair value gap: candle A, big candle B, candle C with C.low > A.high
  function fvgCore(rng) {
    const P = new Path(rng, rr(rng, 97.5, 98.5));
    P.to(rr(rng, 100.5, 101.5), ri(rng, 3, 4));
    P.to(P.p - rr(rng, 1, 2), ri(rng, 2, 3));
    P.to(P.p + rr(rng, 0.4, 1), 2);
    const base = P.p;
    const ac = base + rr(rng, 0.15, 0.35);
    const A = P.candle(ac, Math.max(base, ac) + rr(rng, 0.15, 0.3), Math.min(base, ac) - rr(rng, 0.2, 0.4));
    const bo = P.p;
    const bc = bo + rr(rng, 3.6, 4.6);
    const B = P.candle(bc, bc + rr(rng, 0.1, 0.3), bo - rr(rng, 0.05, 0.2));
    const cc = bc + rr(rng, 0.6, 1.2);
    const gapLo = P.c[A].h;
    const gapHi = gapLo + rr(rng, 0.9, 1.4);
    const C = P.candle(cc, cc + rr(rng, 0.2, 0.4), gapHi);
    return { P, A, B, C, gapLo, gapHi };
  }

  function fvgTapScenario(rng, bear) {
    const { P, A, B, C, gapLo, gapHi } = fvgCore(rng);
    P.to(P.p + rr(rng, 1, 2), 3);
    P.to(P.p + rr(rng, -0.8, 0.3), ri(rng, 2, 4));
    const cs = P.c;
    floorLow(cs, C + 1, cs.length - 1, gapHi + 0.2);
    const out = bear ? flipCandles(cs) : cs;
    const ans = findFVGs(out, bear ? 'bear' : 'bull');
    const ann = [{ t: 'box', i0: A, i1: cs.length - 1, y0: gapLo, y1: gapHi, label: 'Fair Value Gap', color: 'gap' },
      { t: 'mark', i: B, label: 'Big candle', pos: 'below', color: 'gold' }];
    return {
      kind: 'tap', concept: bear ? 'Bearish FVG' : 'Bullish FVG',
      prompt: bear
        ? 'Find the FAIR VALUE GAP 🕳️! Tap the BIG red candle that moved so fast it left a gap between the candles on each side.'
        : 'Find the FAIR VALUE GAP 🕳️! Tap the BIG green candle that moved so fast it left a gap between the candles on each side.',
      candles: out, visible: cs.length, answers: ans,
      ann: bear ? flipAnn(ann) : ann,
      explain: 'A Fair Value Gap is a hole made by a super-fast candle: the wicks of the candles before and after it do not touch. Price moved too fast to be "fair", so it often comes back to the gap later.',
      _designed: B,
    };
  }
  S.fvgBull = (rng) => fvgTapScenario(rng, false);
  S.fvgBear = (rng) => fvgTapScenario(rng, true);

  S.fvgPredict = (rng) => {
    const { P, A, C, gapLo, gapHi } = fvgCore(rng);
    P.to(P.c[C].c + rr(rng, 1.5, 2.5), 3);
    const v = P.to(gapHi + rr(rng, 0.3, 0.6), 3);
    floorLow(P.c, C + 1, v, gapHi + 0.15);
    const o = P.p;
    const hammerLow = gapLo + (gapHi - gapLo) * rr(rng, 0.3, 0.6);
    const hc = o + rr(rng, 0.2, 0.5);
    P.candle(hc, hc + rr(rng, 0.05, 0.2), hammerLow);
    const h2 = P.to(P.p + rr(rng, 4, 6), ri(rng, 5, 6));
    const cs = P.c;
    floorLow(cs, v + 2, h2, gapHi);
    const bear = rng() < 0.5;
    const annB = [{ t: 'box', i0: A, i1: cs.length - 1, y0: gapLo, y1: gapHi, label: 'Fair Value Gap', color: 'gap' }];
    return {
      kind: 'choice', concept: 'FVG reaction',
      prompt: bear
        ? 'Price is climbing back up into the Fair Value Gap 🕳️. What do traders expect it to do there?'
        : 'Price is dropping back down into the Fair Value Gap 🕳️. What do traders expect it to do there?',
      candles: bear ? flipCandles(cs) : cs, visible: v + 1,
      annBefore: bear ? flipAnn(annB) : annB,
      choices: bear
        ? [{ id: 'react', label: '⬇️ Turn back down from the gap' }, { id: 'through', label: '⬆️ Blast right through it' }]
        : [{ id: 'react', label: '⬆️ Bounce up from the gap' }, { id: 'through', label: '⬇️ Fall right through it' }],
      answer: 'react',
      explain: 'Price often comes back to "fill" a Fair Value Gap and then keeps going the way the big candle went. Not every time — that is why real traders always use a stop loss!',
    };
  };

  function obScenario(rng, bear) {
    const P = new Path(rng, 102);
    const sh = P.to(rr(rng, 104, 105), 3);
    const K = P.to(rr(rng, 99.5, 100.5), ri(rng, 4, 5));
    P.to(P.c[sh].h + rr(rng, 1.6, 2.6), 3);
    P.to(P.p + rr(rng, -1, 0.4), 2);
    P.to(P.p + rr(rng, 1, 2), 2);
    const cs = P.c;
    const ann = [{ t: 'box', i0: K, i1: cs.length - 1, y0: cs[K].l, y1: cs[K].h, label: 'Order Block 🧱', color: 'ob' }];
    return {
      kind: 'tap', concept: bear ? 'Bearish order block' : 'Bullish order block',
      prompt: bear
        ? 'Find the ORDER BLOCK 🧱! Tap the LAST GREEN candle right before price fell down hard.'
        : 'Find the ORDER BLOCK 🧱! Tap the LAST RED candle right before price shot up hard.',
      candles: bear ? flipCandles(cs) : cs, visible: cs.length, answers: [K],
      ann: bear ? flipAnn(ann) : ann,
      explain: bear
        ? 'The order block is the last up candle before a big drop. Big players placed their sell orders there, so price often reacts when it comes back to it.'
        : 'The order block is the last down candle before a big rally. Big players placed their buy orders there, so price often reacts when it comes back to it.',
    };
  }
  S.obBull = (rng) => obScenario(rng, false);
  S.obBear = (rng) => obScenario(rng, true);

  function mssCore(rng) {
    const P = new Path(rng, 107);
    P.to(rr(rng, 102.5, 103.5), ri(rng, 3, 4));
    const hs = P.to(rr(rng, 104.3, 104.8), ri(rng, 2, 3));
    const H = P.c[hs].c + rr(rng, 0.2, 0.4);
    P.c[hs].h = H;
    P.to(rr(rng, 99.5, 100.5), ri(rng, 4, 5));
    P.to(H - rr(rng, 1.2, 1.8), ri(rng, 2, 3));
    const bo = P.p, bc = H + rr(rng, 0.8, 1.4);
    const brk = P.candle(bc, bc + 0.2, bo - 0.1);
    P.to(P.p + rr(rng, 1, 2), 2);
    P.to(P.p + rr(rng, -0.8, 0), 2);
    capHigh(P.c, hs + 1, brk - 1, H - 0.15);
    return { cs: P.c, H, hs, brk };
  }
  S.mss = (rng) => {
    const { cs, H, hs } = mssCore(rng);
    const bear = rng() < 0.5;
    const out = bear ? flipCandles(cs) : cs;
    let ans = -1;
    for (let i = hs + 1; i < out.length; i++) {
      if (bear ? out[i].c < fy(H) : out[i].c > H) { ans = i; break; }
    }
    const annB = [{ t: 'line', y: H, i0: hs, i1: cs.length - 1, label: bear ? 'Last swing low' : 'Last swing high', color: 'liq', dash: true }];
    return {
      kind: 'tap', concept: 'Market structure shift',
      prompt: bear
        ? 'The market was going UP. Tap the FIRST candle that CLOSED below the last swing low line ⚡ — that is a Market Structure Shift!'
        : 'The market was going DOWN. Tap the FIRST candle that CLOSED above the last swing high line ⚡ — that is a Market Structure Shift!',
      candles: out, visible: cs.length, answers: [ans],
      annBefore: bear ? flipAnn(annB) : annB,
      ann: [{ t: 'mark', i: ans, label: 'MSS ⚡', pos: bear ? 'below' : 'above', color: 'gold' }],
      explain: bear
        ? 'When price closes below the last swing low, the trend may be changing from UP to DOWN. Traders call this a Market Structure Shift.'
        : 'When price closes above the last swing high, the trend may be changing from DOWN to UP. Traders call this a Market Structure Shift.',
    };
  };

  // Full ICT model: equal highs (target) -> drop -> sell-side sweep ->
  // displacement with FVG that breaks structure -> retrace into FVG -> entry.
  function tradeCore(rng) {
    const T = 106;
    const P = new Path(rng, 102.5);
    const a1 = P.to(T - rr(rng, 0.4, 0.6), ri(rng, 3, 4));
    P.to(rr(rng, 102.5, 103.5), ri(rng, 2, 3));
    const a2 = P.to(T - rr(rng, 0.4, 0.6), ri(rng, 3, 4));
    const Lw = 100;
    const pl = P.to(Lw + rr(rng, 0.35, 0.5), ri(rng, 4, 5));
    P.c[pl].l = Lw;
    const hs = P.to(rr(rng, 101.8, 102.2), ri(rng, 2, 3));
    const H = P.c[hs].c + 0.3;
    P.c[hs].h = H;
    P.to(Lw + rr(rng, 0.5, 0.8), ri(rng, 2, 3));
    const so = P.p;
    const sc = Lw + rr(rng, 0.7, 1.0);
    const s = P.candle(sc, Math.max(so, sc) + 0.15, Lw - rr(rng, 0.9, 1.3));
    const S0 = P.c[s].l;
    const ao = P.p, ac = ao + rr(rng, 0.1, 0.3);
    const A = P.candle(ac, ac + rr(rng, 0.1, 0.2), ao - 0.15);
    const bo = P.p, bc = H + rr(rng, 0.8, 1.3);
    const B = P.candle(bc, bc + 0.15, bo - 0.1);
    const gapLo = P.c[A].h, gapHi = gapLo + rr(rng, 0.7, 1.0);
    const cc = bc + rr(rng, 0.4, 0.8);
    const C = P.candle(cc, cc + 0.3, gapHi);
    P.to(P.p + rr(rng, 0.8, 1.4), 2);
    const v = P.to(gapHi + rr(rng, 0.1, 0.3), ri(rng, 2, 3));
    P.c[v].l = gapLo + (gapHi - gapLo) * 0.4;
    const end = P.to(T + rr(rng, 0.4, 0.8), ri(rng, 6, 8));
    const cs = P.c;
    capHigh(cs, 0, a1 - 1, T - 0.2);
    capHigh(cs, a1 + 1, a2 - 1, T - 0.2);
    cs[a1].h = T; cs[a2].h = T;
    capHigh(cs, a2 + 1, v, T - 0.3);
    floorLow(cs, 0, pl - 1, Lw + 0.15);
    floorLow(cs, pl + 1, s - 1, Lw + 0.15);
    floorLow(cs, C + 1, v - 1, gapHi + 0.1);
    floorLow(cs, v + 1, end, gapLo);
    return { cs, T, a1, a2, s, S0, A, B, C, gapLo, gapHi, v, Lw, pl, H, hs };
  }

  // Episodes for the LIVE market. Prices are relative; the market shifts them
  // so each episode starts where the previous one ended.
  function episode(rng, opts) {
    opts = opts || {};
    if (opts.kind === 'filler') {
      const P = new Path(rng, 100);
      const n = ri(rng, 2, 3);
      for (let k = 0; k < n; k++) P.to(P.p + (rng() < 0.5 ? -1 : 1) * rr(rng, 1.2, 3), ri(rng, 2, 5));
      return { candles: P.c, meta: null };
    }
    const d = tradeCore(rng);
    let cs = d.cs;
    if (opts.fail) {
      cs = cs.slice(0, d.v + 1);
      const P = new Path(rng, cs[d.v].c);
      P.c = cs;
      P.to(d.S0 - rr(rng, 1.2, 2), ri(rng, 4, 5));
      P.to(P.p + rr(rng, -1, 1), ri(rng, 3, 4));
      cs = P.c;
    }
    const m = {
      dir: 'buy', a1: d.a1, a2: d.a2, sweep: d.s, mss: d.B, fvgA: d.A, fvgC: d.C, entry: d.v,
      gapLo: d.gapLo, gapHi: d.gapHi, target: d.T, stop: d.S0 - 0.25, swept: d.Lw, fail: !!opts.fail,
    };
    if (opts.bear) {
      cs = flipCandles(cs);
      Object.assign(m, { dir: 'sell', gapLo: fy(d.gapHi), gapHi: fy(d.gapLo), target: fy(d.T), stop: fy(d.S0 - 0.25), swept: fy(d.Lw) });
    }
    return { candles: cs, meta: m };
  }

  S.trade = (rng) => {
    const d = tradeCore(rng);
    const bear = rng() < 0.5;
    const cs = d.cs;
    const entry = cs[d.v].c, stop = d.S0 - 0.25, target = d.T;
    const annB = [
      { t: 'line', y: d.T, i0: d.a1, i1: cs.length - 1, label: 'Equal highs 💰', color: 'liq', dash: true },
      { t: 'box', i0: d.A, i1: cs.length - 1, y0: d.gapLo, y1: d.gapHi, label: 'FVG', color: 'gap' },
    ];
    const ann = [
      { t: 'mark', i: d.s, label: 'Sweep 🧹', pos: 'below', color: 'gold' },
      { t: 'mark', i: d.B, label: 'MSS ⚡', pos: 'above', color: 'gold' },
      { t: 'line', y: target, i0: d.v, i1: cs.length - 1, label: '🎯 Target', color: 'good' },
      { t: 'line', y: stop, i0: d.v, i1: cs.length - 1, label: '🛑 Stop', color: 'bad' },
      { t: 'line', y: entry, i0: d.v, i1: cs.length - 1, label: 'Entry', color: 'info', dash: true },
    ];
    const f = (a) => (bear ? flipAnn(a) : a);
    return {
      kind: 'trade', concept: 'Full trade setup',
      prompt: bear
        ? 'BOSS SETUP! Price swept the highs 🧹, crashed down breaking structure ⚡, left a Fair Value Gap, and came back up into it. The 💰 equal lows below are the target. Buy or Sell?'
        : 'BOSS SETUP! Price swept the lows 🧹, shot up breaking structure ⚡, left a Fair Value Gap, and came back down into it. The 💰 equal highs above are the target. Buy or Sell?',
      candles: bear ? flipCandles(cs) : cs, visible: d.v + 1,
      annBefore: f(bear ? annB.map((a) => (a.label === 'Equal highs 💰' ? Object.assign({}, a, { label: 'Equal lows 💰' }) : a)) : annB),
      ann: f(ann),
      choices: [{ id: 'buy', label: '🟢 BUY (price goes up)' }, { id: 'sell', label: '🔴 SELL (price goes down)' }],
      answer: bear ? 'sell' : 'buy',
      trade: bear
        ? { dir: 'sell', entry: fy(entry), stop: fy(stop), target: fy(target) }
        : { dir: 'buy', entry, stop, target },
      explain: bear
        ? 'Sweep the highs ➜ break down ➜ come back into the gap ➜ SELL, with a stop above the sweep and a target at the equal lows. That is the full setup!'
        : 'Sweep the lows ➜ break up ➜ come back into the gap ➜ BUY, with a stop below the sweep and a target at the equal highs. That is the full setup!',
    };
  };

  // ---------- public API ----------
  let counter = 0;
  function generate(key, seed) {
    const fn = S[key];
    if (!fn) throw new Error('Unknown scenario ' + key);
    const s = seed != null ? seed : (Date.now() ^ (++counter * 2654435761)) >>> 0;
    const sc = fn(RNG(s));
    sc.key = key;
    sc.seed = s;
    sc.annBefore = sc.annBefore || [];
    sc.ann = sc.ann || [];
    return sc;
  }

  G.CQScenarios = { generate, keys: Object.keys(S), findFVGs, RNG, episode };
})(typeof window !== 'undefined' ? window : globalThis);
