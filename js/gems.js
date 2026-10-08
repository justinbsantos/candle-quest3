/* Wickd — gems: the premium currency.
   Rules (from the monetization research):
   - Gems buy cosmetics only. Never coins, never a trade stake, never cash, no random rewards.
   - Every price is shown in real money next to the gems.
   - Pack sizes match item prices (100 gems ≈ $1), so nothing is left over.
   - Every purchase needs a parent's approval. Checkout is not connected in this build. */
(function (G) {
  'use strict';

  const PACKS = [
    { id: 'g100', gems: 100, price: 0.99, bonus: 0 },
    { id: 'g550', gems: 550, price: 4.99, bonus: 10 },
    { id: 'g1200', gems: 1200, price: 9.99, bonus: 20, tag: 'Most popular' },
    { id: 'g2500', gems: 2500, price: 19.99, bonus: 25 },
    { id: 'g6500', gems: 6500, price: 49.99, bonus: 30, tag: 'Best value' },
  ];
  const STARTER = { id: 'starter', name: 'Starter pack', price: 2.99, gems: 300, items: [['eyes', 'shades'], ['neck', 'chain']], label: 'Shades + Gold chain' };
  const CLUB = { monthly: 4.99, yearly: 39.99, family: 59.99 };
  const EARN = [
    ['Level up', 25], ['New badge', 10], ['7-day streak', 30], ['League promotion', 50],
  ];
  const usd = (v) => '$' + v.toFixed(2);

  function icon(cls) {
    return `<svg class="gem ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l5 6-10 12L2 9z" fill="#5BE3FF"/><path d="M7 3l5 6 5-6M2 9h20M12 9v12" stroke="#1E7FD9" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M7 3h10l-5 6z" fill="#B8F4FF"/><path d="M2 9l10 12L7 9z" fill="#2FB7F0"/></svg>`;
  }
  const S = () => G.CQStore.state;
  const U = () => G.CQUI;

  function spend(n) { return G.CQStore.spendGems(n); }
  function refresh() { document.querySelectorAll('.hud-gems b').forEach((b) => { b.textContent = (S().gems || 0).toLocaleString(); }); }

  function needMore(cost, back) {
    const have = S().gems || 0;
    const m = U().modal(`<h2>${icon('big')} ${(cost - have).toLocaleString()} more gems</h2>
      <p>This look costs ${cost.toLocaleString()} gems and you have ${have.toLocaleString()}.</p>
      <p class="tiny">Earn gems free by leveling up, unlocking badges, keeping a 7-day streak and moving up a league.</p>
      <div class="modal-actions"><button class="btn btn-ghost m-close">Keep playing</button><button class="btn m-shop">Gem shop</button></div>`);
    m.querySelector('.m-close').addEventListener('click', () => m.remove());
    m.querySelector('.m-shop').addEventListener('click', () => { m.remove(); U().go(shop, { back }); });
  }

  function dayHash() { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); }
  function featured() {
    const A = G.CQCrew, out = [];
    Object.keys(A.CAT).forEach((k) => A.CAT[k].items.forEach((it) => { if (it[2]) out.push([k, it]); }));
    const h = dayHash();
    const a = out[h % out.length], b = out[(h * 7 + 3) % out.length];
    return a === b ? [a] : [a, b];
  }

  // Parent approval. Real checkout (App Store / Google Play billing, Ask to Buy / Family Link) plugs in here.
  function checkout(product) {
    const m = U().modal(`<h2>Ask a grown-up</h2>
      <div class="ck-product"><b>${product.title}</b><span>${product.detail}</span><strong>${product.priceLabel}</strong></div>
      <p class="tiny">Every purchase in Wickd needs a parent's approval. Gems only buy looks for your trader. They can't be turned into coins or cash, and nothing is random.</p>
      <p class="tiny ck-note">Checkout isn't connected in this preview, so nothing will be charged.</p>
      <div class="modal-actions"><button class="btn btn-ghost m-close">Not now</button><button class="btn m-ask">Send to my parent</button></div>
      <button class="ck-test">Test mode: add without paying</button>`);
    m.querySelector('.m-close').addEventListener('click', () => m.remove());
    m.querySelector('.m-ask').addEventListener('click', () => { m.remove(); U().toast('Request saved. A parent can approve it once checkout is live.', '📨'); });
    m.querySelector('.ck-test').addEventListener('click', () => { m.remove(); product.grant(); });
  }

  function grantPack(p) { G.CQStore.addGems(p.gems, 'purchase'); U().confetti(30); U().toast(`+${p.gems.toLocaleString()} gems (test mode)`, '💎'); refresh(); }
  function grantStarter() {
    const st = S();
    st.starterBought = true;
    STARTER.items.forEach(([k, id]) => { const key = G.CQCrew.itemKey(k, id); if (!st.owned.items.includes(key)) st.owned.items.push(key); });
    G.CQStore.addGems(STARTER.gems, 'purchase');
    U().confetti(40); U().toast('Starter pack unlocked (test mode)', '🎁');
  }
  function grantClub(plan) { const st = S(); st.club = { plan, since: Date.now() }; G.CQStore.addGems(300, 'purchase'); G.CQStore.save(); U().toast('Wickd Club active (test mode)', '👑'); }

  function shop(arg) {
    const UI = U(), st = S();
    const back = (arg && arg.back) || (() => UI.go(UI.home));
    const A = G.CQCrew;
    const starterOn = !st.starterBought && ((st.tpTotal || 0) >= 3 || G.CQStore.levelInfo(st.xp).lvl >= 3);
    const feat = featured();
    const scr = UI.el(`<main class="screen gemshop">
      <section class="gs-balance">${icon('big')}<div><b>${(st.gems || 0).toLocaleString()}</b><span>gems</span></div>
        <button class="btn small btn-ghost gs-look">Spend on my look</button></section>

      <h2 class="section-title">Featured today</h2>
      <div class="gs-featured">${feat.map(([k, it]) => `<button class="gs-feat" data-k="${k}"><span class="gs-feat-k">${A.CAT[k].label}</span><b>${it[1]}</b><small>${A.owns(k, it[0]) ? 'Owned' : icon() + it[2]}</small></button>`).join('')}</div>

      ${starterOn ? `<section class="gs-card gs-starter"><div><span class="pill">One time only</span><h3>Starter pack</h3><p>${STARTER.gems} gems + ${STARTER.label}</p></div><button class="btn gs-buy-starter">${usd(STARTER.price)}</button></section>` : ''}

      <section class="gs-card gs-club"><div><span class="pill">${st.club ? 'Active' : 'Membership'}</span><h3>Wickd Club</h3>
        <ul><li>300 gems right away, then 20 every day you play</li><li>An exclusive look every month</li><li>Season pass included on the yearly plan</li></ul></div>
        <div class="gs-plans">
          <button class="gs-plan" data-plan="monthly"><b>${usd(CLUB.monthly)}</b><small>per month</small></button>
          <button class="gs-plan" data-plan="yearly"><b>${usd(CLUB.yearly)}</b><small>per year</small></button>
          <button class="gs-plan" data-plan="family"><b>${usd(CLUB.family)}</b><small>family / yr, up to 5 kids</small></button>
        </div></section>

      <section class="gs-card gs-season"><div><span class="pill">Coming soon</span><h3>Season 1 pass</h3><p>6 weeks · 30 free + 30 premium tiers of looks and camp gear · ${usd(4.99)} or 500 gems. Buy late and you still get every tier you've reached.</p></div></section>

      <h2 class="section-title">Gem packs</h2>
      <div class="gs-packs">${PACKS.map((p) => `<button class="gs-pack" data-id="${p.id}">${p.tag ? `<span class="gs-tag">${p.tag}</span>` : ''}${icon('big')}<b>${p.gems.toLocaleString()}</b>${p.bonus ? `<small class="gs-bonus">+${p.bonus}% bonus</small>` : '<small>&nbsp;</small>'}<strong>${usd(p.price)}</strong></button>`).join('')}</div>

      <section class="gs-earn"><h3>Earn gems free</h3>${EARN.map(([t, n]) => `<div><span>${t}</span><b>${icon()}${n}</b></div>`).join('')}
        <p class="tiny">Gems only buy cosmetics. They never turn into coins or cash, and they can't be used on trades. Every purchase needs a parent's OK.</p></section>
    </main>`);
    UI.app.append(UI.hud(back, 'Gem shop'), scr, UI.nav('me'));
    scr.querySelector('.gs-look').addEventListener('click', () => UI.go(A.editor, { back: () => UI.go(shop, arg) }));
    scr.querySelectorAll('.gs-feat').forEach((b) => b.addEventListener('click', () => UI.go(A.editor, { tab: b.dataset.k, back: () => UI.go(shop, arg) })));
    scr.querySelectorAll('.gs-pack').forEach((b) => b.addEventListener('click', () => {
      const p = PACKS.find((x) => x.id === b.dataset.id);
      checkout({ title: p.gems.toLocaleString() + ' gems', detail: p.bonus ? `Includes a ${p.bonus}% bonus` : 'Gem pack', priceLabel: usd(p.price), grant: () => { grantPack(p); UI.go(shop, arg); } });
    }));
    const sb = scr.querySelector('.gs-buy-starter');
    if (sb) sb.addEventListener('click', () => checkout({ title: 'Starter pack', detail: `${STARTER.gems} gems + ${STARTER.label}`, priceLabel: usd(STARTER.price), grant: () => { grantStarter(); UI.go(shop, arg); } }));
    scr.querySelectorAll('.gs-plan').forEach((b) => b.addEventListener('click', () => {
      const plan = b.dataset.plan, price = CLUB[plan];
      checkout({ title: 'Wickd Club · ' + (plan === 'monthly' ? 'monthly' : plan === 'yearly' ? 'yearly' : 'family yearly'), detail: 'Cancel anytime in one tap', priceLabel: usd(price) + (plan === 'monthly' ? '/mo' : '/yr'), grant: () => { grantClub(plan); UI.go(shop, arg); } });
    }));
  }

  // Club members: 20 gems the first time they open the app each day.
  function clubDaily() {
    const st = S();
    if (!st.club) return;
    const d = new Date().toDateString();
    if (st.clubDay === d) return;
    st.clubDay = d;
    G.CQStore.addGems(20, 'Wickd Club daily');
  }

  G.CQGems = { icon, spend, needMore, shop, checkout, refresh, clubDaily, PACKS, STARTER, CLUB };
})(window);
