/* Candle Quest — screens, game loop and UI. */
(function () {
  'use strict';
  const { WORLDS, WORLD_KEYS, THEMES, HATS, BADGES, PRAISE, OOPS } = window.CQData;
  const Store = window.CQStore;
  const S = Store.state;
  const { owlSVG } = window.CQMascot;
  const Scen = window.CQScenarios;
  const ChartView = window.CQChart;

  const app = document.getElementById('app');
  let chart = null;
  let timers = [];

  // ---------- helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const theme = () => THEMES.find((t) => t.id === S.theme) || THEMES[0];
  const lvKey = (w, l) => WORLDS[w].id + '-' + l;
  const starsOf = (w, l) => S.stars[lvKey(w, l)] || 0;
  const worldDone = (w) => WORLDS[w].levels.every((_, l) => starsOf(w, l) > 0);
  const worldOpen = (w) => w === 0 || worldDone(w - 1);
  const levelOpen = (w, l) => worldOpen(w) && (l === 0 || starsOf(w, l - 1) > 0);

  function clearTimers() { timers.forEach(clearInterval); timers.forEach(clearTimeout); timers = []; }
  function go(fn, arg) {
    clearTimers();
    if (chart) { chart.destroy(); chart = null; }
    app.innerHTML = '';
    app.scrollTop = 0;
    window.scrollTo(0, 0);
    fn(arg);
  }
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function on(root, sel, fn) {
    root.querySelectorAll(sel).forEach((n) => n.addEventListener('click', (e) => { Store.sfx.tap(); fn(e, n); }));
  }

  function toast(text, emoji) {
    const t = el(`<div class="toast"><span class="toast-emoji">${emoji || '🏅'}</span><span>${esc(text)}</span></div>`);
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600);
  }
  Store.onBadge((id) => {
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => toast('New badge: ' + b.name, b.emoji), 300);
  });

  function confetti(n) {
    const colors = ['#f59e0b', '#16a34a', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    for (let i = 0; i < (n || 60); i++) {
      const c = el('<i class="confetti"></i>');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = pick(colors);
      c.style.animationDelay = Math.random() * 0.4 + 's';
      c.style.animationDuration = 1.4 + Math.random() * 1.2 + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3200);
    }
  }

  function giveCoins(n) {
    const lvlUp = Store.addCoins(n);
    Store.sfx.coin();
    const c = $('.hud-coins b');
    if (c) { c.textContent = S.coins; c.parentElement.classList.remove('bump'); void c.offsetWidth; c.parentElement.classList.add('bump'); }
    if (lvlUp) setTimeout(() => { toast('Level up! You are now level ' + Store.levelInfo(S.xp).lvl, '⬆️'); Store.sfx.win(); }, 500);
  }

  function hud(backFn, title) {
    const li = Store.levelInfo(S.xp);
    const bar = el(`<header class="hud">
      ${backFn ? '<button class="icon-btn back" aria-label="Back">←</button>' : '<div class="hud-brand">🕯️ Candle Quest</div>'}
      ${title ? `<div class="hud-title">${esc(title)}</div>` : ''}
      <div class="hud-right">
        <div class="hud-level" title="Player level"><span>Lv ${li.lvl}</span><i style="width:${Math.round(li.pct * 100)}%"></i></div>
        <div class="hud-coins">🪙 <b>${S.coins}</b></div>
      </div>
    </header>`);
    if (backFn) on(bar, '.back', backFn);
    return bar;
  }

  // ---------- HOME ----------
  function home() {
    if (!S.name) return go(welcome);
    const li = Store.levelInfo(S.xp);
    const greet = pick([
      `Hoot hoot, ${S.name}! Ready to read some charts?`,
      `Welcome back, ${S.name}! The candles missed you 🕯️`,
      `${S.name}, let's hunt some liquidity today! 💧`,
      `Every chart tells a story, ${S.name}. Let's read one!`,
    ]);
    const done = WORLDS.reduce((a, w, wi) => a + w.levels.filter((_, l) => starsOf(wi, l) > 0).length, 0);
    const total = WORLDS.reduce((a, w) => a + w.levels.length, 0);
    const scr = el(`<main class="screen home">
      <section class="hero">
        <div class="bubble">${esc(greet)}</div>
        <div class="hero-owl">${owlSVG(S.hat, 'happy')}</div>
      </section>
      <section class="stats-row">
        <div class="stat"><b>${li.lvl}</b><span>Level</span></div>
        <div class="stat"><b>${done}/${total}</b><span>Missions</span></div>
        <div class="stat"><b>${S.badges.length}</b><span>Badges</span></div>
      </section>
      ${Store.dailyAvailable() ? `<button class="daily card-pop"><span class="daily-emoji">🎁</span><span><b>Daily Treasure is ready!</b><small>Come back every day to grow your streak</small></span><span class="daily-go">Open</span></button>` : `<div class="daily claimed"><span class="daily-emoji">🔥</span><span><b>${S.streak}-day streak</b><small>Next treasure tomorrow</small></span></div>`}
      <button class="btn btn-play">▶ Play Adventure</button>
      <div class="grid2">
        <button class="tile t-practice"><span>🎯</span>Practice Arena<small>Farm coins!</small></button>
        <button class="tile t-shop"><span>🛍️</span>Shop<small>Hats & chart themes</small></button>
        <button class="tile t-badges"><span>🏅</span>Badges<small>${S.badges.length}/${BADGES.length} earned</small></button>
        <button class="tile t-learn"><span>📖</span>Lessons<small>Review the basics</small></button>
      </div>
      <footer class="home-foot">
        <button class="link sound">${S.sound ? '🔊 Sound on' : '🔇 Sound off'}</button>
        <button class="link grownups">👪 For grown-ups</button>
      </footer>
    </main>`);
    app.append(hud(null), scr);
    on(scr, '.btn-play', () => go(map));
    on(scr, '.t-practice', () => go(practiceIntro));
    on(scr, '.t-shop', () => go(shop));
    on(scr, '.t-badges', () => go(badges));
    on(scr, '.t-learn', () => go(lessonPicker));
    on(scr, '.sound', () => { S.sound = !S.sound; Store.save(); go(home); });
    on(scr, '.grownups', () => grownups());
    on(scr, 'button.daily', () => {
      const r = Store.claimDaily();
      if (r) {
        Store.sfx.win(); confetti(40);
        toast(`+${r} coins! Streak: ${S.streak} day${S.streak > 1 ? 's' : ''}`, '🎁');
        setTimeout(() => go(home), 900);
      }
    });
  }

  function welcome() {
    const scr = el(`<main class="screen welcome">
      <div class="hero-owl big">${owlSVG('none', 'wow')}</div>
      <h1>Candle Quest</h1>
      <p class="lead">Hi! I'm <b>Pip</b>, the chart owl 🦉<br>I'll teach you to read price charts like a pro trader — one level at a time.</p>
      <label class="name-label">What's your trader nickname?
        <input class="name-input" maxlength="14" placeholder="e.g. ChartChamp" autocomplete="off">
      </label>
      <p class="tiny">Use a nickname, not your real name 🙂</p>
      <button class="btn btn-play go">Let's go! 🚀</button>
    </main>`);
    app.append(scr);
    const inp = $('.name-input', scr);
    const start = () => {
      S.name = (inp.value.trim() || 'Trader').slice(0, 14);
      Store.save();
      go(home);
    };
    on(scr, '.go', start);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  }

  function grownups() {
    const m = modal(`<h2>👪 For grown-ups</h2>
      <p><b>Candle Quest</b> teaches chart reading using concepts from the ICT ("Inner Circle Trader") method: candles, swing points, liquidity, fair value gaps, order blocks and market structure.</p>
      <ul>
        <li>All charts are computer-generated practice charts — not real market data.</li>
        <li>Coins are play money only. There are no ads, no purchases and no chat.</li>
        <li>Progress is saved only on this device.</li>
        <li>Nothing here is financial advice. Real trading carries real risk.</li>
      </ul>
      <div class="modal-actions"><button class="btn btn-ghost reset">Reset all progress</button><button class="btn close">Close</button></div>`);
    on(m, '.close', () => m.remove());
    on(m, '.reset', (e, b) => {
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Tap again to erase everything'; b.classList.add('danger'); return; }
      Store.reset(); m.remove(); go(home);
    });
  }

  function modal(inner) {
    const m = el(`<div class="modal-back"><div class="modal">${inner}</div></div>`);
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  }

  // ---------- MAP ----------
  function map(scrollTo) {
    const scr = el('<main class="screen map"></main>');
    WORLDS.forEach((w, wi) => {
      const open = worldOpen(wi);
      const got = w.levels.reduce((a, _, l) => a + starsOf(wi, l), 0);
      const card = el(`<section class="world ${open ? '' : 'locked'}" style="--wc:${w.color}" id="world-${wi}">
        <div class="world-head">
          <span class="world-emoji">${open ? w.emoji : '🔒'}</span>
          <div><h2>World ${wi + 1}: ${esc(w.name)}</h2><p>${esc(w.blurb)}</p></div>
        </div>
        <div class="world-meta"><span>⭐ ${got}/${w.levels.length * 3}</span>${open ? '<button class="chip lesson-btn">📖 Lesson</button>' : '<span class="chip">Finish the world before to unlock</span>'}</div>
        <div class="levels"></div>
      </section>`);
      const lv = $('.levels', card);
      w.levels.forEach((L, li) => {
        const st = starsOf(wi, li);
        const ok = levelOpen(wi, li);
        const isBoss = li === w.levels.length - 1;
        const node = el(`<button class="level-node ${ok ? '' : 'locked'} ${st ? 'done' : ''} ${isBoss ? 'boss' : ''}" ${ok ? '' : 'disabled'}>
          <span class="ln-num">${ok ? (isBoss ? '👑' : li + 1) : '🔒'}</span>
          <span class="ln-name">${esc(L.name)}</span>
          <span class="ln-stars">${[0, 1, 2].map((k) => `<i class="${k < st ? 'on' : ''}">★</i>`).join('')}</span>
        </button>`);
        if (ok) node.addEventListener('click', () => {
          Store.sfx.tap();
          if (!S.seenLessons[w.id]) go(lesson, { w: wi, then: { w: wi, l: li } });
          else go(play, { mode: 'level', w: wi, l: li });
        });
        lv.appendChild(node);
      });
      if (open) on(card, '.lesson-btn', () => go(lesson, { w: wi }));
      scr.appendChild(card);
    });
    app.append(hud(() => go(home), 'Adventure Map'), scr);
    // scroll to the newest open world
    let target = scrollTo;
    if (target == null) { target = 0; WORLDS.forEach((_, wi) => { if (worldOpen(wi)) target = wi; }); }
    const n = document.getElementById('world-' + target);
    if (n && target > 0) setTimeout(() => n.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  // ---------- LESSONS ----------
  function lessonPicker() {
    const scr = el('<main class="screen picker"><h2 class="section-title">📖 Lessons</h2></main>');
    WORLDS.forEach((w, wi) => {
      const ok = worldOpen(wi);
      const b = el(`<button class="pick-row ${ok ? '' : 'locked'}" ${ok ? '' : 'disabled'} style="--wc:${w.color}"><span>${ok ? w.emoji : '🔒'}</span><b>${esc(w.name)}</b><small>${w.lesson.map((p) => esc(p.title)).join(' · ')}</small></button>`);
      if (ok) b.addEventListener('click', () => go(lesson, { w: wi, back: lessonPicker }));
      scr.appendChild(b);
    });
    app.append(hud(() => go(home), 'Lessons'), scr);
  }

  function lesson(opt) {
    const w = WORLDS[opt.w];
    let page = 0;
    const scr = el(`<main class="screen lesson" style="--wc:${w.color}">
      <div class="lesson-card">
        <div class="lesson-top"><span class="world-emoji">${w.emoji}</span><span class="lesson-step"></span></div>
        <h2 class="lesson-title"></h2>
        <div class="chart-host lesson-chart"></div>
        <div class="lesson-text"><div class="mini-owl">${owlSVG(S.hat, 'happy', 'owl mini')}</div><p></p></div>
      </div>
      <div class="lesson-nav"><button class="btn btn-ghost prev">← Back</button><button class="btn next">Next →</button></div>
    </main>`);
    app.append(hud(() => go(opt.back || map, opt.back ? undefined : opt.w), w.name), scr);
    const host = $('.lesson-chart', scr);
    function render() {
      const p = w.lesson[page];
      $('.lesson-step', scr).textContent = `Lesson ${page + 1} of ${w.lesson.length}`;
      $('.lesson-title', scr).textContent = p.title;
      $('.lesson-text p', scr).textContent = p.text;
      $('.prev', scr).style.visibility = page ? 'visible' : 'hidden';
      $('.next', scr).textContent = page === w.lesson.length - 1 ? (opt.then ? 'Start level! 🚀' : 'Done ✓') : 'Next →';
      if (chart) { chart.destroy(); chart = null; host.innerHTML = ''; }
      if (p.demo) {
        host.style.display = '';
        const sc = Scen.generate(p.demo);
        chart = new ChartView(host);
        const marks = sc.kind === 'tap' && sc.answers.length <= 2 ? sc.answers.map((i) => ({ i, type: 'good' })) : [];
        chart.set({ candles: sc.candles, visible: sc.candles.length, ann: sc.annBefore.concat(sc.ann), marks, theme: theme() });
      } else host.style.display = 'none';
    }
    on(scr, '.prev', () => { page = Math.max(0, page - 1); render(); });
    on(scr, '.next', () => {
      if (page < w.lesson.length - 1) { page++; render(); return; }
      S.seenLessons[w.id] = true; Store.save();
      if (opt.then) go(play, { mode: 'level', w: opt.then.w, l: opt.then.l });
      else go(opt.back || map, opt.back ? undefined : opt.w);
    });
    render();
  }

  // ---------- GAME ----------
  function practiceIntro() {
    const keys = practiceKeys();
    const scr = el(`<main class="screen practice-intro">
      <div class="hero-owl">${owlSVG(S.hat, 'wow')}</div>
      <h2>🎯 Practice Arena</h2>
      <p class="lead">Endless charts from every world you've unlocked. You have <b>3 hearts</b> ❤️❤️❤️ — how long can your streak go?</p>
      <p class="tiny">Each correct answer = <b>+5 🪙</b>. Best streak: <b>${S.practiceBest}</b></p>
      <p class="tiny">Concepts in the mix: ${keys.length}</p>
      <button class="btn btn-play go">Start practice</button>
    </main>`);
    app.append(hud(() => go(home), 'Practice'), scr);
    on(scr, '.go', () => go(play, { mode: 'practice' }));
  }
  function practiceKeys() {
    const k = new Set();
    WORLDS.forEach((_, wi) => { if (worldOpen(wi)) WORLD_KEYS[wi].forEach((x) => k.add(x)); });
    return Array.from(k);
  }

  function play(cfg) {
    const g = {
      mode: cfg.mode, w: cfg.w, l: cfg.l,
      rounds: cfg.mode === 'level' ? WORLDS[cfg.w].levels[cfg.l].rounds.slice() : null,
      idx: 0, mistakes: 0, correct: 0, earned: 0, hearts: 3, streak: 0, busy: false,
    };
    const title = g.mode === 'level' ? WORLDS[g.w].levels[g.l].name : 'Practice Arena';
    const scr = el(`<main class="screen game">
      <div class="progress"></div>
      <div class="prompt"><div class="mini-owl">${owlSVG(S.hat, 'happy', 'owl mini')}</div><p></p></div>
      <div class="chart-wrap"><div class="chart-host game-chart"></div><div class="concept-tag"></div></div>
      <div class="actions"></div>
      <div class="feedback" hidden></div>
    </main>`);
    app.append(hud(() => {
      if (g.mode === 'practice' && g.correct > 0) finishPractice(g);
      else go(g.mode === 'level' ? map : home, g.mode === 'level' ? g.w : undefined);
    }, title), scr);
    chart = new ChartView($('.game-chart', scr));
    nextRound(g, scr);
  }

  function renderProgress(g, scr) {
    const p = $('.progress', scr);
    if (g.mode === 'level') {
      p.innerHTML = g.rounds.map((_, i) => `<i class="${g.results[i] === true ? 'ok' : g.results[i] === false ? 'no' : i === g.idx ? 'cur' : ''}"></i>`).join('');
    } else {
      p.innerHTML = `<span class="hearts">${'❤️'.repeat(g.hearts)}${'🤍'.repeat(3 - g.hearts)}</span><span class="streak">🔥 Streak ${g.streak}</span>`;
    }
  }

  function nextRound(g, scr) {
    g.results = g.results || [];
    g.busy = false;
    const key = g.mode === 'level' ? g.rounds[g.idx] : pick(practiceKeys());
    const sc = Scen.generate(key);
    g.sc = sc;
    renderProgress(g, scr);
    $('.prompt p', scr).textContent = sc.prompt;
    $('.prompt .mini-owl', scr).innerHTML = owlSVG(S.hat, 'happy', 'owl mini');
    $('.concept-tag', scr).textContent = sc.concept;
    const fb = $('.feedback', scr);
    fb.hidden = true; fb.innerHTML = '';
    chart.set({ candles: sc.candles, visible: sc.visible, ann: sc.annBefore.slice(), marks: [], theme: theme() });

    const act = $('.actions', scr);
    act.innerHTML = '';
    if (sc.kind === 'tap') {
      act.innerHTML = '<div class="tap-hint">👆 Tap a candle on the chart</div>';
      chart.onTap = (hit) => answerTap(g, scr, hit);
    } else {
      chart.onTap = null;
      sc.choices.forEach((c) => {
        const b = el(`<button class="btn choice ${sc.kind === 'trade' ? 'trade-' + c.id : ''}">${esc(c.label)}</button>`);
        b.addEventListener('click', () => answerChoice(g, scr, c.id, b));
        act.appendChild(b);
      });
    }
  }

  function answerTap(g, scr, hit) {
    if (g.busy) return;
    g.busy = true;
    const sc = g.sc;
    let i = hit.i;
    let ok = sc.answers.includes(i);
    // Small fingers: if a correct candle is right next to the tap, count it.
    if (!ok && sc.answers.length <= 2) {
      const near = sc.answers.find((a) => Math.abs(hit.raw - a) <= 0.95);
      if (near != null) { ok = true; i = near; }
    }
    const marks = [{ i, type: ok ? 'good' : 'bad' }];
    if (!ok && sc.answers.length <= 3) sc.answers.forEach((a) => marks.push({ i: a, type: 'answer' }));
    chart.update({ marks, ann: sc.annBefore.concat(sc.ann) });
    resolve(g, scr, ok);
  }

  function answerChoice(g, scr, id, btn) {
    if (g.busy) return;
    g.busy = true;
    const sc = g.sc;
    const ok = id === sc.answer;
    scr.querySelectorAll('.choice').forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? 'right' : 'wrong');
    if (sc.visible < sc.candles.length) {
      // play the future forward (trade: target/stop lines replace the hint lines)
      const before = sc.kind === 'trade' ? sc.annBefore.filter((a) => a.t !== 'line') : sc.annBefore;
      chart.update({ ann: before.concat(sc.ann) });
      let v = sc.visible;
      const t = setInterval(() => {
        v++;
        chart.update({ visible: v });
        if (v >= sc.candles.length) {
          clearInterval(t);
          resolve(g, scr, ok);
        }
      }, 150);
      timers.push(t);
      $('.actions', scr).insertAdjacentHTML('beforeend', '<div class="tap-hint watching">👀 Watch what happens…</div>');
    } else {
      chart.update({ ann: sc.annBefore.concat(sc.ann) });
      resolve(g, scr, ok);
    }
  }

  function resolve(g, scr, ok) {
    const sc = g.sc;
    let reward = 0;
    if (ok) {
      reward = g.mode === 'practice' ? 5 : sc.kind === 'trade' ? 30 : 10;
      g.correct++; g.streak++;
      g.earned += reward;
      giveCoins(reward);
      Store.sfx.good();
      if (sc.kind === 'trade') { S.tradesWon++; Store.save(); if (S.tradesWon >= 5) Store.badge('win5'); }
      if (g.mode === 'practice') {
        if (g.streak > S.practiceBest) { S.practiceBest = g.streak; Store.save(); }
        if (g.streak >= 10) Store.badge('practice10');
        if (g.streak >= 25) Store.badge('practice25');
      }
    } else {
      g.mistakes++;
      if (g.mode === 'practice') { g.hearts--; }
      g.streak = 0;
      Store.sfx.bad();
    }
    if (g.mode === 'level') g.results[g.idx] = ok;
    $('.prompt .mini-owl', scr).innerHTML = owlSVG(S.hat, ok ? 'wow' : 'sad', 'owl mini');

    let tradeLine = '';
    if (sc.kind === 'trade') {
      tradeLine = ok
        ? '<p class="trade-res win">🎯 Target hit! Your pretend trade WON.</p>'
        : `<p class="trade-res loss">🛑 That trade would have lost. The right call was <b>${sc.answer.toUpperCase()}</b>.</p>`;
    }
    const lastRound = g.mode === 'level' ? g.idx >= g.rounds.length - 1 : g.hearts <= 0;
    const fb = $('.feedback', scr);
    fb.className = 'feedback ' + (ok ? 'is-ok' : 'is-bad');
    fb.innerHTML = `<div class="fb-head"><b>${ok ? pick(PRAISE) : pick(OOPS)}</b>${reward ? `<span class="fb-coins">+${reward} 🪙</span>` : ''}</div>
      ${tradeLine}<p>${esc(sc.explain)}</p>
      <button class="btn next">${lastRound ? 'See results ▶' : 'Next ▶'}</button>`;
    fb.hidden = false;
    $('.actions', scr).innerHTML = '';
    renderProgress(g, scr);
    setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    on(fb, '.next', () => {
      if (g.mode === 'practice') {
        if (g.hearts <= 0) return finishPractice(g);
        return nextRound(g, scr);
      }
      if (lastRound) return finishLevel(g);
      g.idx++;
      nextRound(g, scr);
    });
  }

  function finishLevel(g) {
    const n = g.rounds.length;
    const need = Math.ceil(n * 0.6);
    const passed = g.correct >= need;
    const stars = !passed ? 0 : g.mistakes === 0 ? 3 : g.mistakes === 1 ? 2 : 1;
    const key = lvKey(g.w, g.l);
    const prev = S.stars[key] || 0;
    const firstClear = passed && !prev;
    let bonus = 0;
    if (passed) {
      bonus = stars * 15 + (firstClear ? 25 : 0);
      S.stars[key] = Math.max(prev, stars);
      Store.save();
      giveCoins(bonus);
      Store.badge('first');
      if (stars === 3) Store.badge('perfect');
      if (worldDone(g.w)) Store.badge(WORLDS[g.w].id);
    }
    go(() => {
      const w = WORLDS[g.w];
      const hasNext = g.l < w.levels.length - 1 || g.w < WORLDS.length - 1;
      const scr = el(`<main class="screen result">
        <div class="hero-owl">${owlSVG(S.hat, passed ? 'wow' : 'sad')}</div>
        <h2>${passed ? (stars === 3 ? 'PERFECT! 🏆' : 'Level complete!') : 'Almost there!'}</h2>
        <div class="big-stars">${[0, 1, 2].map((k) => `<i class="${k < stars ? 'on' : ''}" style="animation-delay:${0.2 + k * 0.25}s">★</i>`).join('')}</div>
        <p class="lead">${g.correct} of ${n} correct${passed ? '' : ` — you need ${need} to pass. You can do it!`}</p>
        <div class="earn"><div><b>+${g.earned}</b><span>answers</span></div><div><b>+${bonus}</b><span>level bonus</span></div><div><b>🪙 ${S.coins}</b><span>total</span></div></div>
        <div class="result-actions">
          ${passed && hasNext ? '<button class="btn btn-play nextlvl">Next level ▶</button>' : ''}
          <button class="btn ${passed ? 'btn-ghost' : 'btn-play'} retry">↻ ${passed ? 'Replay for more stars' : 'Try again'}</button>
          <button class="btn btn-ghost tomap">🗺️ Map</button>
        </div>
      </main>`);
      app.append(hud(() => go(map, g.w), w.name), scr);
      if (passed) { Store.sfx.win(); if (stars === 3) confetti(80); }
      on(scr, '.retry', () => go(play, { mode: 'level', w: g.w, l: g.l }));
      on(scr, '.tomap', () => go(map, g.w));
      on(scr, '.nextlvl', () => {
        let nw = g.w, nl = g.l + 1;
        if (nl >= w.levels.length) { nw++; nl = 0; }
        if (!S.seenLessons[WORLDS[nw].id]) go(lesson, { w: nw, then: { w: nw, l: nl } });
        else go(play, { mode: 'level', w: nw, l: nl });
      });
      if (passed && worldDone(g.w) && g.l === w.levels.length - 1 && firstClear) {
        setTimeout(() => toast(g.w < WORLDS.length - 1 ? `${WORLDS[g.w + 1].name} unlocked!` : 'You beat the whole game! 👑', '🗺️'), 900);
      }
    });
  }

  function finishPractice(g) {
    go(() => {
      const scr = el(`<main class="screen result">
        <div class="hero-owl">${owlSVG(S.hat, 'wow')}</div>
        <h2>Practice complete!</h2>
        <p class="lead">You answered <b>${g.correct}</b> right and earned <b>${g.earned} 🪙</b>.</p>
        <div class="earn"><div><b>${g.correct}</b><span>correct</span></div><div><b>${S.practiceBest}</b><span>best streak</span></div><div><b>🪙 ${S.coins}</b><span>total</span></div></div>
        <div class="result-actions"><button class="btn btn-play again">↻ Play again</button><button class="btn btn-ghost home">🏠 Home</button></div>
      </main>`);
      app.append(hud(() => go(home), 'Practice'), scr);
      on(scr, '.again', () => go(play, { mode: 'practice' }));
      on(scr, '.home', () => go(home));
    });
  }

  // ---------- SHOP ----------
  function shop(tab) {
    tab = tab || 'hats';
    const scr = el(`<main class="screen shop">
      <div class="tabs"><button class="tab ${tab === 'hats' ? 'on' : ''}" data-t="hats">🎩 Hats for Pip</button><button class="tab ${tab === 'themes' ? 'on' : ''}" data-t="themes">🎨 Chart themes</button></div>
      <div class="shop-grid"></div>
    </main>`);
    const grid = $('.shop-grid', scr);
    const items = tab === 'hats' ? HATS : THEMES;
    const ownedList = tab === 'hats' ? S.owned.hats : S.owned.themes;
    const equipped = tab === 'hats' ? S.hat : S.theme;
    items.forEach((it) => {
      const own = ownedList.includes(it.id);
      const eq = equipped === it.id;
      const preview = tab === 'hats'
        ? `<div class="shop-owl">${owlSVG(it.id, 'happy')}</div>`
        : `<div class="swatch" style="background:${it.bg}">${[3, 5, 2, 6, 4, 7, 5].map((hgt, i) => `<i style="height:${hgt * 8}px;background:${i % 3 === 2 ? it.down : it.up}"></i>`).join('')}</div>`;
      const card = el(`<div class="shop-item ${eq ? 'equipped' : ''}">${preview}<b>${esc(it.name)}</b>
        <button class="btn small ${own ? (eq ? 'btn-ghost' : '') : 'buy'}" ${eq ? 'disabled' : ''}>${eq ? 'Equipped ✓' : own ? 'Equip' : `🪙 ${it.price}`}</button></div>`);
      on(card, 'button', () => {
        if (!own) {
          if (S.coins < it.price) { Store.sfx.bad(); toast(`You need ${it.price - S.coins} more coins — try Practice Arena!`, '🪙'); return; }
          S.coins -= it.price;
          ownedList.push(it.id);
          Store.badge('shopper');
          Store.sfx.win();
        }
        if (tab === 'hats') S.hat = it.id; else S.theme = it.id;
        Store.save();
        go(shop, tab);
      });
      grid.appendChild(card);
    });
    app.append(hud(() => go(home), 'Shop'), scr);
    scr.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => go(shop, b.dataset.t)));
  }

  // ---------- BADGES ----------
  function badges() {
    const scr = el(`<main class="screen badges"><p class="lead center">${S.badges.length} of ${BADGES.length} badges earned</p><div class="badge-grid"></div></main>`);
    const grid = $('.badge-grid', scr);
    BADGES.forEach((b) => {
      const got = S.badges.includes(b.id);
      grid.appendChild(el(`<div class="badge ${got ? 'got' : ''}"><span>${got ? b.emoji : '❔'}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>`));
    });
    app.append(hud(() => go(home), 'Badges'), scr);
  }

  // ---------- boot ----------
  go(home);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.CQ_SINGLE_FILE) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
