/* Wickd — LIVE trading: a moving market, BUY/SELL, draggable TP/SL,
 * coins for take-profits, bonus coins for clean ICT entries, coach Pip.
 */
(function () {
  'use strict';
  const { Market, tickPath } = window.CQMarket;
  const { RNG } = window.CQScenarios;
  const Store = window.CQStore;
  const S = Store.state;
  const { owlSVG } = window.CQMascot;
  const UI = () => window.CQUI;
  const { ic, coin } = window.CQIcons;
  const C = { gap: '#4FA8FF', liq: '#B18CFF', up: '#2EE6A6', down: '#FF5C7A', gold: '#FFC94A', entry: '#9A8CC2' };
  const inkOn = (col) => (col === C.up || col === C.gold ? '#0B2A20' : '#fff');
  const starRow = (n, cls) => `<span class="${cls || 'stars'}">${[0, 1, 2].map((k) => ic('star', k < n ? 'on' : '')).join('')}</span>`;

  const TICKS = 14;
  const VIEW = 34;
  const ASSETS = ['🍌 BANANA/USD', '🚀 ROCKET', '🥇 GOLD', '🐉 DRAGON COIN', '🍕 PIZZA INC', '🦖 DINO/USD', '🍩 DONUT CO'];

  // hints: 2 = training wheels, 1 = pro (markers only), 0 = master (nothing)
  const MISSIONS = [
    { id: 'm1', name: 'First Take Profit', icon: '🎯', goal: { tp: 1 }, hints: 2, speed: 1400, candles: 80, fail: 0, text: 'Hit your first take profit. Pip calls the entry, you take the trade.' },
    { id: 'm2', name: 'Double Up', icon: '✌️', goal: { tp: 2 }, hints: 2, speed: 1250, candles: 110, fail: 0.1, text: 'Hit 2 Take Profits in one session.' },
    { id: 'm3', name: 'Coin Hunter', icon: '🪙', goal: { coins: 40 }, hints: 2, speed: 1200, candles: 110, fail: 0.1, text: 'Finish the session at least +40 coins up.' },
    { id: 'm4', name: 'Gap Sniper', icon: '🌟', goal: { perfect: 1 }, hints: 1, speed: 1150, candles: 110, fail: 0.1, text: 'Win a trade with a PERFECT entry: in the gap, after the sweep and MSS. Fewer hints now!' },
    { id: 'm5', name: 'Steady Hands', icon: '🧘', goal: { tp: 2, maxSL: 1 }, hints: 1, speed: 1100, candles: 120, fail: 0.15, text: 'Hit 2 Take Profits and get stopped out no more than once.' },
    { id: 'm6', name: 'Speed Round', icon: '⚡', goal: { tp: 2 }, hints: 1, speed: 750, candles: 120, fail: 0.15, text: 'The market moves FAST. Hit 2 Take Profits.' },
    { id: 'm7', name: 'No Training Wheels', icon: '🚲', goal: { tp: 2 }, hints: 0, speed: 1000, candles: 120, fail: 0.15, text: 'No hints at all. Spot the setups yourself and hit 2 TPs.' },
    { id: 'm8', name: 'High Roller', icon: '💎', goal: { coins: 120 }, hints: 0, speed: 900, candles: 130, fail: 0.15, stakes: [10, 25], text: 'Bigger risk, bigger rewards. Finish +120 coins up.' },
    { id: 'm9', name: 'Kill Zone Master', icon: '🌋', goal: { perfect: 3 }, hints: 0, speed: 800, candles: 150, fail: 0.2, text: 'The final test: 3 perfect ICT entries that hit TP. No hints.' },
  ];

  const fmt = (p) => p.toFixed(2);
  const word = (dir) => (dir === 'buy' ? 'BUY' : 'SELL');

  let sess = null;

  // ---------------------------------------------------------------- chart
  class LiveChart {
    constructor(host) {
      this.host = host;
      this.cv = document.createElement('canvas');
      this.cv.className = 'chart-canvas live-canvas';
      host.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.yr = null;
      this.drag = null;
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(host);
      this.resize();
      this.cv.addEventListener('pointerdown', (e) => this._down(e));
      this.cv.addEventListener('pointermove', (e) => this._move(e));
      this.cv.addEventListener('pointerup', (e) => this._up(e));
      this.cv.addEventListener('pointercancel', (e) => this._up(e));
    }
    destroy() { this.ro.disconnect(); }
    resize() {
      const r = this.host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.w = Math.max(240, r.width); this.h = Math.max(200, r.height);
      this.cv.width = Math.round(this.w * dpr); this.cv.height = Math.round(this.h * dpr);
      this.cv.style.width = this.w + 'px'; this.cv.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    geom(s) {
      const gutter = 66, padL = 4, padT = 14, padB = 14;
      const slot = (this.w - padL - gutter) / VIEW;
      const now = s.market.candles.length;
      const start = now - (VIEW - 1);
      return { gutter, padL, padT, padB, slot, now, start, right: this.w - gutter, x: (i) => padL + (i - start + 0.5) * slot };
    }

    Y(p) { return this.g.padT + (this.yr.hi - p) / (this.yr.hi - this.yr.lo) * (this.h - this.g.padT - this.g.padB); }
    P(y) { return this.yr.hi - (y - this.g.padT) / (this.h - this.g.padT - this.g.padB) * (this.yr.hi - this.yr.lo); }

    _range(s, g) {
      let lo = Infinity, hi = -Infinity;
      const cs = s.market.candles;
      for (let i = Math.max(0, g.start); i < g.now; i++) { lo = Math.min(lo, cs[i].l); hi = Math.max(hi, cs[i].h); }
      lo = Math.min(lo, s.live.l); hi = Math.max(hi, s.live.h);
      const pos = s.position;
      if (pos) { lo = Math.min(lo, pos.tp, pos.sl); hi = Math.max(hi, pos.tp, pos.sl); }
      const pl = s.plan;
      if (pl && !pos) { lo = Math.min(lo, pl.tp, pl.sl, pl.entry); hi = Math.max(hi, pl.tp, pl.sl, pl.entry); }
      for (const st of s.market.setups) {
        if (!st.show || st.resolvedAt != null && st.resolvedAt < g.start) continue;
        if (st.show.liq) { lo = Math.min(lo, st.target); hi = Math.max(hi, st.target); }
      }
      const span = Math.max(hi - lo, 4);
      const mid = (hi + lo) / 2;
      return { lo: mid - span * 0.55, hi: mid + span * 0.55 };
    }

    draw(s) {
      const g = this.g = this.geom(s);
      const t = this._range(s, g);
      if (!this.yr) this.yr = t;
      else if (!this.drag) this.yr = { lo: this.yr.lo + (t.lo - this.yr.lo) * 0.12, hi: this.yr.hi + (t.hi - this.yr.hi) * 0.12 };
      const { ctx, w, h } = this;
      const th = UI().theme();
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = th.bg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = th.grid; ctx.lineWidth = 1;
      for (let k = 1; k < 6; k++) { const y = Math.round(h * k / 6) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(g.right, y); ctx.stroke(); }
      ctx.fillStyle = th.future; ctx.fillRect(g.right, 0, g.gutter, h);

      const xl = (i) => Math.max(g.padL, g.x(i) - g.slot / 2);
      // setup drawings
      for (const st of s.market.setups) {
        if (!st.show) continue;
        const endX = st.resolvedAt != null ? g.x(st.resolvedAt) + g.slot / 2 : g.right;
        if (endX < g.padL) continue;
        if (st.show.fvg) {
          const x0 = xl(st.fvgA), y0 = this.Y(st.gapHi), y1 = this.Y(st.gapLo);
          ctx.fillStyle = C.gap; ctx.globalAlpha = 0.16; ctx.fillRect(x0, y0, endX - x0, y1 - y0);
          ctx.globalAlpha = 0.75; ctx.strokeStyle = C.gap; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 0.5, y0 + 0.5, endX - x0 - 1, y1 - y0 - 1);
          ctx.globalAlpha = 1;
          if (st.resolvedAt == null) tag(ctx, '🕳️ Gap', x0 + 2, y0 - 2, C.gap, 'left', 'bottom', 11);
        }
        if (st.show.liq) {
          const y = Math.round(this.Y(st.target)) + 0.5, x0 = xl(st.a1);
          ctx.strokeStyle = C.liq; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(endX, y); ctx.stroke(); ctx.setLineDash([]);
          if (st.resolvedAt == null) tag(ctx, '💰 Liquidity', Math.max(x0, g.padL) + 2, st.dir === 'buy' ? y - 3 : y + 3, C.liq, 'left', st.dir === 'buy' ? 'bottom' : 'top', 11);
        }
      }

      // position zones
      const pos = s.position;
      if (pos) {
        const x0 = Math.max(g.padL, g.x(pos.openIdx) - g.slot / 2);
        const ye = this.Y(pos.entry), yt = this.Y(pos.tp), ys = this.Y(pos.sl);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = C.up; ctx.fillRect(x0, Math.min(ye, yt), g.right - x0, Math.abs(yt - ye));
        ctx.fillStyle = C.down; ctx.fillRect(x0, Math.min(ye, ys), g.right - x0, Math.abs(ys - ye));
        ctx.globalAlpha = 1;
        hline(ctx, x0, w, ye, C.entry, true, 1.5);
        hline(ctx, x0, w, yt, C.up, false, 2.5);
        hline(ctx, x0, w, ys, C.down, false, 2.5);
      }
      const plan = !pos && s.plan;
      if (plan) {
        const x0 = Math.max(g.padL, g.x(g.now) - g.slot * 1.5);
        const ye = this.Y(plan.entry), yt = this.Y(plan.tp), ys = this.Y(plan.sl);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = C.up; ctx.fillRect(x0, Math.min(ye, yt), g.right - x0, Math.abs(yt - ye));
        ctx.fillStyle = C.down; ctx.fillRect(x0, Math.min(ye, ys), g.right - x0, Math.abs(ys - ye));
        ctx.globalAlpha = 1;
        hline(ctx, plan.type === 'limit' ? g.padL : x0, w, ye, C.gold, true, plan.type === 'limit' ? 2 : 1.5);
        hline(ctx, x0, w, yt, C.up, true, 2);
        hline(ctx, x0, w, ys, C.down, true, 2);
        if (plan.type === 'limit') tag(ctx, orderName(plan, s.price) + (plan.placed ? ' · waiting' : ''), g.padL + 4, ye - 3, C.gold, 'left', 'bottom', 11);
      }

      // candles
      const bw = Math.max(3, Math.min(18, g.slot * 0.66));
      const cs = s.market.candles;
      for (let i = Math.max(0, g.start); i <= g.now; i++) {
        const k = i === g.now ? s.live : cs[i];
        const up = k.c >= k.o, col = up ? th.up : th.down, x = g.x(i);
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, bw * 0.14);
        ctx.beginPath(); ctx.moveTo(x, this.Y(k.h)); ctx.lineTo(x, this.Y(k.l)); ctx.stroke();
        const yt = this.Y(Math.max(k.o, k.c)), yb = this.Y(Math.min(k.o, k.c));
        ctx.fillStyle = col;
        if (i === g.now) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        rr(ctx, x - bw / 2, yt, bw, Math.max(2, yb - yt), Math.min(3, bw / 4)); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // markers
      for (const st of s.market.setups) {
        if (!st.show) continue;
        const buy = st.dir === 'buy';
        if (st.show.sweep && st.sweep >= g.start) mark(ctx, this, g, cs[st.sweep], st.sweep, '🧹 Sweep', !buy);
        if (st.show.mss && st.mss >= g.start) mark(ctx, this, g, cs[st.mss], st.mss, '⚡ MSS', buy);
      }
      for (const m of s.marks) {
        if (m.i < g.start) continue;
        const k = m.i === g.now ? s.live : cs[m.i];
        if (k) mark(ctx, this, g, k, m.i, m.label, m.above, m.color);
      }

      // price line + tag
      const py = Math.round(this.Y(s.price)) + 0.5;
      const pc = s.price >= s.live.o ? th.up : th.down;
      ctx.strokeStyle = pc; ctx.globalAlpha = 0.6; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(g.padL, py); ctx.lineTo(g.right, py); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      if (pos) {
        const coins = potential(pos);
        const fmtTag = (v) => (pos.pro ? '$' + Math.round(v).toLocaleString() : v);
        gutterTag(ctx, g, this.Y(pos.tp), '🎯 +' + fmtTag(coins.tp), C.up, this.drag === 'tp');
        gutterTag(ctx, g, this.Y(pos.sl), '🛑 −' + fmtTag(coins.sl), C.down, this.drag === 'sl');
      }
      if (plan) {
        const pp = planPos(plan);
        const fmtTag = (v) => (pp.pro ? '$' + Math.round(v).toLocaleString() : v);
        gutterTag(ctx, g, this.Y(plan.tp), '🎯 +' + fmtTag(coinsFor(pp, plan.tp)), C.up, this.drag === 'tp');
        gutterTag(ctx, g, this.Y(plan.sl), '🛑 −' + fmtTag(pp.stake), C.down, this.drag === 'sl');
      }
      gutterTag(ctx, g, py, fmt(s.price), pc, false, true);
      if (plan && plan.type === 'limit') gutterTag(ctx, g, this.Y(plan.entry), 'Entry', C.gold, this.drag === 'entry');
    }

    _hit(e) {
      const r = this.cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    _down(e) {
      if (!sess || !this.g) return;
      const lv = sess.position || sess.plan;
      if (!lv) return;
      const { y } = this._hit(e);
      const cand = [['tp', lv.tp], ['sl', lv.sl]];
      if (!sess.position && lv.type === 'limit') cand.push(['entry', lv.entry]);
      let best = null, bd = 26;
      for (const [k, v] of cand) { const d = Math.abs(y - this.Y(v)); if (d <= bd) { bd = d; best = k; } }
      if (!best) return;
      this.drag = best;
      if (sess.plan && !sess.position) this.grab = y - this.Y(lv[best]);
      else this.grab = 0;
      this.cv.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    _move(e) {
      if (!this.drag || !sess || !(sess.position || sess.plan)) return;
      const { y } = this._hit(e);
      setLevel(this.drag, this.P(y - (this.grab || 0)));
    }
    _up() { if (this.drag) { this.drag = null; Store.sfx.tap(); } }
  }

  function hline(ctx, x0, x1, y, col, dash, lw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x0, Math.round(y) + 0.5); ctx.lineTo(x1, Math.round(y) + 0.5); ctx.stroke();
    ctx.setLineDash([]);
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function tag(ctx, text, x, y, col, align, base, size) {
    ctx.font = `700 ${size || 12}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const tw = ctx.measureText(text).width, pw = tw + 12, ph = (size || 12) + 8;
    let px = align === 'right' ? x - pw : align === 'center' ? x - pw / 2 : x;
    const py = base === 'bottom' ? y - ph : base === 'middle' ? y - ph / 2 : y;
    ctx.fillStyle = col; rr(ctx, px, py, pw, ph, ph / 2); ctx.fill();
    ctx.fillStyle = inkOn(col); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, px + 6, py + ph / 2 + 1);
  }
  function gutterTag(ctx, g, y, text, col, active, isPrice) {
    ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
    const ph = 22, px = g.right + 3, pw = g.gutter - 6;
    const py = Math.max(1, Math.min(ctx.canvas.clientHeight - ph - 1, y - ph / 2));
    ctx.fillStyle = col;
    rr(ctx, px, py, pw, ph, isPrice ? 6 : 11); ctx.fill();
    if (active) { ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = isPrice ? '#0B0620' : inkOn(col); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, px + pw / 2, py + ph / 2 + 1);
    if (!isPrice) { ctx.font = '700 10px system-ui'; ctx.fillText('⇕', px + pw - 6, py + ph / 2); }
  }
  function mark(ctx, chart, g, k, i, label, above, color) {
    const x = g.x(i), col = color || C.gold;
    const y = above ? chart.Y(k.h) - 6 : chart.Y(k.l) + 6;
    ctx.fillStyle = col; ctx.beginPath();
    if (above) { ctx.moveTo(x, y + 3); ctx.lineTo(x - 5, y - 5); ctx.lineTo(x + 5, y - 5); }
    else { ctx.moveTo(x, y - 3); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x + 5, y + 5); }
    ctx.fill();
    const align = x < 50 ? 'left' : x > g.right - 40 ? 'right' : 'center';
    tag(ctx, label, x, above ? y - 6 : y + 6, col, align, above ? 'bottom' : 'top', 11);
  }

  // ---------------------------------------------------------------- trading math
  function rMultiple(pos, exit) {
    const risk = Math.abs(pos.entry - pos.sl);
    const move = pos.dir === 'buy' ? exit - pos.entry : pos.entry - exit;
    return Math.max(-1, Math.min(5, move / risk));
  }
  const money = (v) => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function coinsFor(pos, exit) {
    const R = rMultiple(pos, exit);
    if (pos.pro) return Math.round(pos.stake * R * 100) / 100;
    let c = Math.round(pos.stake * R);
    if (c > 0 && pos.perfect) c = Math.round(c * 1.5);
    return c;
  }
  function potential(pos) { return { tp: coinsFor(pos, pos.tp), sl: pos.stake }; }

  function setLevel(which, v) {
    const pos = sess.position;
    if (!pos) return setPlanLevel(which, v);
    const p = sess.price, buy = pos.dir === 'buy';
    if (which === 'tp') pos.tp = buy ? Math.max(v, Math.max(p, pos.entry) + 0.1) : Math.min(v, Math.min(p, pos.entry) - 0.1);
    else pos.sl = buy ? Math.min(v, p - 0.1) : Math.max(v, p + 0.1);
    pos.moved = true;
  }

  // ---------------------------------------------------------------- order ticket
  const GAP = 0.15;
  function stakeFor(s) { return s.pro ? Math.max(0.01, Math.round(window.CQPro.account().balance * s.stake) / 100) : s.stake; }
  function planPos(plan) {
    return { dir: plan.dir, entry: plan.entry, sl: plan.sl, tp: plan.tp, pro: sess.pro, stake: stakeFor(sess), perfect: !sess.pro && perfectAt(plan.dir, plan.entry) };
  }
  // buy below price = limit, above = stop (and the reverse for sells)
  function orderName(plan, price) {
    const below = plan.entry < price;
    const kind = plan.dir === 'buy' ? (below ? 'limit' : 'stop') : (below ? 'stop' : 'limit');
    return (plan.dir === 'buy' ? 'Buy ' : 'Sell ') + kind;
  }
  function setPlanLevel(which, v) {
    const p = sess.plan;
    if (!p) return;
    const buy = p.dir === 'buy';
    if (which === 'entry') { if (p.type !== 'limit') return; const d = v - p.entry; p.entry += d; p.sl += d; p.tp += d; }
    else if (which === 'tp') p.tp = buy ? Math.max(v, p.entry + GAP) : Math.min(v, p.entry - GAP);
    else p.sl = buy ? Math.min(v, p.entry - GAP) : Math.max(v, p.entry + GAP);
    p.custom = true;
  }
  function perfectAt(dir, entry) {
    const st = activeSetup();
    if (!st || st.dir !== dir) return false;
    const [a, b] = band(st);
    return entry >= a && entry <= b;
  }
  // the coach's suggested levels: setup stop + liquidity target when a setup is live, else structure + 2R
  function autoLevels(dir, entry) {
    const s = sess, buy = dir === 'buy';
    const st = activeSetup();
    const match = st && st.dir === dir;
    let sl, tp;
    if (match && (buy ? st.stop < entry - 0.3 : st.stop > entry + 0.3)) {
      const risk = Math.min(3.5, Math.abs(entry - st.stop));
      sl = buy ? entry - risk : entry + risk;
      tp = st.target;
      if (buy ? tp - entry < 0.3 : entry - tp < 0.3) tp = buy ? entry + 2 * risk : entry - 2 * risk;
    } else {
      const cs = s.market.candles.slice(-8);
      if (buy) sl = Math.min(...cs.map((k) => k.l), s.live.l) - 0.25;
      else sl = Math.max(...cs.map((k) => k.h), s.live.h) + 0.25;
      let risk = Math.abs(entry - sl);
      risk = Math.max(0.6, Math.min(3, risk));
      sl = buy ? entry - risk : entry + risk;
      tp = buy ? entry + 2 * risk : entry - 2 * risk;
    }
    return { sl, tp };
  }
  function limitDefaults(dir) {
    const s = sess, buy = dir === 'buy', st = activeSetup();
    let entry;
    if (st && st.dir === dir && (buy ? st.gapHi < s.price - GAP : st.gapLo > s.price + GAP)) entry = buy ? st.gapHi : st.gapLo;
    else {
      const r = Math.abs(s.price - autoLevels(dir, s.price).sl);
      entry = buy ? s.price - r * 0.5 : s.price + r * 0.5;
    }
    return Object.assign({ entry }, autoLevels(dir, entry));
  }
  function syncPlan() {
    const p = sess.plan;
    if (!p || p.placed || p.type !== 'market') return;
    const d = sess.price - p.entry;
    if (d) { p.entry += d; p.sl += d; p.tp += d; }
  }
  function planTrade(dir) {
    const s = sess;
    if (!s || s.position || s.done) return;
    if (S.oneTap) return openTrade(dir);
    const type = s.plan ? s.plan.type : 'market';
    const base = type === 'limit' ? limitDefaults(dir) : Object.assign({ entry: s.price }, autoLevels(dir, s.price));
    s.plan = Object.assign({ dir, type, placed: false }, base);
    Store.sfx.tap();
    if (s.hints === 2) coach(perfectAt(dir, s.price) ? 'Nice spot. I set your stop beyond the sweep and the target at the liquidity. Drag the lines if you want, then place it.' : 'Plan your trade: drag 🛑 stop loss and 🎯 take profit on the chart, then tap Place.', 'happy');
    renderControls();
  }
  function setPlanType(type) {
    const s = sess, p = s.plan;
    if (!p || p.placed || p.type === type) return;
    const base = type === 'limit' ? limitDefaults(p.dir) : Object.assign({ entry: s.price }, autoLevels(p.dir, s.price));
    Object.assign(p, base, { type });
    if (type === 'limit' && s.hints >= 1) coach(p.dir === 'buy' ? 'Limit order: drag the gold Entry line to where you want in. Pros wait for price to come back into the gap.' : 'Limit order: drag the gold Entry line up to where you want to sell. It fills when price gets there.', 'happy');
    Store.sfx.tap();
    renderControls();
  }
  function quickTarget(r) {
    const p = sess.plan; if (!p) return;
    if (r === 'auto') Object.assign(p, autoLevels(p.dir, p.entry));
    else { const risk = Math.abs(p.entry - p.sl); p.tp = p.dir === 'buy' ? p.entry + r * risk : p.entry - r * risk; }
    Store.sfx.tap();
  }
  function canAfford() {
    const s = sess;
    if (s.pro || S.coins >= s.stake) return true;
    if (!s.loaned) {
      s.loaned = true;
      S.coins += 50; Store.save(); UI().refreshCoins();
      coach('Pip spotted you 50 coins. Trade smart.', 'happy');
      return S.coins >= s.stake;
    }
    UI().toast('Not enough coins for that risk — pick a smaller one.', '🪙');
    return false;
  }
  function placeOrder() {
    const s = sess, p = s.plan;
    if (!p || s.position || s.done) return;
    if (!canAfford()) return;
    if (p.type === 'market') { syncPlan(); s.plan = null; fill(p.dir, s.price, p.sl, p.tp); return; }
    const close = Math.abs(p.entry - s.price) < 0.05;
    if (close) { s.plan = null; fill(p.dir, s.price, p.sl, p.tp); return; }
    p.placed = true; p.above = p.entry > s.price; p.name = orderName(p, s.price);
    Store.sfx.good(); Store.buzz(10);
    coach(`${p.name} placed at ${fmt(p.entry)}. It fills by itself when price gets there. Your stop and target come with it.`, 'happy');
    renderControls();
  }
  function cancelPlan() {
    const s = sess; if (!s.plan) return;
    const was = s.plan.placed;
    s.plan = null; Store.sfx.tap();
    if (was) coach('Order cancelled.', 'happy');
    renderControls();
  }
  function checkOrder(price) {
    const s = sess, o = s.plan;
    if (!o || !o.placed || s.position) return;
    if (o.above ? price >= o.entry : price <= o.entry) {
      s.plan = null;
      fill(o.dir, o.entry, o.sl, o.tp, o.name);
    }
  }

  // ---------------------------------------------------------------- session
  function activeSetup() {
    let best = null;
    for (const st of sess.market.setups) if ((st.state === 'mss' || st.state === 'zone') && st.resolvedAt == null) best = st;
    return best;
  }
  function band(st) { const pad = (st.gapHi - st.gapLo) * 0.35; return [st.gapLo - pad, st.gapHi + pad]; }

  function coach(text, mood, important) {
    if (!sess || !sess.ui) return;
    const b = sess.ui.coach;
    if (!text) return;
    b.querySelector('p').textContent = text;
    b.querySelector('.mini-owl').innerHTML = owlSVG(S.hat, mood || 'happy', 'owl mini');
    b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    if (important) b.classList.add('important'); else b.classList.remove('important');
  }

  function startSession(arg) {
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    const pro = !!(arg && arg.pro);
    const m = pro ? null : (arg || null);
    const market = new Market(seed, { failRate: pro ? 0.25 : m ? m.fail : 0.15, setupRate: pro ? 0.65 : 0.8 });
    market.warmUp(VIEW + 4);
    // skip ahead so the first setup starts soon after the session begins
    sess = {
      mission: m, market, rng: RNG(seed ^ 0x9e3779b9),
      asset: ASSETS[seed % ASSETS.length],
      candleMs: m ? m.speed : 1150, speedMult: 1, paused: false, alive: true,
      pro, startBalance: pro ? window.CQPro.account().balance : 0,
      hints: pro ? 0 : m ? m.hints : (S.freeHints != null ? S.freeHints : 2),
      stakes: pro ? [0.5, 1, 2, 5, 10] : m ? (m.stakes || [10]) : [10, 25, 50],
      stake: pro ? window.CQPro.account().risk : 10, position: null, plan: null, marks: [], winStreak: 0,
      stats: { trades: [], tp: 0, sl: 0, net: 0, perfectWins: 0 },
      candlesLeft: m ? m.candles : Infinity, done: false, loaned: false, goalShown: false,
      acc: 0, tickIdx: 0, lastTs: 0,
    };
    startCandle();
    window.__cqSess = sess;
  }

  function startCandle() {
    const s = sess;
    s.cur = s.market.take();
    s.path = tickPath(s.cur, TICKS, s.rng);
    s.tickIdx = 0; s.acc = 0;
    s.live = { o: s.cur.o, h: s.cur.o, l: s.cur.o, c: s.cur.o };
    s.price = s.cur.o;
  }

  function applyTick(p) {
    const s = sess;
    s.live.c = p; s.live.h = Math.max(s.live.h, p); s.live.l = Math.min(s.live.l, p);
    s.price = p;
    checkOrder(p);
    checkPosition(p);
    checkZones(p);
  }

  function frame(ts) {
    const s = sess;
    if (!s || !s.alive) return;
    const dt = s.lastTs ? Math.min(120, ts - s.lastTs) : 16;
    s.lastTs = ts;
    if (!s.paused && !s.done) {
      s.acc += dt * s.speedMult;
      const prog = s.acc / s.candleMs;
      const target = Math.min(TICKS, Math.floor(prog * TICKS));
      while (s.tickIdx < target && s.alive) { s.tickIdx++; applyTick(s.path[s.tickIdx]); }
      if (prog >= 1) finishCandle();
      else {
        const t = s.tickIdx, f = prog * TICKS - t;
        const p = s.path[t] + (s.path[Math.min(TICKS, t + 1)] - s.path[t]) * f;
        s.price = p; s.live.c = p; s.live.h = Math.max(s.live.h, p); s.live.l = Math.min(s.live.l, p);
      }
    }
    if (!s.alive) return;
    syncPlan();
    s.ui.chart.draw(s);
    updateBars();
    s.raf = requestAnimationFrame(frame);
  }

  function finishCandle() {
    const s = sess;
    // make sure every tick has been applied, then lock in the real candle
    while (s.tickIdx < TICKS) { s.tickIdx++; applyTick(s.path[s.tickIdx]); }
    s.market.finish(s.cur);
    onCandleClosed(s.market.candles.length - 1);
    if (s.mission) {
      s.candlesLeft--;
      if (s.candlesLeft <= 0) { endSession(); return; }
    }
    startCandle();
  }

  function onCandleClosed(i) {
    const s = sess;
    const cs = s.market.candles;
    for (const st of s.market.setups) {
      if (st.state === 'old' || st.state === 'done' || st.state === 'failed') continue;
      const buy = st.dir === 'buy';
      const hi = buy ? 'highs' : 'lows', lo = buy ? 'lows' : 'highs';
      st.show = st.show || {};
      if (i === st.a2) {
        st.state = 'liq';
        if (s.hints >= 1) st.show.liq = true;
        if (s.hints === 2) coach(`💰 Equal ${hi}! Lots of stop orders are hiding ${buy ? 'above' : 'below'} them. Price LOVES to go grab liquidity like that.`);
      }
      if (i === st.sweep) {
        st.state = 'swept';
        if (s.hints >= 1) st.show.sweep = true;
        if (s.hints === 2) coach(`🧹 Sweep! Price poked ${buy ? 'below' : 'above'} the last ${lo}, grabbed those stops and snapped back. Watch for a strong move ${buy ? 'UP' : 'DOWN'}…`, 'wow');
      }
      if (i === st.fvgC) {
        st.state = 'mss';
        if (s.hints >= 1) { st.show.mss = true; st.show.fvg = true; }
        if (s.hints === 2) coach(`⚡ Market Structure Shift! A big candle broke structure and left a gap 🕳️. Don't chase it — wait for price to come back INTO the gap.`, 'wow');
        else if (s.hints === 1) coach('⚡ Structure shift + gap. You know what to wait for…');
      }
      if (i > st.fvgC && (st.state === 'mss' || st.state === 'zone')) {
        const k = cs[i];
        const hitT = buy ? k.h >= st.target : k.l <= st.target;
        const hitS = buy ? k.l <= st.stop : k.h >= st.stop;
        if (hitS && !hitT) {
          st.state = 'failed'; st.resolvedAt = i;
          if (s.hints >= 1) coach('🛑 That setup failed — it happens to every trader! A stop loss keeps the loss small.', 'sad');
        } else if (hitT) {
          st.state = 'done'; st.resolvedAt = i;
          if (s.hints >= 1) coach(`🎯 Price ran all the way to the liquidity! That's the ICT model in action.`, 'wow');
        } else if (i > st.entry + 14) { st.state = 'done'; st.resolvedAt = i; }
      }
    }
  }

  function checkZones(p) {
    const s = sess;
    for (const st of s.market.setups) {
      if (st.state !== 'mss') continue;
      const [a, b] = band(st);
      if (p >= a && p <= b) {
        st.state = 'zone';
        if (s.hints === 2 && !s.position) {
          coach(`${st.dir === 'buy' ? '🟢' : '🔴'} Price is back in the gap — this is the ENTRY ZONE! Tap ${word(st.dir)} now!`, 'wow', true);
          const btn = s.ui.root.querySelector('.trade-' + st.dir);
          if (btn) { btn.classList.add('pulse'); setTimeout(() => btn.classList.remove('pulse'), 4000); }
        } else if (s.hints === 1 && !s.position) coach('🕳️ Price is back in the gap…', 'happy');
      }
    }
  }

  // ---------------------------------------------------------------- positions
  // one-tap market order with the coach's levels
  function openTrade(dir) {
    const s = sess;
    if (!s || s.position || s.done) return;
    if (!canAfford()) return;
    s.plan = null;
    const lv = autoLevels(dir, s.price);
    fill(dir, s.price, lv.sl, lv.tp);
  }

  function fill(dir, entry, sl, tp, orderLabel) {
    const s = sess;
    const buy = dir === 'buy';
    const st = activeSetup();
    const match = st && st.dir === dir;
    const perfect = perfectAt(dir, entry);
    const stake = stakeFor(s);
    s.position = { dir, entry, sl, tp, stake, pro: s.pro, openIdx: s.market.candles.length, perfect, against: !!(st && !match), setup: st ? st.id : null };
    if (orderLabel) popup(`${orderLabel} filled @ ${fmt(entry)}`, 'win');
    s.marks.push({ i: s.market.candles.length, label: buy ? '▲ BUY' : '▼ SELL', above: !buy, color: buy ? C.up : C.down });
    Store.sfx.good();
    Store.buzz(12);
    if (s.pro) coach(s.stake >= 10 ? `Risking ${s.stake}% of your account on one trade. Two losses like this and you're down almost 20%.` : s.stake >= 5 ? `${s.stake}% risk is aggressive. Pros usually risk 0.5–2%.` : `Risking ${money(stake)} (${s.stake}% of your account). Let it play out.`, s.stake >= 5 ? 'sad' : 'happy');
    else if (perfect) coach('🌟 PERFECT entry! In the gap, after the sweep and MSS. Win this one for 1.5× coins!', 'wow');
    else if (st && !match && s.hints >= 1) coach(`😬 Careful — the setup is pointing ${st.dir === 'buy' ? 'UP' : 'DOWN'}. ${buy ? 'Buying' : 'Selling'} here goes against it.`, 'sad');
    else if (s.hints === 2) coach('Trade open! 🎯 is your Take Profit, 🛑 is your Stop Loss. Drag them on the chart to move them.');
    renderControls();
  }

  function checkPosition(p) {
    const pos = sess.position;
    if (!pos) return;
    const buy = pos.dir === 'buy';
    if (buy ? p >= pos.tp : p <= pos.tp) closeTrade(pos.tp, 'tp');
    else if (buy ? p <= pos.sl : p >= pos.sl) closeTrade(pos.sl, 'sl');
  }

  function closeTrade(exit, reason) {
    const s = sess;
    const pos = s.position;
    if (!pos) return;
    s.position = null;
    if (pos.pro) return closeProTrade(pos, exit, reason);
    let coins = coinsFor(pos, exit);
    if (reason === 'sl') coins = -pos.stake;
    const tags = [];
    if (coins > 0) {
      const room = window.CQRoom ? window.CQRoom.tpBonus() : 1;
      const kz = window.CQMeta ? window.CQMeta.multiplier() : 1;
      const streak = reason === 'tp' ? 1 + 0.1 * Math.min(5, s.winStreak) : 1;
      if (room > 1) tags.push(`screens +${Math.round((room - 1) * 100)}%`);
      if (streak > 1) tags.push(`streak +${Math.round((streak - 1) * 100)}%`);
      if (kz > 1) tags.push('kill zone 2×');
      coins = Math.round(coins * room * streak * kz);
    }
    if (coins > 0) UI().giveCoins(coins);
    else if (coins < 0) { S.coins = Math.max(0, S.coins + coins); Store.save(); UI().refreshCoins(); }
    s.stats.net += coins;
    const M = window.CQMeta;
    if (reason === 'tp') {
      s.stats.tp++; s.winStreak++;
      S.tpTotal = (S.tpTotal || 0) + 1;
      if (s.winStreak > (S.bestWinStreak || 0)) S.bestWinStreak = s.winStreak;
      Store.save();
      Store.badge('tp1');
      if (S.tpTotal >= 25) Store.badge('tp25');
      if (s.winStreak >= 5) Store.badge('streak5');
      if (pos.perfect) { s.stats.perfectWins++; Store.badge('sniper'); }
      if (M) {
        M.track('tp'); M.track('winstreak', s.winStreak);
        if (pos.perfect) M.track('perfect');
        if (M.multiplier() > 1) { M.track('kztp'); Store.badge('killzone'); }
      }
    } else if (reason === 'sl') { s.stats.sl++; s.winStreak = 0; }
    if (coins > 0 && M) M.track('tradeCoins', coins);
    s.stats.trades.push({ dir: pos.dir, reason, coins, perfect: pos.perfect, entry: pos.entry, exit, sl: pos.sl, tp: pos.tp, setup: pos.setup });
    s.marks.push({ i: s.market.candles.length, label: reason === 'tp' ? '🎯' : reason === 'sl' ? '🛑' : '✋', above: true, color: coins >= 0 ? C.up : C.down });

    const msg = reason === 'tp' ? `Take profit! +${coins}` : reason === 'sl' ? `Stopped out ${coins}` : `Closed ${coins >= 0 ? '+' : ''}${coins}`;
    popup(msg, coins >= 0 ? 'win' : 'loss', tags);
    if (reason === 'tp') {
      Store.sfx.win(); Store.buzz([18, 40, 18]); coinShower(Math.min(24, 8 + Math.round(coins / 4)));
      if (pos.perfect) UI().confetti(60);
      coach(pos.perfect ? '🌟 Perfect entry AND take profit. That is how the pros do it.' : s.winStreak >= 3 ? `🔥 ${s.winStreak} wins in a row. Streak bonus +${Math.round(Math.min(5, s.winStreak) * 10)}% on the next one.` : pick(['Profit locked in.', 'Clean. Your TP got hit.', 'That\'s a winner.']), 'wow');
    } else if (reason === 'sl') {
      Store.sfx.bad(); Store.buzz(70); shake();
      coach(pos.perfect ? 'Great entry. The market just said no this time, and your stop kept the loss small.' : 'Stopped out. Losses are part of trading. Wait for the next clean setup.', 'sad');
    }
    renderControls();
    checkGoal();
  }

  // Pro Account: real risk. Dollars in, dollars out, no bonuses.
  function closeProTrade(pos, exit, reason) {
    const s = sess, P = window.CQPro;
    let pnl = reason === 'sl' ? -pos.stake : coinsFor(pos, exit);
    pnl = Math.round(pnl * 100) / 100;
    const acct = P.record(pnl);
    s.stats.net = Math.round((s.stats.net + pnl) * 100) / 100;
    if (pnl > 0) { s.stats.tp++; s.winStreak++; if (window.CQMeta) window.CQMeta.track('pro'); } else if (pnl < 0) { s.stats.sl++; s.winStreak = 0; }
    s.stats.trades.push({ dir: pos.dir, reason, coins: pnl, pro: true });
    s.marks.push({ i: s.market.candles.length, label: reason === 'tp' ? '🎯' : reason === 'sl' ? '🛑' : '✋', above: true, color: pnl >= 0 ? C.up : C.down });
    popup(`${reason === 'tp' ? 'Take profit' : reason === 'sl' ? 'Stopped out' : 'Closed'} ${pnl >= 0 ? '+' : ''}${money(pnl)}`, pnl >= 0 ? 'win' : 'loss', [`${pnl >= 0 ? '+' : ''}${(pnl / (acct.balance - pnl) * 100).toFixed(1)}% account`]);
    if (pnl > 0) { Store.sfx.win(); Store.buzz([18, 40, 18]); } else if (pnl < 0) { Store.sfx.bad(); Store.buzz(70); shake(); }
    if (acct.blown) { coach('Account blown. That\'s what over-risking does.', 'sad'); setTimeout(() => endSession(), 1400); }
    else if (acct.newMilestone) coach(`Milestone: ${money(acct.newMilestone)}! Compounding is working.`, 'wow');
    else if (pnl < 0 && s.stake >= 5) coach(`That loss cost ${Math.abs(pnl / (acct.balance - pnl) * 100).toFixed(1)}% of your account. Smaller risk means you survive losing streaks.`, 'sad');
    renderControls();
  }

  function coinShower(n) {
    const wrap = sess.ui.root.querySelector('.chart-wrap');
    const target = document.querySelector('.hud-coins');
    if (!wrap || !target) return;
    const a = wrap.getBoundingClientRect(), b = target.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const c = document.createElement('span');
      c.className = 'fly-coin';
      c.innerHTML = coin();
      const x0 = a.left + a.width * (0.3 + Math.random() * 0.4), y0 = a.top + a.height * (0.35 + Math.random() * 0.3);
      c.style.left = x0 + 'px'; c.style.top = y0 + 'px';
      document.body.appendChild(c);
      const dx = b.left + 14 - x0, dy = b.top + 14 - y0;
      c.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 0 }, { transform: `translate(${(Math.random() - .5) * 60}px, ${-40 - Math.random() * 40}px) scale(1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: .9 }],
        { duration: 700 + Math.random() * 300, delay: i * 35, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' }).onfinish = () => c.remove();
    }
  }
  function shake() {
    const w = sess.ui.root.querySelector('.chart-wrap');
    if (w && w.animate) w.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320 });
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function popup(text, kind, tags) {
    const wrap = sess.ui.root.querySelector('.chart-wrap');
    const p = document.createElement('div');
    p.className = 'live-pop ' + kind;
    p.textContent = text;
    if (tags && tags.length) { const t = document.createElement('small'); t.textContent = tags.join(' · '); p.appendChild(t); }
    wrap.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }

  // ---------------------------------------------------------------- goals
  function goalText(m) {
    const g = m.goal;
    if (g.tp) return `${Math.min(sess.stats.tp, g.tp)} of ${g.tp} take profits` + (g.maxSL != null ? `, ${sess.stats.sl} of ${g.maxSL} stop allowed` : '');
    if (g.coins) return `${sess.stats.net >= 0 ? '+' : ''}${sess.stats.net} of +${g.coins} coins`;
    if (g.perfect) return `${Math.min(sess.stats.perfectWins, g.perfect)} of ${g.perfect} perfect wins`;
    return '';
  }
  function goalMet(m, st) {
    const g = m.goal;
    if (g.tp) return st.tp >= g.tp && (g.maxSL == null || st.sl <= g.maxSL);
    if (g.coins) return st.net >= g.coins;
    if (g.perfect) return st.perfectWins >= g.perfect;
    return false;
  }
  function checkGoal() {
    const s = sess;
    if (!s.mission || s.goalShown) return;
    if (goalMet(s.mission, s.stats)) {
      s.goalShown = true;
      Store.sfx.win();
      const bar = s.ui.root.querySelector('.goal-done');
      bar.hidden = false;
      coach('🏆 Mission complete! Keep trading for more coins, or tap Finish.', 'wow');
    }
  }

  // ---------------------------------------------------------------- UI
  function updateBars() {
    const s = sess, ui = s.ui;
    const now = performance.now();
    if (ui.lastBar && now - ui.lastBar < 120) return;
    ui.lastBar = now;
    const ch = s.price - s.market.candles[s.market.candles.length - 1].c;
    ui.ticker.innerHTML = `<b>${s.asset}</b><span class="${s.price >= s.live.o ? 'up' : 'down'}">${fmt(s.price)}${ic(s.price >= s.live.o ? 'up' : 'down')}</span>`;
    void ch;
    if (s.pro) { const a = window.CQPro.account(); ui.goal.textContent = `Balance ${money(a.balance)}  ·  risk ${s.stake}% = ${money(a.balance * s.stake / 100)}  ·  session ${s.stats.net >= 0 ? '+' : ''}${money(s.stats.net)}`; }
    else if (s.mission) ui.goal.textContent = `${goalText(s.mission)}  ·  ${s.candlesLeft} candles left`;
    else ui.goal.textContent = `${s.stats.tp} take profits  ·  ${s.stats.net >= 0 ? '+' : ''}${s.stats.net} coins this session`;
    if (ui.kz) {
      const kz = window.CQMeta.killZoneAt();
      ui.kz.hidden = !kz.active;
      if (kz.active) ui.kz.textContent = `${kz.zone.name} kill zone · 2× coins · ${window.CQMeta.fmtLeft(kz.endsAt - Date.now())} left`;
    }
    if (ui.streak) { ui.streak.hidden = s.winStreak < 2; ui.streak.textContent = `🔥 ${s.winStreak} win streak · +${Math.min(5, s.winStreak) * 10}%`; }
    if (s.plan) updateTicket();
    if (s.position) {
      const c = coinsFor(s.position, s.price);
      ui.pnl.firstChild.textContent = s.pro ? `${c >= 0 ? '+' : ''}${money(c)}` : `${c >= 0 ? '+' : ''}${c}`;
      ui.pnl.className = 'pnl ' + (c >= 0 ? 'up' : 'down');
    }
  }

  function stakeRow(s) {
    return `<div class="stake-row"><span>${s.pro ? 'Risk % of account' : 'Risk per trade'}</span>${s.stakes.map((v) => `<button class="stake ${v === s.stake ? 'on' : ''} ${s.pro && v >= 5 ? 'hot' : ''}" data-v="${v}">${s.pro ? v + '%' : coin() + v}</button>`).join('')}</div>`;
  }
  function bindStakes(s, box) {
    box.querySelectorAll('.stake').forEach((b) => b.addEventListener('click', () => { s.stake = +b.dataset.v; if (s.pro) window.CQPro.setRisk(s.stake); Store.sfx.tap(); renderControls(); }));
  }

  function renderControls() {
    const s = sess, box = s.ui.controls;
    s.ui.tk = null;
    s.ui.root.classList.toggle('planning', !!(s.plan && !s.plan.placed && !s.position));
    if (s.position) {
      const p = s.position;
      box.innerHTML = `<div class="pos-panel ${p.dir}">
        <div class="pos-top"><span class="pos-dir">${ic(p.dir === 'buy' ? 'up' : 'down')}${p.dir === 'buy' ? 'Buying' : 'Selling'} · risking ${p.pro ? money(p.stake) : p.stake}${p.perfect && !p.pro ? ' <span class="pill">Perfect entry</span>' : ''}</span><span class="pnl"><span>0</span>${p.pro ? '' : coin()}</span></div>
        <p class="pos-hint">Drag the take-profit and stop-loss tags on the right edge of the chart to move them.</p>
        <button class="btn btn-ghost close-trade">Close trade now</button>
      </div>`;
      s.ui.pnl = box.querySelector('.pnl');
      box.querySelector('.close-trade').addEventListener('click', () => { Store.sfx.tap(); closeTrade(s.price, 'manual'); });
    } else if (s.plan && s.plan.placed) {
      const p = s.plan;
      box.innerHTML = `<div class="pos-panel pending ${p.dir}">
        <div class="pos-top"><span class="pos-dir">${ic('target')}${p.name} @ <b class="tk-entry">${fmt(p.entry)}</b></span><span class="pill">Waiting</span></div>
        <p class="pos-hint">Fills when price reaches your entry. Stop <b class="tk-sl">${fmt(p.sl)}</b> · Target <b class="tk-tp">${fmt(p.tp)}</b> · <b class="tk-rr"></b>. Drag the lines to adjust.</p>
        <button class="btn btn-ghost tk-cancel">Cancel order</button>
      </div>`;
      s.ui.tk = { entry: box.querySelector('.tk-entry'), sl: box.querySelector('.tk-sl'), tp: box.querySelector('.tk-tp'), rr: box.querySelector('.tk-rr') };
      box.querySelector('.tk-cancel').addEventListener('click', cancelPlan);
    } else if (s.plan) {
      const p = s.plan, buy = p.dir === 'buy';
      box.innerHTML = `<div class="ticket ${p.dir}">
        <div class="tk-row">
          <div class="seg tk-dir"><button data-d="buy" class="${buy ? 'on buy' : ''}">${ic('up')}Buy</button><button data-d="sell" class="${!buy ? 'on sell' : ''}">${ic('down')}Sell</button></div>
          <div class="seg tk-type"><button data-t="market" class="${p.type === 'market' ? 'on' : ''}">Market</button><button data-t="limit" class="${p.type === 'limit' ? 'on' : ''}">Limit</button></div>
        </div>
        <div class="tk-stats">
          <div class="tk-stat down"><small>Stop loss</small><b class="tk-risk"></b><em class="tk-sl"></em></div>
          <div class="tk-stat up"><small>Take profit</small><b class="tk-reward"></b><em class="tk-tp"></em></div>
          <div class="tk-stat"><small>Risk : reward</small><b class="tk-rr"></b><em class="tk-entry"></em></div>
        </div>
        <div class="tk-quick"><span>Target</span><button data-r="1">1R</button><button data-r="2">2R</button><button data-r="3">3R</button><button data-r="auto">${ic('bolt')}Coach</button></div>
        <div class="tk-stakes">${stakeRow(s)}</div>
        <p class="tk-hint"></p>
        <div class="tk-actions"><button class="btn btn-ghost tk-cancel">Cancel</button><button class="btn tk-place ${p.dir}">Place ${buy ? 'buy' : 'sell'}</button></div>
      </div>`;
      s.ui.tk = { risk: box.querySelector('.tk-risk'), reward: box.querySelector('.tk-reward'), rr: box.querySelector('.tk-rr'), sl: box.querySelector('.tk-sl'), tp: box.querySelector('.tk-tp'), entry: box.querySelector('.tk-entry'), hint: box.querySelector('.tk-hint'), place: box.querySelector('.tk-place') };
      box.querySelectorAll('.tk-dir button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.d !== p.dir) planTrade(b.dataset.d); }));
      box.querySelectorAll('.tk-type button').forEach((b) => b.addEventListener('click', () => setPlanType(b.dataset.t)));
      box.querySelectorAll('.tk-quick button').forEach((b) => b.addEventListener('click', () => { quickTarget(b.dataset.r === 'auto' ? 'auto' : +b.dataset.r); updateTicket(true); }));
      box.querySelector('.tk-cancel').addEventListener('click', cancelPlan);
      box.querySelector('.tk-place').addEventListener('click', placeOrder);
      bindStakes(s, box);
      updateTicket(true);
    } else {
      box.innerHTML = `<div class="trade-btns">
          <button class="trade-btn trade-buy"><b>${ic('up')}BUY</b><small>${S.oneTap ? 'instant · coach levels' : 'plan entry, stop, target'}</small></button>
          <button class="trade-btn trade-sell"><b>${ic('down')}SELL</b><small>${S.oneTap ? 'instant · coach levels' : 'plan entry, stop, target'}</small></button>
        </div>
        ${stakeRow(s)}
        <button class="onetap ${S.oneTap ? 'on' : ''}" aria-pressed="${!!S.oneTap}"><span class="knob"></span>One-tap trading</button>`;
      box.querySelector('.trade-buy').addEventListener('click', () => planTrade('buy'));
      box.querySelector('.trade-sell').addEventListener('click', () => planTrade('sell'));
      box.querySelector('.onetap').addEventListener('click', () => { S.oneTap = !S.oneTap; Store.save(); Store.sfx.tap(); renderControls(); });
      bindStakes(s, box);
    }
  }

  function updateTicket(force) {
    const s = sess, t = s.ui.tk, p = s.plan;
    if (!t || !p) return;
    const risk = Math.abs(p.entry - p.sl), reward = Math.abs(p.tp - p.entry);
    const rr = reward / risk;
    t.rr.textContent = '1 : ' + rr.toFixed(1);
    if (t.sl) t.sl.textContent = fmt(p.sl);
    if (t.tp) t.tp.textContent = fmt(p.tp);
    if (t.entry) t.entry.textContent = p.placed ? fmt(p.entry) : p.type === 'limit' ? orderName(p, s.price) + ' ' + fmt(p.entry) : 'at market ' + fmt(p.entry);
    if (!t.risk) return;
    const pp = planPos(p);
    const win = coinsFor(pp, p.tp);
    t.risk.innerHTML = s.pro ? '−' + money(pp.stake) : '−' + pp.stake + coin();
    t.reward.innerHTML = s.pro ? '+' + money(win) : '+' + win + coin();
    t.rr.className = 'tk-rr ' + (rr >= 2 ? 'good' : rr >= 1 ? 'ok' : 'bad');
    const hint = rr < 1 ? 'Your target is closer than your stop. You would need to win most trades just to break even.'
      : pp.perfect ? '🌟 Perfect entry spot: wins pay 1.5× coins.'
      : rr >= 2 ? `At 1:${rr.toFixed(1)} you can lose ${Math.floor(rr)} of every ${Math.floor(rr) + 1} trades and still break even.`
      : 'Most pros aim for at least 1:2.';
    if (force || t.hint.textContent !== hint) t.hint.textContent = hint;
  }

  function liveScreen(mission) {
    const U = UI();
    startSession(mission);
    const s = sess;
    const hintsLabel = ['Master — no hints', 'Pro — some hints', 'Training wheels — full hints'];
    const root = U.el(`<main class="screen live">
      <div class="live-top">
        <div class="ticker"></div>
        <div class="live-ctrl">
          ${mission ? '' : '<button class="chip hints-btn" aria-label="Hints"></button>'}
          <button class="chip speed-btn" aria-label="Speed">1×</button>
          <button class="chip pause-btn" aria-label="Pause">${ic('pause')}</button>
        </div>
      </div>
      <div class="goal-row">${ic(mission && !mission.pro ? 'target' : 'trade')}<span class="goal"></span></div>
      <div class="live-flags"><span class="kz-flag" hidden></span><span class="streak-flag" hidden></span></div>
      <div class="goal-done" hidden><span>Mission complete!</span><button class="btn small finish">Finish</button></div>
      <div class="coach"><div class="mini-owl"></div><p></p></div>
      <div class="chart-wrap"><div class="chart-host live-chart"></div></div>
      <div class="controls"></div>
    </main>`);
    U.app.append(U.hud(() => leave(), s.pro ? 'Pro Account' : mission ? mission.name : 'Free Market'), root);
    s.ui = {
      root, ticker: root.querySelector('.ticker'), goal: root.querySelector('.goal'),
      kz: s.pro ? null : root.querySelector('.kz-flag'), streak: s.pro ? null : root.querySelector('.streak-flag'),
      coach: root.querySelector('.coach'), controls: root.querySelector('.controls'),
      chart: new LiveChart(root.querySelector('.live-chart')),
    };
    coach(s.pro ? 'Pro Account: real risk, no hints, no bonuses. Your balance grows or shrinks with every trade.' : mission ? `${mission.icon} ${mission.text}` + (s.hints === 2 ? ' Watch the chart — I\'ll tell you when a setup shows up!' : '') : 'Free market! Trade as much as you like. Every Take Profit = coins.', 'happy');
    const sp = root.querySelector('.speed-btn');
    sp.addEventListener('click', () => { s.speedMult = s.speedMult === 1 ? 2 : s.speedMult === 2 ? 0.5 : 1; sp.textContent = s.speedMult === 0.5 ? '½×' : s.speedMult + '×'; Store.sfx.tap(); });
    const pb = root.querySelector('.pause-btn');
    pb.addEventListener('click', () => { s.paused = !s.paused; pb.innerHTML = ic(s.paused ? 'play' : 'pause'); Store.sfx.tap(); });
    const hb = root.querySelector('.hints-btn');
    if (hb && s.pro) hb.remove();
    else if (hb) {
      const lab = () => { hb.innerHTML = ic(['eyeOff', 'eye', 'owl'][s.hints]) + ['No hints', 'Some hints', 'Full hints'][s.hints]; };
      lab();
      hb.addEventListener('click', () => { s.hints = (s.hints + 2) % 3; S.freeHints = s.hints; Store.save(); lab(); coach(hintsLabel[s.hints], 'happy'); });
    }
    root.querySelector('.finish').addEventListener('click', () => endSession());
    renderControls();
    s.raf = requestAnimationFrame(frame);
  }

  function leave() {
    const s = sess;
    if (!s) return UI().go(UI().home);
    if (s.pro) { endSession(); return; }
    if (s.mission) {
      stop();
      UI().go(missions);
    } else endSession();
  }

  function stop() {
    if (!sess) return;
    sess.alive = false;
    cancelAnimationFrame(sess.raf);
    if (sess.ui && sess.ui.chart) sess.ui.chart.destroy();
  }

  function endSession() {
    const s = sess;
    if (!s || s.done) return;
    if (s.position) closeTrade(s.price, 'end');
    s.plan = null;
    s.done = true;
    stop();
    if (s.pro) { UI().go(window.CQPro.hub, { session: s.stats, start: s.startBalance }); return; }
    const m = s.mission;
    let stars = 0, bonus = 0, first = false;
    if (m) {
      const met = goalMet(m, s.stats);
      if (met) {
        stars = 1 + (s.stats.net > 0 && s.stats.sl <= 1 ? 1 : 0) + (s.stats.perfectWins >= 1 ? 1 : 0);
        S.missionStars = S.missionStars || {};
        const prev = S.missionStars[m.id] || 0;
        first = !prev;
        S.missionStars[m.id] = Math.max(prev, stars);
        Store.save();
        bonus = 20 * stars + (first ? 30 : 0);
        UI().giveCoins(bonus);
        if (MISSIONS.every((x) => (S.missionStars[x.id] || 0) > 0)) Store.badge('m9');
        if (window.CQMeta) window.CQMeta.track('mission');
      }
    }
    const U = UI();
    U.go(() => {
      const st = s.stats;
      const passed = m ? stars > 0 : true;
      const rows = st.trades.length
        ? st.trades.map((t) => `<li><span class="tl-dir ${t.dir === 'buy' ? 'up' : 'down'}">${ic(t.dir === 'buy' ? 'up' : 'down')}${t.dir === 'buy' ? 'Buy' : 'Sell'}</span><span class="tl-why">${{ tp: 'Take profit hit', sl: 'Stopped out', manual: 'Closed early', end: 'Closed at the bell' }[t.reason]}${t.perfect ? ' · perfect entry' : ''}</span><b class="${t.coins >= 0 ? 'up' : 'down'}">${t.coins >= 0 ? '+' : ''}${t.coins}${coin()}</b></li>`).join('')
        : '<li class="empty">No trades this time. Next time tap BUY or SELL when you see a setup!</li>';
      const root = U.el(`<main class="screen result">
        <div class="hero-owl">${owlSVG(S.hat, passed && st.net >= 0 ? 'wow' : 'sad')}</div>
        <h2>${m ? (passed ? (stars === 3 ? 'Perfect mission!' : 'Mission complete') : 'Not quite yet') : 'Market closed'}</h2>
        ${m ? `${starRow(stars, 'big-stars')}<p class="tiny">Stars: reach the goal · finish up with at most 1 stop loss · win a perfect ICT entry</p>` : ''}
        <div class="earn"><div><b>${st.tp}</b><span>take profits</span></div><div><b class="${st.net >= 0 ? 'up' : 'down'}">${st.net >= 0 ? '+' : ''}${st.net}</b><span>trading coins</span></div><div><b>+${bonus}</b><span>mission bonus</span></div></div>
        <ul class="trade-list">${rows}</ul>
        <div class="result-actions">
          ${m && passed && MISSIONS.indexOf(m) < MISSIONS.length - 1 ? '<button class="btn btn-play next-m">Next mission</button>' : ''}
          <button class="btn ${m && !passed ? 'btn-play' : 'btn-ghost'} again">${m ? 'Play mission again' : 'Trade again'}</button>
          <button class="btn btn-ghost back-m">${m ? 'All missions' : 'Home'}</button>
        </div>
      </main>`);
      U.app.append(U.hud(() => U.go(m ? missions : U.home), m ? m.name : 'Free Market'), root);
      if (stars === 3) U.confetti(80);
      root.querySelector('.again').addEventListener('click', () => U.go(liveScreen, m));
      root.querySelector('.back-m').addEventListener('click', () => U.go(m ? missions : U.home));
      const nx = root.querySelector('.next-m');
      if (nx) nx.addEventListener('click', () => U.go(liveScreen, MISSIONS[MISSIONS.indexOf(m) + 1]));
    });
  }

  function missions() {
    const U = UI();
    const ms = S.missionStars || {};
    const root = U.el(`<main class="screen missions">
      <div class="mode-grid">
        <button class="mode-card pro-card"><span class="mc-k">Pro Account</span><b class="mc-bal">${window.CQPro.money(window.CQPro.account().balance)}</b><small>Real risk. Grow ${'$'}1k into ${'$'}1M with compounding.</small></button>
        <button class="mode-card free-card"><span class="mc-k">Free market</span><b>Play for coins</b><small>Endless market, hints your way.</small></button>
      </div>
      <button class="tile school-link"><span class="tile-ic violet">${ic('school')}</span><b>Trading school</b><small>Learn each setup, step by step</small></button>
      <h2 class="section-title">Missions</h2>
      <div class="mission-list"></div>
    </main>`);
    const list = root.querySelector('.mission-list');
    MISSIONS.forEach((m, i) => {
      const open = i === 0 || (ms[MISSIONS[i - 1].id] || 0) > 0;
      const st = ms[m.id] || 0;
      const isNext = open && !st;
      const card = U.el(`<button class="mission ${open ? '' : 'locked'} ${st ? 'done' : ''} ${isNext ? 'next' : ''}" ${open ? '' : 'disabled'}>
        <span class="m-icon">${open ? m.icon : ic('lock')}</span>
        <span class="m-body"><b>${U.esc(m.name)}</b><small>${U.esc(m.text)}</small>
          <span class="m-tags"><i>${['No hints', 'Some hints', 'Full hints'][m.hints]}</i><i>${m.speed <= 800 ? 'Fast market' : m.speed <= 1000 ? 'Quick market' : 'Calm market'}</i></span></span>
        ${starRow(st)}
      </button>`);
      if (open) card.addEventListener('click', () => { Store.sfx.tap(); U.go(liveScreen, m); });
      list.appendChild(card);
    });
    U.app.append(U.hud(null, 'Trade'), root, U.nav('trade'));
    root.querySelector('.pro-card').addEventListener('click', () => { Store.sfx.tap(); U.go(window.CQPro.hub); });
    root.querySelector('.free-card').addEventListener('click', () => { Store.sfx.tap(); U.go(liveScreen, null); });
    root.querySelector('.school-link').addEventListener('click', () => { Store.sfx.tap(); U.go(U.map); });
  }

  // Small always-moving chart for the home screen.
  function homeTicker(host) {
    const seed = (Date.now() & 0xffffff) >>> 0;
    const mk = new Market(seed, { failRate: 0.1 });
    mk.warmUp(30);
    const rng = RNG(seed + 7);
    const cv = document.createElement('canvas');
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let cur, path, acc = 0, last = 0, live;
    const next = () => { cur = mk.take(); path = tickPath(cur, TICKS, rng); acc = 0; live = { o: cur.o, h: cur.o, l: cur.o, c: cur.o }; };
    next();
    let yr = null;
    function draw(ts) {
      if (!host.isConnected) return;
      const dt = last ? Math.min(100, ts - last) : 16; last = ts;
      acc += dt;
      const prog = acc / 700;
      const t = Math.min(TICKS, Math.floor(prog * TICKS));
      for (let i = 0; i <= t; i++) { live.h = Math.max(live.h, path[i]); live.l = Math.min(live.l, path[i]); }
      live.c = path[t];
      if (prog >= 1) { mk.finish(cur); next(); }
      const r = host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      const w = r.width, h = r.height;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const th = UI().theme();
      const N = 26, list = mk.candles.slice(-(N - 1)).concat([live]);
      let lo = Math.min(...list.map((k) => k.l)), hi = Math.max(...list.map((k) => k.h));
      const tgt = { lo: lo - (hi - lo) * 0.1, hi: hi + (hi - lo) * 0.1 };
      yr = yr ? { lo: yr.lo + (tgt.lo - yr.lo) * 0.1, hi: yr.hi + (tgt.hi - yr.hi) * 0.1 } : tgt;
      const Y = (p) => 8 + (yr.hi - p) / (yr.hi - yr.lo) * (h - 16);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = th.bg; ctx.fillRect(0, 0, w, h);
      const slot = (w - 58) / N, bw = slot * 0.62;
      list.forEach((k, i) => {
        const x = 4 + (i + 0.5) * slot, col = k.c >= k.o ? th.up : th.down;
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l)); ctx.stroke();
        ctx.fillStyle = col;
        const yt = Y(Math.max(k.o, k.c)), yb = Y(Math.min(k.o, k.c));
        ctx.fillRect(x - bw / 2, yt, bw, Math.max(2, yb - yt));
      });
      const py = Y(live.c), pc = live.c >= live.o ? th.up : th.down;
      ctx.fillStyle = pc; rr(ctx, w - 52, py - 10, 48, 20, 6); ctx.fill();
      ctx.fillStyle = '#0B0620'; ctx.font = '800 11px "Plus Jakarta Sans", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt(live.c), w - 28, py + 1);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  window.CQLive = { missions, liveScreen, stop, homeTicker, MISSIONS };
})();
