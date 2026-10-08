/* Wickd — Pro Account: a $1,000 play account where risk is real.
 * You choose what % of the account to risk per trade; wins and losses
 * compound, so good risk management grows the account exponentially and
 * over-risking blows it up. No hints, no bonuses.
 */
(function (G) {
  'use strict';

  const START = 1000, BLOWN_AT = 100, RESET_COST = 250;
  const MILESTONES = [
    { at: 2000, coins: 150 }, { at: 5000, coins: 400 }, { at: 10000, coins: 800 },
    { at: 25000, coins: 1500 }, { at: 100000, coins: 4000 }, { at: 1000000, coins: 15000 },
  ];
  const TITLES = [[0, 'Rookie'], [2000, 'Prospect'], [5000, 'Trader'], [10000, 'Pro'], [25000, 'Shark'], [100000, 'Fund Manager'], [1000000, 'Whale']];

  // Expected growth per trade (geometric mean) for a risk %, win rate and reward:risk.
  function growthPerTrade(riskPct, winRate, rr) {
    const r = riskPct / 100;
    if (r >= 1) return 0;
    return Math.pow(1 + r * rr, winRate) * Math.pow(1 - r, 1 - winRate);
  }
  function project(start, riskPct, winRate, rr, trades) {
    return start * Math.pow(growthPerTrade(riskPct, winRate, rr), trades);
  }
  // Longest losing streak you should expect over n trades, and what it costs.
  function expectedStreak(winRate, trades) { return Math.max(1, Math.ceil(Math.log(trades) / Math.log(1 / (1 - winRate)))); }
  function streakDrawdown(riskPct, len) { return 1 - Math.pow(1 - riskPct / 100, len); }

  if (typeof window === 'undefined' || !G.CQStore) {
    G.CQPro = { growthPerTrade, project, expectedStreak, streakDrawdown, START, BLOWN_AT };
    return;
  }
  const Store = G.CQStore, S = Store.state;
  const UI = () => G.CQUI;
  const { ic, coin } = G.CQIcons;
  const money = (v, dp) => (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: dp == null ? 2 : dp, maximumFractionDigits: dp == null ? 2 : dp });
  const short = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1e4 ? '$' + Math.round(v / 1000) + 'k' : '$' + Math.round(v).toLocaleString());

  function account() {
    if (!S.pro) S.pro = { balance: START, peak: START, best: START, risk: 1, trades: 0, wins: 0, losses: 0, blown: 0, maxDD: 0, history: [START], hit: [] };
    return S.pro;
  }
  function setRisk(v) { account().risk = v; Store.save(); }
  function title(bal) { let t = TITLES[0][1]; TITLES.forEach(([at, n]) => { if (bal >= at) t = n; }); return t; }

  // Apply a closed trade's profit/loss. Returns flags for the live screen.
  function record(pnl) {
    const a = account();
    a.balance = Math.max(0, Math.round((a.balance + pnl) * 100) / 100);
    a.trades++;
    if (pnl > 0) a.wins++; else if (pnl < 0) a.losses++;
    a.peak = Math.max(a.peak, a.balance);
    a.best = Math.max(a.best, a.balance);
    a.maxDD = Math.max(a.maxDD, a.peak ? (a.peak - a.balance) / a.peak : 0);
    a.history.push(a.balance);
    if (a.history.length > 400) a.history = a.history.filter((_, i) => i % 2 === 0 || i === a.history.length - 1);
    let newMilestone = 0;
    MILESTONES.forEach((m) => {
      if (a.balance >= m.at && !a.hit.includes(m.at)) {
        a.hit.push(m.at); newMilestone = m.at;
        setTimeout(() => { UI().giveCoins(m.coins); UI().toast(`Account hit ${short(m.at)}! +${m.coins} coins`, '📈'); }, 400);
        if (m.at >= 10000) Store.badge('pro10k');
        if (m.at >= 1000000) Store.badge('whale');
      }
    });
    const blown = a.balance < BLOWN_AT;
    if (blown) { a.blownFlag = true; Store.badge('blown'); }
    Store.save();
    return { balance: a.balance, blown, newMilestone };
  }

  function resetAccount(paid) {
    const a = account();
    if (paid) { S.coins = Math.max(0, S.coins - RESET_COST); }
    Object.assign(a, { balance: START, peak: START, trades: 0, wins: 0, losses: 0, maxDD: 0, history: [START], blownFlag: false, blown: a.blown + 1 });
    Store.save();
  }

  // ---------------------------------------------------------------- drawing
  function drawEquity(cv, data, opts) {
    const w = cv.parentElement.clientWidth, h = opts.h || 170, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const series = opts.series || [{ data, color: data[data.length - 1] >= data[0] ? '#3CFFB1' : '#FF4D6D', fill: true }];
    let lo = Infinity, hi = -Infinity, n = 0;
    series.forEach((s) => s.data.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
    series.forEach((s) => { n = Math.max(n, s.data.length); });
    if (opts.base != null) { lo = Math.min(lo, opts.base); hi = Math.max(hi, opts.base); }
    const log = opts.log && lo > 0;
    const f = (v) => (log ? Math.log(v) : v);
    let a = f(lo), b = f(hi); if (b - a < 1e-6) { a -= 1; b += 1; }
    const pad = 12, X = (i) => pad + (i / Math.max(1, n - 1)) * (w - pad * 2), Y = (v) => h - 20 - ((f(v) - a) / (b - a)) * (h - 40);
    if (opts.base != null) { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(pad, Y(opts.base)); ctx.lineTo(w - pad, Y(opts.base)); ctx.stroke(); ctx.setLineDash([]); }
    series.forEach((s) => {
      if (s.data.length < 2) return;
      ctx.beginPath(); s.data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
      ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
      if (s.fill) { ctx.lineTo(X(s.data.length - 1), h); ctx.lineTo(X(0), h); ctx.closePath(); const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, s.color + '55'); g.addColorStop(1, s.color + '00'); ctx.fillStyle = g; ctx.fill(); }
      const lv = s.data[s.data.length - 1];
      ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(s.data.length - 1), Y(lv), 4, 0, 7); ctx.fill();
      if (s.label) { ctx.font = '600 11px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(s.label, w - pad, Y(lv) - 6); }
    });
    ctx.fillStyle = 'rgba(236,232,255,.55)'; ctx.font = '500 10px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(short(hi), pad, 4); ctx.textBaseline = 'bottom'; ctx.fillText(short(lo), pad, h - 4);
  }

  // ---------------------------------------------------------------- screen
  function hub(info) {
    const U = UI(), a = account();
    const change = (a.balance / START - 1) * 100;
    const dd = a.peak ? (a.peak - a.balance) / a.peak * 100 : 0;
    const winRate = a.trades ? Math.round(a.wins / a.trades * 100) : 0;
    const next = MILESTONES.find((m) => !a.hit.includes(m.at));
    const sess = info && info.session;
    const root = U.el(`<main class="screen pro">
      <section class="pro-hero">
        <div class="pro-top"><span class="pro-title">${title(a.balance)}</span><span class="tiny">Pro Account</span></div>
        <div class="pro-bal">${money(a.balance)}</div>
        <div class="pro-sub ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '+' : ''}${change.toFixed(1)}% since ${short(START)}${sess && sess.trades.length ? ` · last session ${sess.net >= 0 ? '+' : ''}${money(sess.net)}` : ''}</div>
        <div class="eq"><canvas></canvas></div>
        <div class="pro-stats"><div><b>${a.trades}</b><span>trades</span></div><div><b>${winRate}%</b><span>win rate</span></div><div><b class="${dd > 20 ? 'down' : ''}">${dd.toFixed(1)}%</b><span>drawdown</span></div><div><b>${short(a.best)}</b><span>best</span></div></div>
        ${next ? `<div class="ms"><div class="ms-row"><span>Next milestone ${short(next.at)}</span><span>${coin()}+${next.coins}</span></div><i class="ms-bar"><i style="width:${Math.min(100, a.balance / next.at * 100).toFixed(1)}%"></i></i></div>` : ''}
        <button class="btn btn-play go">${a.blownFlag ? 'Account blown' : 'Trade the Pro Account'}</button>
      </section>

      <section class="calc">
        <h2 class="section-title">The compounding calculator</h2>
        <p class="lead small">Small, steady risk grows an account exponentially. Big risk blows it up, even with the same win rate. Try it.</p>
        <div class="calc-grid">
          <label>Risk per trade <b class="v-risk"></b><input id="c-risk" type="range" min="0.5" max="25" step="0.5" value="${a.risk || 1}"></label>
          <label>Win rate <b class="v-win"></b><input id="c-win" type="range" min="25" max="70" step="1" value="40"></label>
          <label>Reward : risk <b class="v-rr"></b><input id="c-rr" type="range" min="1" max="4" step="0.5" value="2"></label>
        </div>
        <div class="eq calc-eq"><canvas></canvas></div>
        <div class="calc-out"></div>
      </section>

      <section class="risk-rules">
        <h2 class="section-title">House rules</h2>
        <ul>
          <li>Start with ${short(START)} of play money. Every trade risks the % you pick, so wins and losses compound.</li>
          <li>No hints, no bonuses, rougher market: about 1 in 4 setups fails.</li>
          <li>Fall below ${short(BLOWN_AT)} and the account is blown. Restarting costs ${RESET_COST} coins.</li>
          <li>Milestones (${MILESTONES.map((m) => short(m.at)).join(', ')}) pay coins for your room.</li>
        </ul>
      </section>
    </main>`);
    U.app.append(U.hud(() => U.go(G.CQLive.missions), 'Pro Account'), root, U.nav('trade'));
    requestAnimationFrame(() => drawEquity(root.querySelector('.pro-hero canvas'), a.history.length > 1 ? a.history : [START, a.balance], { base: START, h: 150 }));

    // calculator
    const els = { risk: root.querySelector('#c-risk'), win: root.querySelector('#c-win'), rr: root.querySelector('#c-rr') };
    const out = root.querySelector('.calc-out'), cv = root.querySelector('.calc-eq canvas');
    function calc() {
      const r = +els.risk.value, w = +els.win.value / 100, rr = +els.rr.value;
      root.querySelector('.v-risk').textContent = r + '%';
      root.querySelector('.v-win').textContent = Math.round(w * 100) + '%';
      root.querySelector('.v-rr').textContent = '1 : ' + rr;
      const mine = [], safe = [], wild = [];
      for (let t = 0; t <= 200; t += 5) { mine.push(project(START, r, w, rr, t)); safe.push(project(START, 1, w, rr, t)); wild.push(project(START, 25, w, rr, t)); }
      const end = mine[mine.length - 1];
      drawEquity(cv, mine, { h: 170, log: true, base: START, series: [
        { data: wild, color: '#FF4D6D', label: '25% risk' }, { data: safe, color: '#9B85FF', label: '1% risk' }, { data: mine, color: '#3CFFB1', label: 'You', fill: true }] });
      const g = growthPerTrade(r, w, rr);
      const edge = w * rr - (1 - w);
      const L = expectedStreak(w, 200), dd = streakDrawdown(r, L) * 100;
      out.innerHTML = `<div><b class="${end >= START ? 'up' : 'down'}">${short(end)}</b><span>typical result after 200 trades at ${r}% risk</span></div>
        <p class="tiny">${edge <= 0 ? 'With this win rate and reward there is no edge. No risk size can save it: improve your entries first.'
          : g < 1 ? `You have an edge, but ${r}% risk is so big that losing streaks eat the account. Same skill, less risk, more money.`
          : `Each trade grows the account about ${((g - 1) * 100).toFixed(2)}% on average. That is compounding.`}</p>
        <p class="tiny ${dd >= 90 ? 'down' : dd >= 40 ? 'warn' : ''}">Over 200 trades, expect a losing streak of about ${L} in a row. At ${r}% risk that streak alone costs <b>${dd.toFixed(0)}%</b> of your account${dd >= 90 ? ', which means blown' : ''}.</p>`;
    }
    Object.values(els).forEach((e) => e.addEventListener('input', calc));
    calc();

    root.querySelector('.go').addEventListener('click', () => {
      Store.sfx.tap();
      if (a.blownFlag) return blownModal();
      U.go(G.CQLive.liveScreen, { pro: true });
    });
    if (a.blownFlag && info && info.session) setTimeout(blownModal, 300);
  }

  function blownModal() {
    const U = UI(), a = account();
    const can = S.coins >= RESET_COST;
    const m = document.createElement('div');
    m.className = 'modal-back';
    m.innerHTML = `<div class="modal center"><h2>Account blown</h2><p>Your balance fell below ${short(BLOWN_AT)}. This is the #1 way real traders fail: risking too much per trade until a losing streak wipes them out.</p><p class="tiny">Max drawdown this run: ${(a.maxDD * 100).toFixed(0)}% · accounts blown: ${a.blown + 1}</p>
      <div class="modal-actions"><button class="btn btn-ghost close">Not now</button><button class="btn btn-flame reset">${can ? `Restart for ${RESET_COST}` : 'Restart (free this time)'}</button></div></div>`;
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('.close')) m.remove();
      if (e.target.closest('.reset')) { resetAccount(can); m.remove(); U.toast('Fresh $1,000 account. Keep risk small this time.', '📉'); U.go(hub); }
    });
    document.body.appendChild(m);
  }

  G.CQPro = { account, setRisk, record, hub, growthPerTrade, project, title, START, BLOWN_AT, money };
})(typeof window !== 'undefined' ? window : globalThis);
