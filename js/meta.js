/* Wickd — meta game: weekly leagues, kill zone boosts, daily quests.
 * Pure helpers (killZoneAt, weekKey, leagueTable, questsFor) are exported for
 * tests; the screens and hooks only run in the browser.
 */
(function (G) {
  'use strict';
  const { RNG } = G.CQScenarios;

  // ---------------------------------------------------------------- kill zones
  // Real trading-session windows, in New York time (minutes after midnight).
  const ZONES = [
    { name: 'London', from: 2 * 60, to: 5 * 60, blurb: 'Europe wakes up and big orders hit the market.' },
    { name: 'New York AM', from: 7 * 60, to: 10 * 60, blurb: 'The busiest window of the day. Wall Street opens.' },
    { name: 'New York PM', from: 13 * 60 + 30, to: 16 * 60, blurb: 'The afternoon push into the close.' },
    { name: 'Asia', from: 20 * 60, to: 22 * 60, blurb: 'Tokyo and Hong Kong come online.' },
  ];
  const BOOST = 2;

  function nyMinutes(date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date);
    const h = +parts.find((p) => p.type === 'hour').value, m = +parts.find((p) => p.type === 'minute').value;
    return (h % 24) * 60 + m;
  }
  function zoneAtMinute(min) { return ZONES.find((z) => min >= z.from && min < z.to) || null; }

  // { active, zone, endsAt } or { active:false, next, startsAt }
  function killZoneAt(date) {
    const now = date || new Date();
    const min = nyMinutes(now);
    const z = zoneAtMinute(min);
    if (z) return { active: true, zone: z, endsAt: new Date(now.getTime() + (z.to - min) * 60000 - now.getSeconds() * 1000) };
    for (let k = 1; k <= 24 * 60; k++) {
      const z2 = zoneAtMinute((min + k) % 1440);
      if (z2) return { active: false, zone: z2, startsAt: new Date(now.getTime() + k * 60000 - now.getSeconds() * 1000) };
    }
    return { active: false, zone: null };
  }

  // ---------------------------------------------------------------- weeks & leagues
  function weekStart(date) {
    const d = new Date(date || Date.now());
    const day = (d.getDay() + 6) % 7; // Monday = 0
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  }
  function weekKey(date) { const s = weekStart(date); return `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`; }
  function weekProgress(date) {
    const now = date || new Date(), s = weekStart(now);
    return Math.min(1, Math.max(0, (now - s) / (7 * 86400000)));
  }

  const TIERS = [
    { name: 'Bronze', colors: ['#D08B5B', '#8A4B2A'] },
    { name: 'Silver', colors: ['#E3E8F2', '#8E99AE'] },
    { name: 'Gold', colors: ['#FFE08A', '#E9A21C'] },
    { name: 'Platinum', colors: ['#B9F3FF', '#4FA8FF'] },
    { name: 'Diamond', colors: ['#C9B6FF', '#7C5CFF'] },
    { name: 'Legend', colors: ['#FFB23E', '#FF4FD8'] },
  ];
  const LEAGUE_SIZE = 20, PROMOTE = 5, DEMOTE = 5;
  const A = ['Pixel', 'Nova', 'Lunar', 'Ghost', 'Turbo', 'Neon', 'Frost', 'Echo', 'Blaze', 'Comet', 'Zen', 'Vibe', 'Atlas', 'Rogue', 'Drift', 'Sol', 'Jade', 'Onyx', 'Volt', 'Kai'];
  const B = ['Trader', 'Bull', 'Wolf', 'Wick', 'Gap', 'Sweep', 'Pips', 'FX', 'Candle', 'Charts', 'Bear', 'Scalper', 'Swing', 'Hawk'];

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // AI rivals for a given week + tier. Deterministic, so the board is stable.
  function rivalsFor(wk, tier) {
    const rng = RNG(hash(wk + '|' + tier));
    const out = [], used = new Set();
    while (out.length < LEAGUE_SIZE - 1) {
      let name = A[Math.floor(rng() * A.length)] + B[Math.floor(rng() * B.length)];
      if (rng() < 0.45) name += Math.floor(rng() * 99 + 1);
      if (used.has(name)) continue;
      used.add(name);
      const lazy = rng() < 0.2;
      const target = Math.round((lazy ? 40 + rng() * 260 : 250 + rng() * 1200) * (1 + tier * 0.55));
      out.push({ name, target, curve: 0.55 + rng() * 1.2, ai: true });
    }
    return out;
  }
  function rivalScore(r, progress) { return Math.round(r.target * Math.pow(progress, r.curve)); }

  // Full table: you + rivals, sorted by score.
  function leagueTable(wk, tier, myName, myScore, progress) {
    const rows = rivalsFor(wk, tier).map((r) => ({ name: r.name, score: rivalScore(r, progress), ai: true }));
    rows.push({ name: myName || 'You', score: myScore, me: true });
    rows.sort((a, b) => b.score - a.score || (a.me ? -1 : 1));
    rows.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }
  function settle(rank, tier) {
    let to = tier;
    if (rank <= PROMOTE && tier < TIERS.length - 1) to = tier + 1;
    else if (rank > LEAGUE_SIZE - DEMOTE && tier > 0) to = tier - 1;
    const reward = rank === 1 ? 500 : rank === 2 ? 300 : rank === 3 ? 200 : rank <= PROMOTE ? 100 : 0;
    return { to, reward };
  }

  // ---------------------------------------------------------------- quests
  const QUEST_POOL = [
    { type: 'tp', make: (r) => { const n = 2 + Math.floor(r() * 3); return { target: n, text: `Hit ${n} take profits`, reward: 30 + n * 15 }; } },
    { type: 'perfect', make: () => ({ target: 1, text: 'Land a perfect entry', reward: 60 }) },
    { type: 'kztp', make: () => ({ target: 1, text: 'Take profit during a kill zone', reward: 60 }) },
    { type: 'tradeCoins', make: (r) => { const n = [60, 80, 100, 150][Math.floor(r() * 4)]; return { target: n, text: `Earn ${n} coins from trading`, reward: 50 }; } },
    { type: 'winstreak', make: () => ({ target: 3, text: 'Win 3 trades in a row', reward: 70 }) },
    { type: 'mission', make: () => ({ target: 1, text: 'Finish a live mission', reward: 50 }) },
    { type: 'school', make: () => ({ target: 1, text: 'Clear a Trading School level', reward: 40 }) },
    { type: 'pro', make: () => ({ target: 2, text: 'Win 2 trades on your Pro Account', reward: 60 }) },
    { type: 'roomUp', make: () => ({ target: 1, text: 'Upgrade something in your room', reward: 40 }) },
  ];
  const dayKey = (d) => { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  function questsFor(day) {
    const r = RNG(hash('q|' + day));
    const pool = QUEST_POOL.slice();
    const out = [];
    // always one take-profit quest, then two different others
    out.push(Object.assign({ type: 'tp', progress: 0, done: false }, pool[0].make(r)));
    const rest = pool.slice(1);
    while (out.length < 3) {
      const q = rest.splice(Math.floor(r() * rest.length), 1)[0];
      out.push(Object.assign({ type: q.type, progress: 0, done: false }, q.make(r)));
    }
    return out;
  }

  // ---------------------------------------------------------------- browser glue
  if (typeof window === 'undefined' || !G.CQStore) {
    G.CQMeta = { killZoneAt, weekKey, weekProgress, leagueTable, rivalsFor, settle, questsFor, TIERS, LEAGUE_SIZE, ZONES };
    return;
  }
  const Store = G.CQStore, S = Store.state;
  const UI = () => G.CQUI;

  // Week rollover: settle last week's league before counting new coins.
  function ensureWeek() {
    const wk = weekKey();
    if (S.weekKey === wk) return;
    if (S.weekKey) {
      const table = leagueTable(S.weekKey, S.league || 0, S.name, S.weekXP || 0, 1);
      const me = table.find((r) => r.me);
      const res = settle(me.rank, S.league || 0);
      S.leagueResult = { week: S.weekKey, rank: me.rank, from: S.league || 0, to: res.to, reward: res.reward, seen: false };
      S.league = res.to;
      if (res.to > (S.leagueResult.from)) Store.badge('promoted');
      if (res.reward) { S.coins += res.reward; S.totalCoins += res.reward; }
    }
    S.weekKey = wk; S.weekXP = 0;
    Store.save();
  }
  function ensureQuests() {
    const d = dayKey();
    if (!S.quests || S.quests.day !== d) { S.quests = { day: d, list: questsFor(d), bonus: false }; Store.save(); }
    return S.quests;
  }

  Store.onEarn((n) => { ensureWeek(); if (n > 0) S.weekXP = (S.weekXP || 0) + n; });

  // Record progress. kind: tp | perfect | kztp | tradeCoins | winstreak | mission | school | pro | roomUp
  function track(kind, amount) {
    const q = ensureQuests();
    const amt = amount == null ? 1 : amount;
    q.list.forEach((it) => {
      if (it.done || it.type !== kind) return;
      it.progress = kind === 'winstreak' ? Math.max(it.progress, amt) : it.progress + amt;
      if (it.progress >= it.target) {
        it.progress = it.target; it.done = true;
        setTimeout(() => { UI().giveCoins(it.reward); UI().toast(`Quest done: ${it.text} (+${it.reward})`, '✅'); }, 600);
      }
    });
    if (!q.bonus && q.list.every((x) => x.done)) {
      q.bonus = true;
      setTimeout(() => { UI().giveCoins(100); UI().toast('All daily quests done! +100 bonus', '🏆'); Store.badge('quests'); }, 1500);
    }
    Store.save();
  }

  function multiplier() { return killZoneAt().active ? BOOST : 1; }

  const fmtLeft = (ms) => {
    const m = Math.max(0, Math.round(ms / 60000));
    if (m >= 1440) return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
    return `${m}m`;
  };
  function weekLeft() { return fmtLeft(weekStart().getTime() + 7 * 86400000 - Date.now()); }

  function shield(tier, cls) {
    const [a, b] = TIERS[tier].colors, id = 'sh' + tier + Math.random().toString(36).slice(2, 6);
    return `<svg class="${cls || 'shield'}" viewBox="0 0 48 52" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <path d="M24 2 44 9v15c0 13-8.5 22.5-20 26C12.5 46.5 4 37 4 24V9z" fill="url(#${id})"/>
      <path d="M24 8 39 13.5V24c0 9.8-6.2 17.2-15 20.2C15.2 41.2 9 33.8 9 24V13.5z" fill="#fff" fill-opacity=".18"/>
      <text x="24" y="30" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="700" font-size="15" fill="#fff">${tier + 1}</text></svg>`;
  }

  // ---------------------------------------------------------------- home cards
  function homeCards() {
    ensureWeek(); ensureQuests();
    const U = UI(), kz = killZoneAt();
    const table = leagueTable(S.weekKey, S.league || 0, S.name, S.weekXP || 0, weekProgress());
    const me = table.find((r) => r.me);
    const q = S.quests;
    const zoneCard = kz.active
      ? `<button class="kz-card live"><span class="kz-dot"></span><div><b>${kz.zone.name} kill zone is live</b><small>2× coins on take profits · ${fmtLeft(kz.endsAt - Date.now())} left</small></div><span class="kz-x">2×</span></button>`
      : `<button class="kz-card"><span class="kz-dot off"></span><div><b>Next kill zone: ${kz.zone.name}</b><small>Starts in ${fmtLeft(kz.startsAt - Date.now())} · 2× coins on take profits</small></div><span class="kz-x off">2×</span></button>`;
    const league = `<button class="league-card">${shield(S.league || 0)}<div><b>${TIERS[S.league || 0].name} league · #${me.rank}</b><small>${(S.weekXP || 0).toLocaleString()} coins this week · ends in ${weekLeft()}</small></div><span class="lc-go">${G.CQIcons.ic('back', 'flip')}</span></button>`;
    const quests = `<section class="quests"><div class="q-head"><b>Daily quests</b><small>${q.list.filter((x) => x.done).length} of 3 · +100 bonus for all 3</small></div>${q.list.map((it) => `<div class="quest ${it.done ? 'done' : ''}"><span class="q-check">${it.done ? G.CQIcons.ic('check') : ''}</span><div class="q-body"><span>${U.esc(it.text)}</span><i class="q-bar"><i style="width:${Math.round((it.progress / it.target) * 100)}%"></i></i></div><span class="q-rew">+${it.reward}</span></div>`).join('')}</section>`;
    return { zoneCard, league, quests };
  }

  function explainKillZones() {
    const kz = killZoneAt();
    const rows = ZONES.map((z) => {
      const t = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
      return `<li><b>${z.name}</b> · ${t(z.from)}–${t(z.to)} New York time<br><small>${z.blurb}</small></li>`;
    }).join('');
    const m = document.createElement('div');
    m.className = 'modal-back';
    m.innerHTML = `<div class="modal"><h2>Kill zones</h2><p>Kill zones are the hours when the big players trade, so price moves the most. Pro traders plan their day around them. In Wickd, every take profit during a kill zone pays <b>2× coins</b>.</p><ul>${rows}</ul><p class="tiny">${kz.active ? `${kz.zone.name} is live right now.` : `Next up: ${kz.zone.name}, in ${fmtLeft(kz.startsAt - Date.now())}.`}</p><div class="modal-actions"><button class="btn btn-flame close">Got it</button></div></div>`;
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.close')) m.remove(); });
    document.body.appendChild(m);
  }

  // ---------------------------------------------------------------- league screen
  function leagueScreen() {
    ensureWeek();
    const U = UI();
    const tier = S.league || 0;
    const table = leagueTable(S.weekKey, tier, S.name, S.weekXP || 0, weekProgress());
    const root = U.el(`<main class="screen league">
      <section class="league-hero">
        ${shield(tier, 'shield big')}
        <h2>${TIERS[tier].name} league</h2>
        <p class="tiny">Top ${PROMOTE} move up · bottom ${DEMOTE} drop · ends in ${weekLeft()}</p>
        <div class="tier-row">${TIERS.map((t, i) => `<span class="tier-pip ${i === tier ? 'on' : i < tier ? 'past' : ''}" title="${t.name}">${shield(i, 'shield tiny')}</span>`).join('')}</div>
      </section>
      <p class="lead small">Score = coins you earn this week from trading, quests and missions. Kill zones count double.</p>
      <ol class="lb"></ol>
      <p class="tiny center">AI rival traders fill the league until online leagues launch.</p>
    </main>`);
    const ol = root.querySelector('.lb');
    table.forEach((r) => {
      const zone = r.rank <= PROMOTE && tier < TIERS.length - 1 ? 'up' : r.rank > LEAGUE_SIZE - DEMOTE && tier > 0 ? 'down' : '';
      const li = U.el(`<li class="lb-row ${r.me ? 'me' : ''} ${zone}"><span class="lb-rank">${r.rank}</span><span class="lb-av">${r.me ? G.CQMascot.avatarSVG(S.name, S.hat) : `<i>${U.esc(r.name.charAt(0))}</i>`}</span><span class="lb-name">${U.esc(r.me ? (S.name || 'You') + ' (you)' : r.name)}${r.ai ? '<em>AI</em>' : ''}</span><b class="lb-score">${r.score.toLocaleString()}</b></li>`);
      ol.appendChild(li);
      if (r.rank === PROMOTE && tier < TIERS.length - 1) ol.appendChild(U.el('<li class="lb-cut up">Promotion zone</li>'));
      if (r.rank === LEAGUE_SIZE - DEMOTE && tier > 0) ol.appendChild(U.el('<li class="lb-cut down">Demotion zone</li>'));
    });
    U.app.append(U.hud(null, 'League'), root, U.nav('league'));
    const meRow = root.querySelector('.lb-row.me');
    if (meRow) setTimeout(() => meRow.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }

  // Show last week's result once.
  function maybeShowResult() {
    const r = S.leagueResult;
    if (!r || r.seen) return;
    r.seen = true; Store.save();
    const moved = r.to > r.from ? `You moved up to <b>${TIERS[r.to].name}</b>!` : r.to < r.from ? `You dropped to <b>${TIERS[r.to].name}</b>. Win it back this week.` : `You stay in <b>${TIERS[r.to].name}</b>.`;
    const m = document.createElement('div');
    m.className = 'modal-back';
    m.innerHTML = `<div class="modal center">${shield(r.to, 'shield big')}<h2>Last week: #${r.rank}</h2><p>${moved}</p>${r.reward ? `<p class="tiny">League reward: +${r.reward} coins</p>` : ''}<div class="modal-actions"><button class="btn btn-flame close">Let's go</button></div></div>`;
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.close')) m.remove(); });
    document.body.appendChild(m);
    if (r.to > r.from) UI().confetti(80);
  }

  G.CQMeta = { killZoneAt, weekKey, weekProgress, leagueTable, rivalsFor, settle, questsFor, TIERS, ZONES, LEAGUE_SIZE,
    ensureWeek, ensureQuests, track, multiplier, homeCards, leagueScreen, maybeShowResult, explainKillZones, fmtLeft, shield };
})(typeof window !== 'undefined' ? window : globalThis);
