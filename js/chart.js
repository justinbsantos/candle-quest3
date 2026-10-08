/* Wickd — canvas candlestick chart with kid-friendly annotations. */
(function (G) {
  'use strict';

  const ANN_COLORS = {
    liq: '#B18CFF', gold: '#FFC94A', gap: '#4FA8FF', ob: '#FF9F43',
    good: '#2EE6A6', bad: '#FF5C7A', info: '#9A8CC2',
  };

  class ChartView {
    constructor(host, opts) {
      this.host = host;
      this.opts = opts || {};
      this.cv = document.createElement('canvas');
      this.cv.className = 'chart-canvas';
      host.appendChild(this.cv);
      this.ctx = this.cv.getContext('2d');
      this.state = null;
      this.yr = null;
      this.onTap = null;
      this._raf = 0;
      this.cv.addEventListener('pointerdown', (e) => this._tap(e));
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.resize());
        this.ro.observe(host);
      }
      this.resize();
    }

    destroy() {
      if (this.ro) this.ro.disconnect();
      cancelAnimationFrame(this._raf);
    }

    resize() {
      const r = this.host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.w = Math.max(200, r.width);
      this.h = Math.max(160, r.height);
      this.cv.width = Math.round(this.w * dpr);
      this.cv.height = Math.round(this.h * dpr);
      this.cv.style.width = this.w + 'px';
      this.cv.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    }

    // state: { candles, visible, ann:[], marks:[{i,type}], theme, showFuture }
    set(state, keepRange) {
      this.state = state;
      if (!keepRange) this.yr = null;
      this.draw();
    }
    update(patch) {
      Object.assign(this.state, patch);
      this.draw();
    }

    _geom() {
      const s = this.state;
      const n = s.candles.length;
      const padL = 10, padR = 10, padT = 34, padB = 30;
      const slot = (this.w - padL - padR) / n;
      return { n, padL, padR, padT, padB, slot, cx: (i) => padL + slot * (i + 0.5) };
    }

    _targetRange() {
      const s = this.state;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < s.visible; i++) {
        lo = Math.min(lo, s.candles[i].l);
        hi = Math.max(hi, s.candles[i].h);
      }
      for (const a of s.ann || []) {
        if (a.y != null) { lo = Math.min(lo, a.y); hi = Math.max(hi, a.y); }
        if (a.y0 != null) { lo = Math.min(lo, a.y0); hi = Math.max(hi, a.y1); }
      }
      const span = Math.max(hi - lo, 3);
      const mid = (hi + lo) / 2;
      return { lo: mid - span * 0.56, hi: mid + span * 0.56 };
    }

    draw() {
      if (!this.state) return;
      const t = this._targetRange();
      if (!this.yr) this.yr = t;
      else {
        this.yr = { lo: this.yr.lo + (t.lo - this.yr.lo) * 0.25, hi: this.yr.hi + (t.hi - this.yr.hi) * 0.25 };
        if (Math.abs(this.yr.lo - t.lo) + Math.abs(this.yr.hi - t.hi) > 0.01) {
          cancelAnimationFrame(this._raf);
          this._raf = requestAnimationFrame(() => this.draw());
        } else this.yr = t;
      }
      this._paint();
    }

    _paint() {
      const { ctx, w, h } = this;
      const s = this.state;
      const th = s.theme;
      const g = this._geom();
      const Y = (p) => g.padT + (this.yr.hi - p) / (this.yr.hi - this.yr.lo) * (h - g.padT - g.padB);
      this.Y = Y;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = th.bg;
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = th.grid;
      ctx.lineWidth = 1;
      for (let k = 1; k < 5; k++) {
        const y = Math.round(g.padT + (h - g.padT - g.padB) * k / 5) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // future zone
      if (s.visible < g.n && s.showFuture !== false) {
        const x0 = g.padL + g.slot * s.visible;
        ctx.fillStyle = th.future;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x0, 0, w - x0, h);
        ctx.globalAlpha = 1;
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = th.text;
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(x0 + 0.5, 6); ctx.lineTo(x0 + 0.5, h - 6); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = th.text;
        ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', (x0 + w) / 2, h / 2);
        ctx.globalAlpha = 1;
      }

      // boxes under candles
      for (const a of s.ann || []) if (a.t === 'box') this._box(a, g, Y);

      // candles
      const bw = Math.max(3, Math.min(22, g.slot * 0.64));
      for (let i = 0; i < s.visible; i++) {
        const k = s.candles[i];
        const up = k.c >= k.o;
        const col = up ? th.up : th.down;
        const x = g.cx(i);
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1.5, bw * 0.14);
        ctx.beginPath();
        ctx.moveTo(x, Y(k.h)); ctx.lineTo(x, Y(k.l));
        ctx.stroke();
        const yt = Y(Math.max(k.o, k.c)), yb = Y(Math.min(k.o, k.c));
        ctx.fillStyle = col;
        roundRect(ctx, x - bw / 2, yt, bw, Math.max(2, yb - yt), Math.min(3, bw / 4));
        ctx.fill();
      }

      // lines + marks
      for (const a of s.ann || []) if (a.t === 'line') this._line(a, g, Y);
      for (const m of s.marks || []) this._ring(m, g, Y, bw);
      for (const a of s.ann || []) if (a.t === 'mark') this._mark(a, g, Y);
    }

    _box(a, g, Y) {
      const { ctx } = this;
      const col = ANN_COLORS[a.color] || ANN_COLORS.info;
      const x0 = g.padL + g.slot * a.i0, x1 = Math.min(this.w - 2, g.padL + g.slot * (a.i1 + 1));
      const y0 = Y(a.y1), y1 = Y(a.y0);
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);
      ctx.globalAlpha = 1;
      if (a.label) pill(ctx, a.label, x1 - 4, y0 - 2, col, 'right', 'bottom');
    }

    _line(a, g, Y) {
      const { ctx } = this;
      const col = ANN_COLORS[a.color] || ANN_COLORS.info;
      const x0 = g.cx(a.i0) - g.slot * 0.4, x1 = this.w - 2;
      const y = Math.round(Y(a.y)) + 0.5;
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      if (a.dash) ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.setLineDash([]);
      if (a.label) pill(ctx, a.label, x1 - 2, y - 3, col, 'right', 'bottom');
    }

    _mark(a, g, Y) {
      if (a.i == null || a.i < 0 || a.i >= this.state.visible) return;
      const k = this.state.candles[a.i];
      const col = ANN_COLORS[a.color] || ANN_COLORS.gold;
      const x = g.cx(a.i);
      const above = a.pos !== 'below';
      const y = above ? Y(k.h) - 8 : Y(k.l) + 8;
      const { ctx } = this;
      ctx.fillStyle = col;
      ctx.beginPath();
      if (above) { ctx.moveTo(x, y + 4); ctx.lineTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); }
      else { ctx.moveTo(x, y - 4); ctx.lineTo(x - 5, y + 4); ctx.lineTo(x + 5, y + 4); }
      ctx.fill();
      const align = x < 70 ? 'left' : x > this.w - 70 ? 'right' : 'center';
      pill(ctx, a.label, x, above ? y - 6 : y + 6, col, align, above ? 'bottom' : 'top');
    }

    _ring(m, g, Y, bw) {
      if (m.i < 0 || m.i >= this.state.visible) return;
      const k = this.state.candles[m.i];
      const { ctx } = this;
      const col = m.type === 'bad' ? '#FF5C7A' : m.type === 'good' ? '#2EE6A6' : '#FFC94A';
      const x = g.cx(m.i), yt = Y(k.h) - 6, yb = Y(k.l) + 6;
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      if (m.type === 'answer') ctx.setLineDash([5, 4]);
      roundRect(ctx, x - bw / 2 - 6, yt, bw + 12, yb - yt, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      if (m.type === 'bad') {
        ctx.fillStyle = col;
        ctx.font = '700 16px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('✕', x, yt - 2);
      }
    }

    indexAt(clientX) {
      const r = this.cv.getBoundingClientRect();
      const g = this._geom();
      const x = clientX - r.left;
      const raw = (x - g.padL) / g.slot - 0.5;
      return { i: Math.max(0, Math.min(this.state.visible - 1, Math.round(raw))), raw };
    }

    _tap(e) {
      if (!this.state || !this.onTap) return;
      const r = this.cv.getBoundingClientRect();
      const g = this._geom();
      if (e.clientX - r.left > g.padL + g.slot * this.state.visible + g.slot) return;
      this.onTap(this.indexAt(e.clientX));
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function pill(ctx, text, x, y, col, align, base) {
    ctx.font = '700 12px "Plus Jakarta Sans", system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + 12, ph = 20;
    let px = align === 'right' ? x - pw : align === 'left' ? x : x - pw / 2;
    px = Math.max(2, px);
    const py = base === 'bottom' ? y - ph : y;
    ctx.fillStyle = col;
    roundRect(ctx, px, py, pw, ph, 10);
    ctx.fill();
    ctx.fillStyle = (col === '#2EE6A6' || col === '#FFC94A') ? '#0B2A20' : '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, px + 6, py + ph / 2 + 1);
  }

  G.CQChart = ChartView;
})(window);
