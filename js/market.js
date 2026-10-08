/* Candle Quest — live market simulator.
 * Streams an endless chart made of "episodes": random filler moves and full
 * ICT setups (liquidity -> sweep -> MSS + FVG -> retrace -> target), some of
 * which fail. Each setup carries metadata so the game can coach the player
 * and grade entries. Pure logic (no DOM); tested in tests/market.test.js.
 */
(function (G) {
  'use strict';
  const { RNG, episode } = G.CQScenarios;

  class Market {
    constructor(seed, opts) {
      this.rng = RNG(seed >>> 0);
      this.opts = Object.assign({ setupRate: 0.75, failRate: 0.15 }, opts || {});
      this.candles = [];   // finished candles
      this.queue = [];     // future candles (not visible to the player)
      this.setups = [];
      this.lastFiller = false;
      this._ensure(80);
    }

    get nextIndex() { return this.candles.length; }

    _lastClose() {
      if (this.queue.length) return this.queue[this.queue.length - 1].c;
      if (this.candles.length) return this.candles[this.candles.length - 1].c;
      return 100;
    }

    _episode() {
      const r = this.rng;
      const base = this.candles.length + this.queue.length;
      const last = this._lastClose();
      const setup = this.lastFiller ? true : r() < this.opts.setupRate;
      // keep price in a friendly band
      let bear = r() < 0.5;
      if (last > 135) bear = true;
      if (last < 65) bear = false;
      const ep = episode(r, { kind: setup ? 'setup' : 'filler', bear, fail: r() < this.opts.failRate });
      const shift = last - ep.candles[0].o;
      ep.candles.forEach((k) => this.queue.push({ o: k.o + shift, c: k.c + shift, h: k.h + shift, l: k.l + shift }));
      this.lastFiller = !setup;
      if (ep.meta) {
        const m = ep.meta;
        const s = {
          id: base, dir: m.dir, fail: m.fail, state: 'pending',
          a1: base + m.a1, a2: base + m.a2, sweep: base + m.sweep, mss: base + m.mss,
          fvgA: base + m.fvgA, fvgC: base + m.fvgC, entry: base + m.entry,
          gapLo: m.gapLo + shift, gapHi: m.gapHi + shift,
          target: m.target + shift, stop: m.stop + shift, swept: m.swept + shift,
          end: base + ep.candles.length - 1, resolvedAt: null,
        };
        this.setups.push(s);
      }
    }

    _ensure(n) { while (this.queue.length < n) this._episode(); }

    // Move n candles into history instantly (so the chart starts full).
    warmUp(n) {
      for (let i = 0; i < n; i++) this.candles.push(this.take());
      this.setups.forEach((s) => { if (s.fvgC < this.candles.length + 2) s.state = 'old'; });
    }

    // Next candle to be formed (caller pushes it into this.candles when done).
    take() {
      this._ensure(60);
      return this.queue.shift();
    }

    finish(candle) { this.candles.push(candle); }
  }

  // Tick path inside one candle: open -> first extreme -> second extreme -> close.
  // Bullish candles usually dip first, bearish ones usually spike first.
  function tickPath(c, n, rng) {
    const up = c.c >= c.o;
    const flipOrder = rng() < 0.2;
    const lowFirst = up ? !flipOrder : flipOrder;
    const e1 = lowFirst ? c.l : c.h, e2 = lowFirst ? c.h : c.l;
    const i1 = Math.max(1, Math.round(n * (0.15 + rng() * 0.25)));
    const i2 = Math.min(n - 1, Math.max(i1 + 1, Math.round(n * (0.55 + rng() * 0.25))));
    const anchors = [[0, c.o], [i1, e1], [i2, e2], [n, c.c]];
    const out = [];
    const amp = (c.h - c.l) * 0.12;
    for (let i = 0; i <= n; i++) {
      let k = 0;
      while (k < anchors.length - 2 && i > anchors[k + 1][0]) k++;
      const [x0, y0] = anchors[k], [x1, y1] = anchors[k + 1];
      const t = (i - x0) / Math.max(1, x1 - x0);
      let p = y0 + (y1 - y0) * t;
      if (i !== x0 && i !== x1) p += (rng() * 2 - 1) * amp * Math.sin(Math.PI * t);
      out.push(Math.min(c.h, Math.max(c.l, p)));
    }
    anchors.forEach(([i, y]) => { out[i] = y; });
    return out;
  }

  G.CQMarket = { Market, tickPath };
})(typeof window !== 'undefined' ? window : globalThis);
