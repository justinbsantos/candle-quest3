/* Run: node tests/scenarios.test.js
 * Generates hundreds of charts per scenario and checks that every one is a
 * valid chart and that the "correct answer" really is correct.
 */
'use strict';
require('../js/scenarios.js');
const { generate, keys, findFVGs } = globalThis.CQScenarios;

const N = 400;
let failures = 0;
function fail(key, seed, msg) {
  failures++;
  if (failures < 40) console.log(`FAIL ${key} seed=${seed}: ${msg}`);
}
const EPS = 1e-9;

for (const key of keys) {
  for (let n = 0; n < N; n++) {
    const seed = n * 7919 + 13;
    const sc = generate(key, seed);
    const cs = sc.candles;
    const f = (m) => fail(key, seed, m);

    // candles are well-formed and continuous
    cs.forEach((k, i) => {
      if (!(k.h + EPS >= Math.max(k.o, k.c))) f(`candle ${i} high below body`);
      if (!(k.l - EPS <= Math.min(k.o, k.c))) f(`candle ${i} low above body`);
      if (i > 0 && Math.abs(k.o - cs[i - 1].c) > 1e-6) f(`candle ${i} open gap`);
      if (![k.o, k.c, k.h, k.l].every(Number.isFinite)) f(`candle ${i} NaN`);
    });
    if (sc.visible < 3 || sc.visible > cs.length) f('bad visible');

    if (sc.kind === 'tap') {
      if (!sc.answers || !sc.answers.length) f('no answers');
      sc.answers.forEach((a) => { if (a < 0 || a >= sc.visible) f('answer out of range ' + a); });
    } else {
      if (!sc.choices.some((c) => c.id === sc.answer)) f('answer not in choices');
    }

    // concept-specific truth checks
    if (key === 'bsl' || key === 'ssl') {
      const s = sc.answers[0];
      const bull = key === 'ssl';
      const line = sc.annBefore[0].y;
      const beyond = cs.map((k, i) => (bull ? k.l < line - 1e-6 : k.h > line + 1e-6) ? i : -1).filter((i) => i >= 0);
      if (beyond.length !== 1 || beyond[0] !== s) f(`sweep not unique: ${beyond}`);
      const sk = cs[s];
      if (bull ? !(sk.c > line && sk.o > line) : !(sk.c < line && sk.o < line)) f('sweep candle body not back inside');
    }
    if (key === 'sweepPredict') {
      const vis = cs[sc.visible - 1].c, end = cs[cs.length - 1].c;
      if (sc.answer === 'up' ? end <= vis : end >= vis) f('reveal goes wrong way');
    }
    if (key === 'fvgBull' || key === 'fvgBear') {
      if (!sc.answers.includes(sc._designed)) f('designed FVG not detected');
      const fv = findFVGs(cs, key === 'fvgBull' ? 'bull' : 'bear');
      if (fv.join() !== sc.answers.join()) f('answers mismatch FVG detector');
    }
    if (key === 'fvgPredict') {
      const box = sc.annBefore[0];
      const bull = cs[cs.length - 1].c > cs[sc.visible - 1].c;
      // visible part never touched the gap after it formed
      for (let i = box.i0 + 3; i < sc.visible; i++) {
        if (bull ? cs[i].l <= box.y1 : cs[i].h >= box.y0) { f('gap touched before reveal'); break; }
      }
      // reveal enters the gap and then reacts without breaking the far side
      const hid = cs.slice(sc.visible);
      const enters = hid.some((k) => (bull ? k.l < box.y1 : k.h > box.y0));
      const breaks = hid.some((k) => (bull ? k.l < box.y0 : k.h > box.y1));
      if (!enters) f('reveal never enters gap');
      if (breaks) f('reveal breaks through gap');
    }
    if (key === 'obBull' || key === 'obBear') {
      const K = sc.answers[0];
      const k = cs[K];
      const bull = key === 'obBull';
      if (bull ? !(k.c < k.o) : !(k.c > k.o)) f('order block wrong colour');
      for (let i = K + 1; i <= K + 3; i++) if (bull ? !(cs[i].c > cs[i].o) : !(cs[i].c < cs[i].o)) f('no displacement after OB');
    }
    if (key === 'swingHigh' || key === 'swingLow') {
      const p = sc.answers[0];
      const hi = key === 'swingHigh';
      const ext = hi ? Math.max(...cs.map((k) => k.h)) : Math.min(...cs.map((k) => k.l));
      if (Math.abs((hi ? cs[p].h : cs[p].l) - ext) > 1e-9) f('swing point not extreme');
    }
    if (key === 'mss') {
      const a = sc.answers[0];
      if (a < 0) f('no MSS candle');
      const line = sc.annBefore[0];
      const bull = line.label.includes('high');
      for (let i = line.i0 + 1; i < a; i++) if (bull ? cs[i].c > line.y : cs[i].c < line.y) f('earlier close beyond line');
      for (let i = line.i0 + 1; i < a; i++) if (bull ? cs[i].h > line.y : cs[i].l < line.y) f('earlier wick beyond line');
    }
    if (key === 'trade') {
      const t = sc.trade;
      const hid = cs.slice(sc.visible);
      let hitT = -1, hitS = -1;
      hid.forEach((k, i) => {
        if (hitT < 0 && (t.dir === 'buy' ? k.h >= t.target : k.l <= t.target)) hitT = i;
        if (hitS < 0 && (t.dir === 'buy' ? k.l <= t.stop : k.h >= t.stop)) hitS = i;
      });
      if (hitT < 0) f('target never hit');
      if (hitS >= 0 && hitS <= hitT) f('stop hit first');
      if (t.dir === 'buy' ? !(t.stop < t.entry && t.entry < t.target) : !(t.stop > t.entry && t.entry > t.target)) f('bad trade levels');
      // target liquidity untouched before reveal (except the two equal highs themselves)
      const vis = cs.slice(0, sc.visible);
      const touches = vis.filter((k) => (t.dir === 'buy' ? k.h >= t.target - 1e-6 : k.l <= t.target + 1e-6)).length;
      if (touches !== 2) f('target touched ' + touches + ' times before reveal');
      const fv = findFVGs(cs.slice(0, sc.visible), t.dir === 'buy' ? 'bull' : 'bear', 0.5);
      if (!fv.length) f('no FVG in trade setup');
    }
  }
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log(`All good: ${keys.length} scenario types x ${N} charts each passed.`);
