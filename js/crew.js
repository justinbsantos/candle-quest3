/* Wickd — the crew: Bull, Bear, Fox and Wolf.
   Players pick one, then make it theirs: crew color (jacket + cap, recolored live
   on a canvas), eyewear, neck and pin accessories drawn on top, and a nickname. */
(function (G) {
  'use strict';
  const ART = G.CQ_CREW_ART || {};

  // anchors are in the cut-out image's pixel space (each cut is 440px tall)
  const CHARS = {
    bull: { name: 'Bull', title: 'The Charger', blurb: 'Buys the breakout and never hesitates. At his best when the market runs.',
      size: [267, 440], head: [40, 10, 200], eyes: [128, 103], eyeW: 76, tilt: -12, neck: [150, 182], pin: [170, 250],
      line: 'Momentum is building. Wait for the gap, then charge.' },
    bear: { name: 'Bear', title: 'The Closer', blurb: 'Patient. Lets the market come to him, then sells the top after the sweep.',
      size: [179, 440], head: [8, 0, 172], eyes: [100, 72], eyeW: 62, tilt: -4, neck: [112, 158], pin: [76, 240],
      line: 'No rush. Let them grab the liquidity first.' },
    fox: { name: 'Fox', title: 'The Strategist', blurb: 'Reads the map. Always knows where the liquidity is hiding.',
      size: [229, 440], head: [32, 18, 186], eyes: [130, 104], eyeW: 64, tilt: -10, neck: [128, 172], pin: [120, 266],
      line: 'Check the map: equal highs mean stops are waiting up there.' },
    wolf: { name: 'Wolf', title: 'The Guardian', blurb: 'Protects the pack. Risk comes first on every single trade.',
      size: [220, 440], head: [34, 6, 186], rc: [0.43, 0.555, 0.17], eyes: [142, 96], eyeW: 58, tilt: -8, neck: [112, 170], pin: [98, 252],
      line: 'Stop loss first. Then we talk about profit.' },
  };
  const ORDER = ['bull', 'bear', 'fox', 'wolf'];

  // [id, name, gems, vibe, hue, satMul, light] — teal is the original art
  const COLORS = [
    ['teal', 'Crew teal', 0, ''], ['crimson', 'Crimson', 0, 'cool', 0.98, 1.1, 0], ['royal', 'Royal', 0, 'cool', 0.62, 1.2, 0],
    ['forest', 'Forest', 300, '', 0.34, 1.0, 0], ['shadow', 'Shadow', 300, 'cool', 0, 0, -0.04], ['violet', 'Violet', 300, 'cute', 0.78, 1.0, 0.03],
    ['rose', 'Rose', 300, 'cute', 0.93, 0.85, 0.1], ['sky', 'Sky', 300, 'cute', 0.56, 0.75, 0.12], ['gold', 'Gold', 800, '', 0.12, 1.35, 0.05],
  ];
  const CAT = {
    color: { label: 'Crew color', items: COLORS.map((c) => [c[0], c[1], c[2], c[3]]) },
    eyes: { label: 'Eyewear', items: [['none', 'None', 0, ''], ['aviators', 'Aviators', 300, 'cool'], ['shades', 'Shades', 500, 'cool'], ['hearts', 'Heart specs', 300, 'cute']] },
    neck: { label: 'Neck', items: [['none', 'None', 0, ''], ['phones', 'Headphones', 300, ''], ['chain', 'Gold chain', 800, 'cool'], ['scarf', 'Scarf', 300, 'cute']] },
    pin: { label: 'Pin', items: [['none', 'None', 0, ''], ['flame', 'Flame pin', 0, ''], ['star', 'Star pin', 300, 'cute'], ['diamond', 'Diamond pin', 500, 'cool']] },
  };
  const DEFAULT = { id: null, color: 'teal', eyes: 'none', neck: 'none', pin: 'none', nick: '' };

  const S = () => G.CQStore.state;
  function look() { const st = S(); if (!st.crew) st.crew = Object.assign({}, DEFAULT); return st.crew; }
  function picked() { return !!look().id; }
  function char(id) { return CHARS[id || look().id || 'bull']; }
  function item(cat, id) { return CAT[cat].items.find((x) => x[0] === id); }
  function itemKey(cat, id) { return 'crew-' + cat + ':' + id; }
  function owns(cat, id) { const it = item(cat, id); if (!it || !it[2]) return true; return (S().owned.items || []).includes(itemKey(cat, id)); }

  // ---------------------------------------------------------------- art + recolor
  const imgs = {};
  const ready = Promise.all(Object.keys(ART).map((k) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { imgs[k] = im; res(); };
    im.onerror = () => res();
    im.src = ART[k];
  })));
  const cache = {};
  // rc = [hue min, hue max, min saturation] that counts as "jacket" for this character
  function recolor(im, c, rc) {
    const [H0, H1, S0] = rc || [0.40, 0.62, 0.08], E = 0.035;
    const cv = document.createElement('canvas');
    cv.width = im.naturalWidth; cv.height = im.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height), p = d.data;
    const [, , , , hueTo, satMul, light] = c;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 8) continue;
      const r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
      if (dd < 0.02) continue;
      let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4;
      h /= 6; if (h < 0) h += 1;
      if (h < H0 || h > H1) continue; // only the teal jacket and cap
      const l = (mx + mn) / 2, s = dd / (1 - Math.abs(2 * l - 1) + 1e-6);
      if (s < S0) continue;
      const w = Math.min(1, (s - S0) / 0.14) * Math.min(1, (h - H0) / E, (H1 - h) / E);
      const ns = Math.min(1, s * satMul), nl = Math.min(1, Math.max(0, l + light * w));
      const C = (1 - Math.abs(2 * nl - 1)) * ns, hp = hueTo * 6, X = C * (1 - Math.abs((hp % 2) - 1)), m = nl - C / 2;
      let rr, gg, bb;
      if (hp < 1) [rr, gg, bb] = [C, X, 0]; else if (hp < 2) [rr, gg, bb] = [X, C, 0]; else if (hp < 3) [rr, gg, bb] = [0, C, X];
      else if (hp < 4) [rr, gg, bb] = [0, X, C]; else if (hp < 5) [rr, gg, bb] = [X, 0, C]; else [rr, gg, bb] = [C, 0, X];
      p[i] = Math.round(((rr + m) * w + r * (1 - w)) * 255);
      p[i + 1] = Math.round(((gg + m) * w + g * (1 - w)) * 255);
      p[i + 2] = Math.round(((bb + m) * w + b * (1 - w)) * 255);
    }
    ctx.putImageData(d, 0, 0);
    return cv.toDataURL('image/webp', 0.9);
  }
  // data URL of a character's cut-out in a crew color (falls back to the original until art has loaded)
  function cutSrc(id, color) {
    const key = id + 'Cut', c = COLORS.find((x) => x[0] === color) || COLORS[0];
    if (!c[4] && c[0] === 'teal') return ART[key];
    const ck = id + '|' + c[0];
    if (cache[ck]) return cache[ck];
    if (!imgs[key]) return ART[key];
    return (cache[ck] = recolor(imgs[key], c, CHARS[id].rc));
  }
  // the canvas-drawable version for the camp scene
  const imgCache = {};
  function cutImage(id, color) {
    const src = cutSrc(id, color);
    if (imgCache[src]) return imgCache[src];
    const im = new Image(); im.src = src; imgCache[src] = im;
    return im;
  }

  // ---------------------------------------------------------------- drawing
  let uid = 0;
  function accessories(L, ch) {
    const out = [];
    const [ex, ey] = ch.eyes, w = ch.eyeW, t = ch.tilt;
    if (L.eyes === 'shades') out.push(`<g transform="translate(${ex} ${ey}) rotate(${t})"><rect x="${-w / 2}" y="-10" width="${w}" height="19" rx="9.5" fill="#0D0E14"/><path d="M${-w / 2 + 8} -4 H${-w / 2 + 22}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/><rect x="${-w / 2}" y="-10" width="${w}" height="19" rx="9.5" fill="none" stroke="#2A2D3A" stroke-width="2"/></g>`);
    if (L.eyes === 'aviators') out.push(`<g transform="translate(${ex} ${ey}) rotate(${t})"><path d="M${-w / 2} -6 H${w / 2}" stroke="#E2B04A" stroke-width="2.5"/><path d="M${-w / 2 + 2} -6 h${w * 0.4} q-2 16 -${w * 0.2} 16 q-${w * 0.18} 0 -${w * 0.2} -16z" fill="rgba(20,24,34,.75)" stroke="#E2B04A" stroke-width="2.5"/><path d="M${w / 2 - 2} -6 h-${w * 0.4} q2 16 ${w * 0.2} 16 q${w * 0.18} 0 ${w * 0.2} -16z" fill="rgba(20,24,34,.75)" stroke="#E2B04A" stroke-width="2.5"/></g>`);
    if (L.eyes === 'hearts') out.push(`<g transform="translate(${ex} ${ey}) rotate(${t})">${[-w / 4, w / 4].map((dx) => `<path transform="translate(${dx} 0)" d="M0 9 C-14 -1 -9 -12 0 -5 C9 -12 14 -1 0 9Z" fill="rgba(255,111,160,.55)" stroke="#FF6FA0" stroke-width="2.5"/>`).join('')}<path d="M${-w / 4 + 10} -2 H${w / 4 - 10}" stroke="#FF6FA0" stroke-width="2.5"/></g>`);
    const [nx, ny] = ch.neck;
    if (L.neck === 'chain') out.push(`<g transform="translate(${nx} ${ny})"><path d="M-34 -8 Q0 30 34 -8" stroke="#F2C14E" stroke-width="4" fill="none" stroke-dasharray="5 2"/><circle cx="0" cy="14" r="8" fill="#F2C14E" stroke="#B8862A" stroke-width="2"/><path d="M0 8 C4 12 4 16 0 19 C-4 16 -4 12 0 8Z" fill="#E8641F"/></g>`);
    if (L.neck === 'phones') out.push(`<g transform="translate(${nx} ${ny})"><path d="M-34 -2 Q0 26 34 -2" stroke="#1B1E28" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="-36" cy="-2" rx="9" ry="12" fill="#2B2F3D"/><ellipse cx="36" cy="-2" rx="9" ry="12" fill="#2B2F3D"/><ellipse cx="-36" cy="-2" rx="4" ry="6" fill="#E8641F"/><ellipse cx="36" cy="-2" rx="4" ry="6" fill="#E8641F"/></g>`);
    if (L.neck === 'scarf') out.push(`<g transform="translate(${nx} ${ny})"><path d="M-36 -10 Q0 14 36 -10 L38 4 Q0 30 -38 4Z" fill="#F4A6C0"/><path d="M14 8 L22 46 L8 46 L4 12Z" fill="#E98AAE"/><path d="M-30 -2 Q0 18 30 -2" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/></g>`);
    const [px, py] = ch.pin;
    if (L.pin === 'flame') out.push(`<g transform="translate(${px} ${py})"><circle r="10" fill="#1B2232" stroke="#E8641F" stroke-width="2"/><path d="M0 -7 C6 -1 6 4 0 7 C-6 4 -6 -1 0 -7Z" fill="#FF8A3D"/></g>`);
    if (L.pin === 'star') out.push(`<g transform="translate(${px} ${py})"><path d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3Z" fill="#FFD36B" stroke="#C99A2A" stroke-width="1.5"/></g>`);
    if (L.pin === 'diamond') out.push(`<g transform="translate(${px} ${py})"><path d="M-8 -3 L-4 -8 H4 L8 -3 L0 9Z" fill="#7FE9FF" stroke="#2FB7F0" stroke-width="1.5"/><path d="M-8 -3 H8" stroke="#2FB7F0" stroke-width="1.2"/></g>`);
    return out.join('');
  }
  // full figure (waist up) or round head avatar, both as one SVG
  function svg(L, opt) {
    opt = opt || {};
    L = L || look();
    const id = L.id || 'bull', ch = CHARS[id], [W, H] = ch.size;
    const head = opt.crop === 'head';
    const vb = head ? `${ch.head[0]} ${ch.head[1]} ${ch.head[2]} ${ch.head[2]}` : `0 0 ${W} ${H}`;
    const cid = 'cc' + (++uid);
    return `<svg class="${opt.cls || 'crew-svg'}" viewBox="${vb}" preserveAspectRatio="xMidYMid ${head ? 'slice' : 'meet'}" role="img" aria-label="${ch.name}">${head ? `<defs><clipPath id="${cid}"><circle cx="${ch.head[0] + ch.head[2] / 2}" cy="${ch.head[1] + ch.head[2] / 2}" r="${ch.head[2] / 2}"/></clipPath></defs><g clip-path="url(#${cid})"><rect x="${ch.head[0]}" y="${ch.head[1]}" width="${ch.head[2]}" height="${ch.head[2]}" fill="#13203A"/>` : ''}<image href="${cutSrc(id, L.color)}" width="${W}" height="${H}"/>${accessories(L, ch)}${head ? '</g>' : ''}</svg>`;
  }
  function avatar(flairId, cls) {
    if (!picked()) return `<span class="${cls || 'avatar'} av-round"></span>`;
    return `<span class="${cls || 'avatar'} av-round crew-av">${svg(null, { crop: 'head', cls: 'av-face' })}</span>`;
  }
  function displayName() { const L = look(); return L.nick || char().name; }

  // ---------------------------------------------------------------- pick your trader
  function chooser(arg) {
    const U = G.CQUI, Store = G.CQStore, st = S();
    const first = !st.name;
    let sel = look().id || null;
    const scr = U.el(`<main class="screen crew-pick">
      ${first ? `<div class="cp-hero"><img src="${ART.banner}" alt="Bull, Bear, Fox and Wolf on a hill above the city at night"><div class="cp-hero-fade"></div>
        <div class="cp-hero-text"><span class="cp-kicker">Wickd crew</span><h1>From the woods to the skyline.</h1><p>Start with a tent and a phone hotspot. Trade smart, and work your way up to the city.</p></div></div>` : ''}
      <h2 class="section-title">${first ? 'Pick your trader' : 'Switch trader'}</h2>
      <div class="cp-grid">${ORDER.map((k) => `<button class="cp-card ${k === sel ? 'on' : ''}" data-k="${k}"><img src="${ART[k]}" alt=""><span class="cp-name">${CHARS[k].name}</span><span class="cp-title">${CHARS[k].title}</span></button>`).join('')}</div>
      <p class="cp-blurb"></p>
      ${first ? `<label class="name-label">Trader name<input class="name-input" maxlength="14" placeholder="e.g. ChartChamp" autocomplete="off"></label><p class="tiny">Use a handle, not your real name.</p>` : ''}
      <button class="btn btn-play cp-go" disabled>${first ? 'Set up camp' : 'Switch'}</button>
    </main>`);
    const blurb = scr.querySelector('.cp-blurb'), go = scr.querySelector('.cp-go');
    const paint = () => {
      scr.querySelectorAll('.cp-card').forEach((b) => b.classList.toggle('on', b.dataset.k === sel));
      blurb.textContent = sel ? CHARS[sel].blurb : 'All four play the same game. Pick the one that feels like you.';
      go.disabled = !sel;
    };
    scr.querySelectorAll('.cp-card').forEach((b) => b.addEventListener('click', () => { sel = b.dataset.k; Store.sfx.tap(); paint(); }));
    go.addEventListener('click', () => {
      const L = look(); L.id = sel;
      if (first) { const inp = scr.querySelector('.name-input'); st.name = (inp.value.trim() || 'Trader').slice(0, 14); }
      Store.save(); Store.sfx.win();
      U.go(first ? U.home : ((arg && arg.back) || U.home));
    });
    if (first) U.app.append(scr); else U.app.append(U.hud((arg && arg.back) || (() => U.go(U.profile)), 'Your trader'), scr);
    paint();
  }

  // ---------------------------------------------------------------- make it yours
  function editor(arg) {
    const U = G.CQUI, Store = G.CQStore, st = S();
    const saved = look();
    const draft = Object.assign({}, saved);
    let tab = (arg && arg.tab) || 'color';
    const back = (arg && arg.back) || (() => U.go(U.profile));
    const scr = U.el(`<main class="screen creator crew-edit">
      <div class="cr-stage crew-stage"><div class="crew-glow"></div><div class="crew-fig"></div>
        <span class="cr-tryon" hidden>Trying on</span>
        <div class="crew-switch"></div></div>
      <div class="cr-panel">
        <div class="ce-name"><b class="ce-title"></b><span class="ce-sub"></span></div>
        <div class="cr-tabs"></div>
        <div class="cr-items"></div>
        <div class="cr-actions"><button class="btn btn-ghost cr-reset">Undo</button><button class="btn cr-save">Save</button></div>
      </div>
    </main>`);
    const $ = (s) => scr.querySelector(s);
    const TABS = [['color', 'Crew color'], ['eyes', 'Eyewear'], ['neck', 'Neck'], ['pin', 'Pin'], ['nick', 'Nickname']];
    function locked() { return ['color', 'eyes', 'neck', 'pin'].filter((k) => !owns(k, draft[k])).map((k) => [k, item(k, draft[k])]); }
    function render() {
      const ch = CHARS[draft.id];
      $('.crew-fig').innerHTML = svg(draft, { cls: 'crew-svg big' });
      $('.crew-switch').innerHTML = ORDER.map((k) => `<button class="cs-btn ${k === draft.id ? 'on' : ''}" data-k="${k}" aria-label="${CHARS[k].name}"><img src="${ART[k]}" alt=""></button>`).join('');
      $('.ce-title').textContent = (draft.nick || ch.name);
      $('.ce-sub').textContent = ch.name + ' · ' + ch.title;
      const lk = locked(), cost = lk.reduce((s, x) => s + x[1][2], 0);
      $('.cr-tryon').hidden = !lk.length;
      $('.cr-save').innerHTML = lk.length ? `Unlock ${G.CQGems.icon()}${cost.toLocaleString()}` : 'Save';
      $('.cr-tabs').innerHTML = TABS.map(([k, n]) => `<button class="cr-tab ${k === tab ? 'on' : ''}" data-k="${k}">${n}</button>`).join('');
      if (tab === 'nick') {
        $('.cr-items').innerHTML = `<label class="ce-nick">Give your ${ch.name.toLowerCase()} a nickname<input class="name-input" maxlength="14" value="${U.esc(draft.nick || '')}" placeholder="${ch.name}"></label>`;
        const inp = $('.ce-nick input');
        inp.addEventListener('input', () => { draft.nick = inp.value.trim().slice(0, 14); $('.ce-title').textContent = draft.nick || ch.name; });
      } else {
        const sw = (id) => { const c = COLORS.find((x) => x[0] === id); return c ? `<span class="ce-sw" style="background:${swatch(c)}"></span>` : ''; };
        $('.cr-items').innerHTML = CAT[tab].items.map(([id, name, price, vibe]) => {
          const own = owns(tab, id), on = draft[tab] === id;
          return `<button class="cr-item ${on ? 'on' : ''}" data-id="${id}">${tab === 'color' ? sw(id) : ''}<b>${name}</b><small class="${own ? '' : 'gem-price'}">${own ? (price ? 'Owned' : 'Free') : G.CQGems.icon() + price}</small>${vibe ? `<i class="ce-vibe ${vibe}">${vibe}</i>` : ''}</button>`;
        }).join('');
      }
      scr.querySelectorAll('.cr-tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.k; Store.sfx.tap(); render(); }));
      scr.querySelectorAll('.cr-item').forEach((b) => b.addEventListener('click', () => { draft[tab] = b.dataset.id; Store.sfx.tap(); render(); }));
      scr.querySelectorAll('.cs-btn').forEach((b) => b.addEventListener('click', () => { draft.id = b.dataset.k; Store.sfx.tap(); render(); }));
    }
    $('.cr-reset').addEventListener('click', () => { Object.assign(draft, saved); Store.sfx.tap(); render(); });
    $('.cr-save').addEventListener('click', () => {
      const lk = locked(), cost = lk.reduce((s, x) => s + x[1][2], 0);
      if (cost) {
        if (!G.CQGems.spend(cost)) { G.CQGems.needMore(cost, () => U.go(editor, { tab, back })); return; }
        st.owned.items = st.owned.items || [];
        lk.forEach(([k, it]) => st.owned.items.push(itemKey(k, it[0])));
        Store.badge('stylish'); U.confetti(40);
      }
      Object.assign(saved, draft); Store.save(); Store.sfx.win();
      U.toast(cost ? 'Unlocked and saved. Looking sharp.' : 'Saved.', '✨');
      render();
    });
    U.app.append(U.hud(back, 'Your trader'), scr);
    render();
  }
  function swatch(c) {
    if (c[0] === 'teal') return 'radial-gradient(circle at 35% 30%, #4FB9B4, #1E6F73 60%, #123F45)';
    const h = Math.round((c[4] || 0) * 360), s = c[5] === 0 ? 0 : Math.round(Math.min(100, 55 * c[5])), l = 32 + Math.round((c[6] || 0) * 100);
    return `radial-gradient(circle at 35% 30%, hsl(${h} ${s}% ${l + 18}%), hsl(${h} ${s}% ${l}%) 60%, hsl(${h} ${s}% ${Math.max(10, l - 14)}%))`;
  }

  G.CQCrew = { CHARS, ORDER, CAT, COLORS, ready, look, picked, char, owns, itemKey, svg, avatar, chooser, editor, cutImage, cutSrc, displayName, art: ART };
})(window);
