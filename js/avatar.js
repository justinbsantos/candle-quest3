/* Wickd — your trader: soft 3D character built from layered vector parts.
   Every option is one small layer, so adding an item = adding one entry + a few shapes. */
(function (G) {
  'use strict';

  const SKIN = ['#FCE3D0', '#F5CBA7', '#E8AE84', '#CF8E62', '#AE6E44', '#8A5332', '#6B3E24', '#4A2A18'];
  const HAIR_C = ['#2A1E3A', '#5A3420', '#9A6234', '#E2B865', '#F2E3B8', '#FF7FB8', '#6FA8FF', '#B69CFF', '#3CE0A0'];
  const CLOTH = ['#7C5CFF', '#FF5C8A', '#2BB98A', '#3D8BFF', '#F2A541', '#2B2F45', '#F4F2FF', '#B0453A', '#E9D6C0'];
  const ACC_C = ['#2B2F45', '#F4F2FF', '#FF4FD8', '#FFC94A', '#3CFFB1', '#3D8BFF'];

  // gems: 0 = free. Prices are round so gem packs match them (no leftovers).
  const CAT = {
    face: { label: 'Face', colorKey: 'skin', colors: SKIN, colorLabel: 'Skin tone', items: [['smile', 'Smile', 0], ['hype', 'Hype', 0], ['chill', 'Chill', 0], ['happy', 'Happy', 0], ['wink', 'Wink', 100]] },
    hair: { label: 'Hair', colorKey: 'hairC', colors: HAIR_C, colorLabel: 'Hair color', items: [['buzz', 'Buzz', 0], ['swoop', 'Swoop', 0], ['curls', 'Curls', 0], ['long', 'Long', 0], ['bob', 'Bob', 0], ['braids', 'Braids', 0], ['buns', 'Space buns', 300], ['afro', 'Big curls', 300]] },
    top: { label: 'Top', colorKey: 'topC', colors: CLOTH, colorLabel: 'Top color', items: [['hoodie', 'Hoodie', 0], ['tee', 'Tee', 0], ['puffer', 'Puffer', 500], ['varsity', 'Varsity', 800]] },
    bot: { label: 'Bottoms', colorKey: 'botC', colors: CLOTH, colorLabel: 'Bottoms color', items: [['pants', 'Joggers', 0], ['shorts', 'Shorts', 0], ['cargo', 'Cargos', 300], ['skirt', 'Pleated skirt', 300]] },
    shoe: { label: 'Shoes', colorKey: 'shoeC', colors: CLOTH, colorLabel: 'Shoe color', items: [['sneakers', 'Runners', 0], ['slides', 'Slides', 0], ['hightops', 'High-tops', 500], ['boots', 'Boots', 500]] },
    acc: { label: 'Extras', colorKey: 'accC', colors: ACC_C, colorLabel: 'Extra color', items: [['none', 'None', 0], ['headphones', 'Headphones', 0], ['glasses', 'Glasses', 0], ['cap', 'Cap', 300], ['beanie', 'Beanie', 300], ['chain', 'Chain', 800]] },
  };
  const DEFAULT = { face: 'smile', skin: 3, hair: 'swoop', hairC: 0, top: 'hoodie', topC: 0, bot: 'pants', botC: 5, shoe: 'sneakers', shoeC: 6, acc: 'none', accC: 0 };

  function look() {
    const S = G.CQStore.state;
    if (!S.look) S.look = Object.assign({}, DEFAULT);
    return S.look;
  }
  function item(cat, id) { return CAT[cat].items.find((x) => x[0] === id); }
  function itemKey(cat, id) { return cat + ':' + id; }
  function owns(cat, id) {
    const it = item(cat, id);
    if (!it || !it[2]) return true;
    const S = G.CQStore.state;
    return (S.owned.items || []).includes(itemKey(cat, id));
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function palette(L) {
    const skin = SKIN[L.skin] || SKIN[3], hair = HAIR_C[L.hairC] || HAIR_C[0], top = CLOTH[L.topC] || CLOTH[0];
    const bot = CLOTH[L.botC] || CLOTH[5], shoe = CLOTH[L.shoeC] || CLOTH[6], acc = ACC_C[L.accC] || ACC_C[0];
    return {
      skin, skinHi: shade(skin, 0.25), skinLo: shade(skin, -0.22),
      hair, hairHi: shade(hair, 0.3), hairLo: shade(hair, -0.35),
      top, topHi: shade(top, 0.25), topLo: shade(top, -0.3),
      bot, botHi: shade(bot, 0.2), botLo: shade(bot, -0.3),
      shoe, shoeHi: shade(shoe, 0.2), shoeLo: shade(shoe, -0.3),
      acc, accHi: shade(acc, 0.3), accLo: shade(acc, -0.3),
      sleeve: L.top === 'varsity' ? '#E9E6F5' : shade(top, -0.12),
    };
  }

  let uid = 0;
  // crop: 'full' (whole body) or 'head' (for round avatars)
  function svg(L, opt) {
    opt = opt || {};
    L = L || look();
    const c = palette(L), id = 'tr' + (++uid);
    const u = (n) => `url(#${id}${n})`;
    const S = u('s'), H = u('h'), T = u('t'), B = u('b'), F = u('f'), A = u('a');
    const h = L.hair, f = L.face, a = L.acc, top = L.top, bot = L.bot, sh = L.shoe;
    const p = [];
    const box = opt.crop === 'head' ? '40 22 160 160' : '0 0 240 340';
    p.push(`<svg class="${opt.cls || 'trader'}" viewBox="${box}" aria-label="Your trader"${opt.size ? ` width="${opt.size}"` : ''}>`);
    if (opt.crop === 'head') p.push(`<clipPath id="${id}c"><circle cx="120" cy="102" r="80"/></clipPath>`);
    p.push(`<defs>
      <radialGradient id="${id}s" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${c.skinHi}"/><stop offset=".55" stop-color="${c.skin}"/><stop offset="1" stop-color="${c.skinLo}"/></radialGradient>
      <radialGradient id="${id}h" cx="35%" cy="20%" r="90%"><stop offset="0" stop-color="${c.hairHi}"/><stop offset=".5" stop-color="${c.hair}"/><stop offset="1" stop-color="${c.hairLo}"/></radialGradient>
      <linearGradient id="${id}t" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${c.topHi}"/><stop offset=".5" stop-color="${c.top}"/><stop offset="1" stop-color="${c.topLo}"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${c.botHi}"/><stop offset=".5" stop-color="${c.bot}"/><stop offset="1" stop-color="${c.botLo}"/></linearGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.shoeHi}"/><stop offset="1" stop-color="${c.shoeLo}"/></linearGradient>
      <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.accHi}"/><stop offset="1" stop-color="${c.accLo}"/></linearGradient>
    </defs>`);
    if (opt.crop === 'head') p.push(`<g clip-path="url(#${id}c)">`);
    // back hair
    if (h === 'long' || h === 'afro') p.push(`<path d="M56 100 C50 40 190 40 184 100 L192 214 Q184 232 160 226 L80 226 Q56 232 48 214 Z" fill="${H}"/>`);
    if (h === 'bob') p.push(`<path d="M54 100 C48 44 192 44 186 100 L190 168 Q120 186 50 168 Z" fill="${H}"/>`);
    if (h === 'braids') p.push(`<rect x="46" y="110" width="26" height="140" rx="13" fill="${H}"/><rect x="168" y="110" width="26" height="140" rx="13" fill="${H}"/><path d="M48 140 H70 M48 168 H70 M48 196 H70 M48 224 H70 M170 140 H192 M170 168 H192 M170 196 H192 M170 224 H192" stroke="${c.hairLo}" stroke-width="3" stroke-linecap="round"/>`);
    if (opt.crop !== 'head') {
      p.push(`<ellipse cx="120" cy="330" rx="74" ry="9" fill="rgba(0,0,0,.35)"/>`);
      // legs + bottoms
      if (bot === 'shorts' || bot === 'skirt') p.push(`<rect x="96" y="250" width="20" height="62" rx="10" fill="${S}"/><rect x="124" y="250" width="20" height="62" rx="10" fill="${S}"/>`);
      if (bot === 'pants' || bot === 'cargo') p.push(`<rect x="90" y="226" width="30" height="88" rx="14" fill="${B}"/><rect x="120" y="226" width="30" height="88" rx="14" fill="${B}"/><path d="M120 232 V300" stroke="${c.botLo}" stroke-width="2"/>`);
      if (bot === 'cargo') p.push(`<rect x="88" y="262" width="12" height="20" rx="4" fill="${c.botLo}"/><rect x="140" y="262" width="12" height="20" rx="4" fill="${c.botLo}"/>`);
      if (bot === 'shorts') p.push(`<path d="M88 224 H152 L156 262 Q140 268 122 262 L120 250 L118 262 Q100 268 84 262 Z" fill="${B}"/>`);
      if (bot === 'skirt') p.push(`<path d="M90 222 H150 L166 270 Q120 284 74 270 Z" fill="${B}"/><path d="M104 230 L96 272 M120 230 V276 M136 230 L144 272" stroke="${c.botLo}" stroke-width="2"/>`);
      // shoes
      if (sh === 'sneakers') p.push(`<path d="M84 318 Q84 300 104 302 Q120 302 124 316 Q124 326 112 326 H90 Q84 326 84 318 Z" fill="${F}"/><path d="M116 318 Q116 300 136 302 Q152 302 156 316 Q156 326 144 326 H122 Q116 326 116 318 Z" fill="${F}"/><path d="M86 322 H122 M118 322 H154" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`);
      if (sh === 'hightops') p.push(`<path d="M92 292 H116 V312 Q128 314 126 322 Q124 328 112 328 H90 Q84 328 86 318 Z" fill="${F}"/><path d="M124 292 H148 V312 Q160 314 158 322 Q156 328 144 328 H122 Q116 328 118 318 Z" fill="${F}"/><path d="M88 324 H124 M120 324 H156" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/><circle cx="104" cy="304" r="4" fill="#FFFFFF"/><circle cx="136" cy="304" r="4" fill="#FFFFFF"/>`);
      if (sh === 'boots') p.push(`<path d="M90 280 H118 V314 Q130 316 128 324 Q126 330 114 330 H88 Q82 330 84 320 Z" fill="${F}"/><path d="M122 280 H150 V314 Q162 316 160 324 Q158 330 146 330 H120 Q114 330 116 320 Z" fill="${F}"/><path d="M86 326 H126 M118 326 H158" stroke="${c.shoeLo}" stroke-width="5" stroke-linecap="round"/>`);
      if (sh === 'slides') p.push(`<rect x="88" y="318" width="34" height="9" rx="4.5" fill="#F4F2FF"/><rect x="118" y="318" width="34" height="9" rx="4.5" fill="#F4F2FF"/><rect x="90" y="308" width="30" height="12" rx="6" fill="${F}"/><rect x="120" y="308" width="30" height="12" rx="6" fill="${F}"/>`);
      // arms
      p.push(`<rect x="62" y="152" width="26" height="78" rx="13" fill="${c.sleeve}"/><rect x="152" y="152" width="26" height="78" rx="13" fill="${c.sleeve}"/><circle cx="75" cy="234" r="12" fill="${S}"/><circle cx="165" cy="234" r="12" fill="${S}"/>`);
    }
    // torso
    p.push(`<path d="M82 162 Q82 144 102 142 H138 Q158 144 158 162 L162 232 Q120 244 78 232 Z" fill="${T}"/>`);
    if (top === 'hoodie') p.push(`<path d="M96 196 H144 L140 222 H100 Z" fill="${c.topLo}" opacity=".55"/><path d="M110 150 L108 182 M130 150 L132 182" stroke="#F4F2FF" stroke-width="3" stroke-linecap="round"/><circle cx="108" cy="184" r="3" fill="#F4F2FF"/><circle cx="132" cy="184" r="3" fill="#F4F2FF"/>`);
    if (top === 'puffer') p.push(`<path d="M84 168 Q120 176 156 168 M82 190 Q120 198 158 190 M80 212 Q120 220 160 212" stroke="${c.topLo}" stroke-width="3" fill="none"/><path d="M120 146 V238" stroke="${c.topLo}" stroke-width="3"/><path d="M96 140 Q120 156 144 140 L144 150 Q120 166 96 150 Z" fill="${c.topHi}"/>`);
    if (top === 'varsity') p.push(`<path d="M120 146 V238" stroke="${c.topLo}" stroke-width="2"/><circle cx="104" cy="176" r="10" fill="#F4F2FF"/><path d="M99 171 L102 181 L104 175 L106 181 L109 171" stroke="${c.top}" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M80 230 Q120 242 160 230" stroke="#F4F2FF" stroke-width="5" fill="none"/>`);
    if (top === 'tee') p.push(`<path d="M104 144 Q120 158 136 144" stroke="${c.topLo}" stroke-width="3" fill="none"/><path d="M104 184 L116 196 L136 174" stroke="${c.topHi}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (a === 'chain') p.push(`<path d="M100 146 Q120 176 140 146" stroke="${A}" stroke-width="4" fill="none"/><circle cx="120" cy="164" r="6" fill="${A}"/>`);
    // head
    p.push(`<rect x="108" y="128" width="24" height="22" rx="10" fill="${c.skinLo}"/><circle cx="60" cy="116" r="13" fill="${S}"/><circle cx="180" cy="116" r="13" fill="${S}"/><circle cx="120" cy="106" r="62" fill="${S}"/><ellipse cx="96" cy="74" rx="22" ry="12" fill="#FFFFFF" opacity=".16"/><circle cx="90" cy="134" r="9" fill="#FF6F91" opacity=".28"/><circle cx="150" cy="134" r="9" fill="#FF6F91" opacity=".28"/>`);
    // face
    const roundEye = (x) => `<ellipse cx="${x}" cy="116" rx="8" ry="10" fill="#1B1430"/><circle cx="${x + 3}" cy="112" r="3" fill="#FFFFFF"/>`;
    const arcEye = (x) => `<path d="M${x - 9} 118 Q${x} 106 ${x + 9} 118" stroke="#1B1430" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (f === 'smile' || f === 'hype') p.push(roundEye(98) + roundEye(142));
    if (f === 'happy') p.push(arcEye(98) + arcEye(142));
    if (f === 'wink') p.push(roundEye(98) + arcEye(142));
    if (f === 'chill') p.push(`<path d="M89 116 H107 M133 116 H151" stroke="#1B1430" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="98" cy="120" rx="6" ry="4" fill="#1B1430"/><ellipse cx="142" cy="120" rx="6" ry="4" fill="#1B1430"/>`);
    p.push(`<path d="M88 98 Q98 92 106 97 M134 97 Q142 92 152 98" stroke="${c.hairLo}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    if (f === 'smile' || f === 'happy' || f === 'wink') p.push(`<path d="M108 140 Q120 150 132 140" stroke="#1B1430" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    if (f === 'hype') p.push(`<path d="M106 138 Q120 158 134 138 Z" fill="#3A1426"/><path d="M110 140 H130" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>`);
    if (f === 'chill') p.push(`<path d="M110 144 Q124 146 132 136" stroke="#1B1430" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    // front hair
    const shine = `<path d="M86 56 Q118 42 152 54" stroke="#FFFFFF" stroke-width="5" opacity=".22" fill="none" stroke-linecap="round"/>`;
    if (h === 'buzz') p.push(`<path d="M60 104 C58 60 88 42 120 42 C152 42 182 58 180 104 C170 76 70 76 60 104 Z" fill="${H}"/>`);
    if (h === 'swoop') p.push(`<path d="M56 110 C48 50 92 34 126 38 C168 40 190 70 182 110 C178 90 166 80 150 74 C128 94 90 98 56 110 Z" fill="${H}"/>` + shine);
    if (h === 'curls' || h === 'afro') p.push([[66, 84, 20], [80, 58, 22], [106, 42, 23], [134, 42, 23], [160, 58, 22], [174, 84, 20], [58, 108, 14], [182, 108, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${H}"/>`).join(''));
    if (h === 'long' || h === 'braids') p.push(`<path d="M58 112 C54 56 90 40 120 40 C150 40 186 56 182 112 C174 84 150 68 122 68 C104 84 80 94 58 112 Z" fill="${H}"/>` + shine);
    if (h === 'bob') p.push(`<path d="M58 104 C56 54 184 54 182 104 L182 100 Q176 92 168 98 Q160 90 150 98 Q140 90 130 98 Q120 90 110 98 Q100 90 90 98 Q80 90 72 98 Q64 92 58 104 Z" fill="${H}"/>`);
    if (h === 'buns') p.push(`<circle cx="70" cy="50" r="24" fill="${H}"/><circle cx="170" cy="50" r="24" fill="${H}"/><path d="M60 104 C58 60 88 46 120 46 C152 46 182 60 180 104 C170 78 70 78 60 104 Z" fill="${H}"/>`);
    // extras
    if (a === 'cap') p.push(`<path d="M58 92 C58 40 182 40 182 92 Z" fill="${A}"/><path d="M58 90 Q120 80 200 96 Q206 104 192 104 Q120 96 58 100 Z" fill="${c.accLo}"/><circle cx="120" cy="46" r="5" fill="${c.accLo}"/>`);
    if (a === 'beanie') p.push(`<path d="M58 92 C56 34 184 34 182 92 Z" fill="${A}"/><rect x="54" y="80" width="132" height="22" rx="11" fill="${c.accLo}"/><circle cx="120" cy="30" r="13" fill="${c.accHi}"/>`);
    if (a === 'headphones') p.push(`<path d="M52 112 C48 34 192 34 188 112" stroke="${A}" stroke-width="10" fill="none" stroke-linecap="round"/><rect x="42" y="98" width="24" height="40" rx="12" fill="${A}"/><rect x="174" y="98" width="24" height="40" rx="12" fill="${A}"/>`);
    if (a === 'glasses') p.push(`<rect x="82" y="104" width="32" height="24" rx="10" fill="rgba(255,255,255,.12)" stroke="${A}" stroke-width="4"/><rect x="126" y="104" width="32" height="24" rx="10" fill="rgba(255,255,255,.12)" stroke="${A}" stroke-width="4"/><path d="M114 114 H126" stroke="${A}" stroke-width="4"/>`);
    if (opt.crop === 'head') p.push('</g>');
    p.push('</svg>');
    return p.join('');
  }

  // round avatar: ring in the player's flair colors + their character's head
  function avatar(flairId, cls) {
    const [a, b] = G.CQMascot.flair(flairId);
    const id = 'ar' + (++uid);
    return `<span class="${cls || 'avatar'} av-round" style="--ring:linear-gradient(135deg,${a},${b})"><svg viewBox="0 0 64 64" class="av-ring" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#${id})"/><circle cx="32" cy="32" r="26.5" fill="#1D1640"/></svg>${svg(null, { crop: 'head', cls: 'av-face' })}</span>`;
  }

  // ---------------------------------------------------------------- creator screen
  function creator(arg) {
    const U = G.CQUI, Store = G.CQStore, S = Store.state;
    const saved = look();
    const draft = Object.assign({}, saved);
    let tab = (arg && arg.tab) || 'hair';
    const back = (arg && arg.back) || (() => U.go(U.profile));
    const scr = U.el(`<main class="screen creator">
      <div class="cr-stage"><div class="cr-plinth"></div><div class="cr-fig"></div>
        <button class="icon-btn cr-shuffle" aria-label="Random look">${G.CQIcons.ic('refresh')}</button>
        <span class="cr-tryon" hidden>Trying on</span></div>
      <div class="cr-panel">
        <div class="cr-tabs"></div>
        <div class="cr-items"></div>
        <div class="cr-colors"></div>
        <div class="cr-actions"><button class="btn btn-ghost cr-reset">Undo</button><button class="btn cr-save">Save look</button></div>
      </div>
    </main>`);
    const $ = (s) => scr.querySelector(s);
    function locked() {
      const out = [];
      Object.keys(CAT).forEach((k) => { if (!owns(k, draft[k])) out.push([k, item(k, draft[k])]); });
      return out;
    }
    function render() {
      $('.cr-fig').innerHTML = svg(draft, { cls: 'trader big' });
      const lk = locked();
      $('.cr-tryon').hidden = !lk.length;
      const cost = lk.reduce((s, x) => s + x[1][2], 0);
      $('.cr-save').innerHTML = lk.length ? `Unlock ${G.CQGems.icon()}${cost.toLocaleString()}` : 'Save look';
      $('.cr-tabs').innerHTML = Object.keys(CAT).map((k) => `<button class="cr-tab ${k === tab ? 'on' : ''}" data-k="${k}">${CAT[k].label}</button>`).join('');
      const cat = CAT[tab];
      $('.cr-items').innerHTML = cat.items.map(([id, name, price]) => {
        const own = owns(tab, id), on = draft[tab] === id;
        return `<button class="cr-item ${on ? 'on' : ''}" data-id="${id}"><b>${name}</b><small class="${own ? '' : 'gem-price'}">${own ? (price ? 'Owned' : 'Free') : G.CQGems.icon() + price}</small></button>`;
      }).join('');
      $('.cr-colors').innerHTML = cat.colors.map((col, i) => `<button class="cr-color ${draft[cat.colorKey] === i ? 'on' : ''}" data-i="${i}" aria-label="${cat.colorLabel} ${i + 1}" style="background:radial-gradient(circle at 35% 30%, ${shade(col, .3)}, ${col} 55%, ${shade(col, -.25)})"></button>`).join('');
      scr.querySelectorAll('.cr-tab').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.k; Store.sfx.tap(); render(); }));
      scr.querySelectorAll('.cr-item').forEach((b) => b.addEventListener('click', () => { draft[tab] = b.dataset.id; Store.sfx.tap(); render(); }));
      scr.querySelectorAll('.cr-color').forEach((b) => b.addEventListener('click', () => { draft[cat.colorKey] = +b.dataset.i; Store.sfx.tap(); render(); }));
    }
    $('.cr-shuffle').addEventListener('click', () => {
      const r = (n) => Math.floor(Math.random() * n);
      Object.keys(CAT).forEach((k) => {
        const free = CAT[k].items.filter((x) => owns(k, x[0]));
        draft[k] = free[r(free.length)][0];
        draft[CAT[k].colorKey] = r(CAT[k].colors.length);
      });
      Store.sfx.tap(); render();
    });
    $('.cr-reset').addEventListener('click', () => { Object.assign(draft, saved); Store.sfx.tap(); render(); });
    $('.cr-save').addEventListener('click', () => {
      const lk = locked();
      const cost = lk.reduce((s, x) => s + x[1][2], 0);
      if (cost) {
        if (!G.CQGems.spend(cost)) { G.CQGems.needMore(cost, () => U.go(creator, { tab, back })); return; }
        S.owned.items = S.owned.items || [];
        lk.forEach(([k, it]) => S.owned.items.push(itemKey(k, it[0])));
        Store.badge('stylish');
        U.confetti(40);
      }
      Object.assign(saved, draft);
      Store.save();
      Store.sfx.win();
      U.toast(cost ? 'Unlocked and saved. Looking good.' : 'Look saved.', '✨');
      render();
    });
    U.app.append(U.hud(back, 'My look'), scr);
    render();
  }

  G.CQAvatar = { svg, avatar, creator, look, palette, owns, CAT, DEFAULT, itemKey };
})(window);
