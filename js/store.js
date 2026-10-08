/* Wickd — save game, economy, progression, sounds. */
(function (G) {
  'use strict';
  const KEY = 'candlequest.save.v1';

  const DEFAULT = {
    name: '', coins: 50, xp: 0, totalCoins: 50,
    stars: {}, // "w1-0": 3
    owned: { themes: ['classic'], hats: ['none'] },
    theme: 'classic', hat: 'none',
    lastDaily: null, streak: 0,
    badges: [], practiceBest: 0, tradesWon: 0,
    sound: true, seenLessons: {},
    missionStars: {}, tpTotal: 0, freeHints: 2,
    room: null,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(raw));
    } catch (e) { /* storage blocked: play without saving */ }
    return JSON.parse(JSON.stringify(DEFAULT));
  }

  const state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function reset() {
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, JSON.parse(JSON.stringify(DEFAULT)));
    save();
  }

  // Level curve: level n needs 50*n*(n-1) XP total.
  function levelInfo(xp) {
    let lvl = 1;
    while (xp >= 50 * (lvl + 1) * lvl) lvl++;
    const cur = 50 * lvl * (lvl - 1), next = 50 * (lvl + 1) * lvl;
    return { lvl, pct: (xp - cur) / (next - cur), toNext: next - xp };
  }

  const listeners = [];
  function onBadge(fn) { listeners.push(fn); }

  function addCoins(n) {
    const before = levelInfo(state.xp).lvl;
    state.coins += n;
    state.totalCoins += n;
    state.xp += n;
    if (state.totalCoins >= 1000) badge('rich');
    save();
    return levelInfo(state.xp).lvl > before;
  }

  function badge(id) {
    if (state.badges.includes(id)) return false;
    state.badges.push(id);
    save();
    listeners.forEach((fn) => fn(id));
    return true;
  }

  const dayStr = (d) => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  function dailyAvailable() { return state.lastDaily !== dayStr(new Date()); }
  function claimDaily() {
    if (!dailyAvailable()) return 0;
    const y = new Date(); y.setDate(y.getDate() - 1);
    state.streak = state.lastDaily === dayStr(y) ? state.streak + 1 : 1;
    state.lastDaily = dayStr(new Date());
    const reward = 20 + 10 * Math.min(state.streak, 7);
    addCoins(reward);
    if (state.streak >= 3) badge('streak3');
    if (state.streak >= 7) badge('streak7');
    save();
    return reward;
  }

  // ---- sound (tiny WebAudio blips, no files) ----
  let ac = null;
  function tone(freqs, dur, type) {
    if (!state.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      let t = ac.currentTime;
      freqs.forEach((f) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type || 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination);
        o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.7;
      });
    } catch (e) { /* no audio */ }
  }
  const sfx = {
    good: () => tone([660, 880, 1175], 0.12),
    bad: () => tone([300, 220], 0.18, 'sawtooth'),
    coin: () => tone([988, 1319], 0.08, 'square'),
    tap: () => tone([520], 0.05),
    win: () => tone([523, 659, 784, 1047, 1319], 0.12),
  };

  G.CQStore = { state, save, reset, levelInfo, addCoins, badge, onBadge, dailyAvailable, claimDaily, sfx };
})(window);
