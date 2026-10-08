/* Run: node tests/meta.test.js — leagues, kill zones, quests, compounding math. */
'use strict';
require('../js/scenarios.js');
require('../js/meta.js');
require('../js/pro.js');
const M = globalThis.CQMeta, P = globalThis.CQPro;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };

// kill zones: 8:30am New York is NY AM; noon is not a zone
const at = (iso) => new Date(iso);
ok(M.killZoneAt(at('2026-10-08T12:30:00Z')).active && M.killZoneAt(at('2026-10-08T12:30:00Z')).zone.name === 'New York AM', 'NY AM zone at 8:30 ET');
const noon = M.killZoneAt(at('2026-10-08T16:00:00Z'));
ok(!noon.active && noon.zone.name === 'New York PM', 'noon ET is between zones, next is NY PM');
ok(Math.round((noon.startsAt - at('2026-10-08T16:00:00Z')) / 60000) === 90, 'NY PM starts 90 minutes after noon');
ok(M.killZoneAt(at('2026-10-09T00:30:00Z')).zone.name === 'Asia', '8:30pm ET is Asia');

// weeks start Monday
ok(M.weekKey(new Date(2026, 9, 8)) === M.weekKey(new Date(2026, 9, 5)), 'Thu and Mon same week');
ok(M.weekKey(new Date(2026, 9, 4)) !== M.weekKey(new Date(2026, 9, 5)), 'Sunday is previous week');

// league table: stable, 20 rows, rivals grow over the week, settle rules
const t0 = M.leagueTable('2026-10-5', 0, 'Me', 0, 0.1), t1 = M.leagueTable('2026-10-5', 0, 'Me', 0, 0.1);
ok(t0.length === M.LEAGUE_SIZE && JSON.stringify(t0) === JSON.stringify(t1), 'league deterministic, 20 rows');
const early = M.leagueTable('2026-10-5', 2, 'Me', 0, 0.2).filter((r) => r.ai).reduce((a, r) => a + r.score, 0);
const late = M.leagueTable('2026-10-5', 2, 'Me', 0, 1).filter((r) => r.ai).reduce((a, r) => a + r.score, 0);
ok(late > early, 'rival scores grow through the week');
ok(M.leagueTable('2026-10-5', 0, 'Me', 1e6, 1)[0].me, 'huge score ranks first');
ok(M.settle(1, 0).to === 1 && M.settle(1, 0).reward === 500, 'winner promoted with reward');
ok(M.settle(20, 0).to === 0 && M.settle(20, 3).to === 2 && M.settle(10, 3).to === 3, 'demotion/stay rules');
ok(M.settle(1, 5).to === 5, 'Legend cannot go higher');

// quests: 3, unique types, one is take-profits
for (let d = 1; d <= 60; d++) {
  const q = M.questsFor('2026-10-' + d);
  ok(q.length === 3 && new Set(q.map((x) => x.type)).size === 3 && q[0].type === 'tp', 'quest set ' + d);
}

// compounding: small risk grows, huge risk shrinks with the same edge; no edge never grows
ok(P.project(1000, 1, 0.4, 2, 200) > 1000, '1% risk grows over 200 trades');
ok(P.project(1000, 25, 0.4, 2, 200) < 1000, '25% risk shrinks with the same edge');
ok(P.project(1000, 10, 0.4, 2, 200) > P.project(1000, 1, 0.4, 2, 200), 'moderate risk compounds faster than tiny risk');
ok(P.expectedStreak(0.4, 200) === 11 && P.streakDrawdown(25, 11) > 0.9, 'losing streak math');
ok(P.growthPerTrade(2, 0.3, 2) < 1, 'negative edge shrinks');

if (fails) { console.log(fails + ' failure(s)'); process.exit(1); }
console.log('Meta OK: kill zones, weeks, leagues, quests, compounding.');
