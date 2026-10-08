/* Wickd — "My Room" tycoon: spend coins to upgrade your trading room,
 * from a bedroom to a moon base. Screens boost take-profit coins, the trading
 * bot earns coins while you're away, everything else is for style.
 */
(function () {
  'use strict';
  const Store = window.CQStore;
  const S = Store.state;
  const { ic, coin } = window.CQIcons;
  const UI = () => window.CQUI;

  const TIERS = [
    { name: 'Bedroom', cost: 0, blurb: 'Where every great trader starts.' },
    { name: 'Garage studio', cost: 800, blurb: 'More space, more screens.' },
    { name: 'Downtown office', cost: 2500, blurb: 'A real office with a city view.' },
    { name: 'Skyscraper floor', cost: 6000, blurb: 'Above the clouds.' },
    { name: 'Penthouse', cost: 14000, blurb: 'The whole city is your chart.' },
    { name: 'Moon base', cost: 35000, blurb: 'Trading from space.' },
  ];

  const ITEMS = [
    { id: 'monitors', name: 'Screens', base: 90, levels: ['1 screen', '2 screens', '3 screens', '4 screens', '5 screens', '6 screens', '8 screens'],
      perk: (l) => (l ? `+${l * 5}% coins on every take profit` : 'Add screens to earn bonus coins on take profits') },
    { id: 'computer', name: 'Trading bot', base: 120, levels: ['No bot', 'Old laptop', 'Gaming PC', 'Trading rig', 'Server rack', 'Quantum bot', 'AI supercomputer'],
      perk: (l) => (l ? `Earns ${RATES[l]} coins an hour while you're away` : 'Buy a bot to earn coins while you\'re away') },
    { id: 'desk', name: 'Desk', base: 60, levels: ['Cardboard box', 'Wooden desk', 'Gaming desk', 'L-shaped desk', 'Glass desk', 'Gold desk', 'Command center'] },
    { id: 'chair', name: 'Chair', base: 40, levels: ['Floor cushion', 'Stool', 'Office chair', 'Gaming chair', 'Leather chair', 'Throne', 'Hover chair'] },
    { id: 'light', name: 'Lights', base: 50, levels: ['Ceiling bulb', 'Desk lamp', 'LED strip', 'Neon sign', 'Spotlights', 'Chandelier', 'Aurora lights'] },
    { id: 'decor', name: 'Wall decor', base: 45, levels: ['Bare wall', 'Candle poster', 'Framed chart', 'Coin plaque', 'Trophy shelf', 'Golden bull', 'Hall of fame'] },
    { id: 'plant', name: 'Plant', base: 30, levels: ['No plant', 'Cactus', 'Fern', 'Palm', 'Bonsai', 'Money tree', 'Glow tree'] },
    { id: 'pet', name: 'Pet', base: 150, levels: ['No pet', 'Goldfish', 'Cat', 'Puppy', 'Robot dog', 'Baby dragon', 'Phoenix'] },
  ];
  const RATES = [0, 12, 30, 60, 100, 160, 240];
  const CAP_HOURS = 8;

  function room() {
    if (!S.room) S.room = { tier: 0, items: {}, lastCollect: Date.now(), spent: 0 };
    ITEMS.forEach((it) => { if (S.room.items[it.id] == null) S.room.items[it.id] = 0; });
    return S.room;
  }
  const lvl = (id) => room().items[id] || 0;
  const maxLevel = () => Math.min(6, room().tier + 2);
  const costOf = (it, l) => Math.round((it.base * Math.pow(1.85, l)) / 5) * 5;
  function pending() {
    const r = room(), rate = RATES[lvl('computer')];
    if (!rate) return 0;
    const hrs = Math.min(CAP_HOURS, (Date.now() - r.lastCollect) / 3600000);
    return Math.floor(hrs * rate);
  }
  // Bonus multiplier for take-profit coins from screens (used by live.js).
  function tpBonus() { return 1 + lvl('monitors') * 0.05; }

  // ---------------------------------------------------------------- drawing
  const PAL = [
    { wall: '#3B2A6B', wall2: '#34255F', floor: '#6B4A33', floor2: '#5C3F2B', trim: '#2A1D52' },
    { wall: '#4B5163', wall2: '#434859', floor: '#3E424D', floor2: '#363A44', trim: '#2E323C' },
    { wall: '#2E3E5E', wall2: '#293754', floor: '#33395A', floor2: '#2D3350', trim: '#1E2742' },
    { wall: '#1E2A47', wall2: '#1B253F', floor: '#4A4E66', floor2: '#43475E', trim: '#141C33' },
    { wall: '#2B1F40', wall2: '#261B39', floor: '#7D6E92', floor2: '#736487', trim: '#1D152D' },
    { wall: '#2C3542', wall2: '#27303C', floor: '#3E4857', floor2: '#36404E', trim: '#1E252F' },
  ];

  // You, from behind, sitting at the desk in a hoodie that matches your avatar ring.
  function drawPlayer(ctx, chairL) {
    const A = window.CQAvatar, L = A.look(), c = A.palette(L);
    const cx = 185, seat = chairL === 0 ? 250 : chairL === 1 ? 236 : 232;
    // long hair falls behind the shoulders
    if (L.hair === 'long' || L.hair === 'afro' || L.hair === 'braids') {
      ctx.fillStyle = c.hair; rr(ctx, cx - 14, seat - 52, 28, 30, 10); ctx.fill();
    }
    const g = ctx.createLinearGradient(cx - 24, seat - 40, cx + 24, seat);
    g.addColorStop(0, c.topHi); g.addColorStop(1, c.topLo);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - 25, seat); ctx.quadraticCurveTo(cx - 27, seat - 34, cx - 11, seat - 39); ctx.lineTo(cx + 11, seat - 39); ctx.quadraticCurveTo(cx + 27, seat - 34, cx + 25, seat); ctx.closePath(); ctx.fill();
    if (L.top === 'varsity') { ctx.fillStyle = '#E9E6F5'; rr(ctx, cx - 27, seat - 30, 7, 28, 3); ctx.fill(); rr(ctx, cx + 20, seat - 30, 7, 28, 3); ctx.fill(); }
    if (L.top === 'hoodie') { ctx.fillStyle = c.topLo; ctx.beginPath(); ctx.ellipse(cx, seat - 37, 13, 6, 0, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = c.skinLo; ctx.fillRect(cx - 4, seat - 44, 8, 6);
    ctx.fillStyle = c.hair; ctx.beginPath(); ctx.arc(cx, seat - 52, 11, 0, 7); ctx.fill();
    if (L.hair === 'buns') { ctx.beginPath(); ctx.arc(cx - 9, seat - 63, 5, 0, 7); ctx.arc(cx + 9, seat - 63, 5, 0, 7); ctx.fill(); }
    if (L.hair === 'curls' || L.hair === 'afro') { for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(cx + k * 6, seat - 60 + Math.abs(k) * 2, 6, 0, 7); ctx.fill(); } }
    if (L.hair === 'braids') { rr(ctx, cx - 16, seat - 50, 5, 24, 2.5); ctx.fill(); rr(ctx, cx + 11, seat - 50, 5, 24, 2.5); ctx.fill(); }
    if (L.acc === 'cap' || L.acc === 'beanie') { ctx.fillStyle = c.acc; ctx.beginPath(); ctx.arc(cx, seat - 54, 11.5, Math.PI, 0); ctx.fill(); }
    {
      // headphones are the trader's signature at the desk
      ctx.strokeStyle = L.acc === 'headphones' ? c.acc : '#0E0B1E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, seat - 53, 13, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.fillStyle = L.acc === 'headphones' ? c.acc : '#0E0B1E'; rr(ctx, cx - 16, seat - 57, 6, 10, 3); ctx.fill(); rr(ctx, cx + 10, seat - 57, 6, 10, 3); ctx.fill();
    }
  }

  // Pip, the coach orb, floating in the corner.
  function drawPip(ctx, t) {
    const x = 350, y = 140 + Math.sin(t / 600) * 4;
    ctx.save(); ctx.shadowColor = '#FF4FD8'; ctx.shadowBlur = 18;
    const g = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, 13);
    g.addColorStop(0, '#fff'); g.addColorStop(.35, '#7C5CFF'); g.addColorStop(1, '#FF4FD8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.quadraticCurveTo(x + 5, y - 1, x, y + 2); ctx.quadraticCurveTo(x - 5, y - 1, x, y - 7); ctx.fill();
    ctx.fillRect(x - 2.5, y + 2, 5, 5);
  }

  // deterministic little price walks for the monitors
  const walks = [];
  for (let m = 0; m < 8; m++) {
    let p = 50, seed = 1234 + m * 977;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const arr = [];
    for (let i = 0; i < 400; i++) { const o = p; p += (rnd() - 0.48) * 6; p = Math.max(15, Math.min(85, p)); arr.push({ o, c: p, h: Math.max(o, p) + rnd() * 3, l: Math.min(o, p) - rnd() * 3 }); }
    walks.push(arr);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawRoom(ctx, W, H, t, r) {
    r = r || room();
    const s = W / 400;
    ctx.save();
    ctx.scale(s, s);
    const tier = r.tier, P = PAL[tier];
    const L = (id) => r.items[id] || 0;

    // wall + floor
    ctx.fillStyle = P.wall; ctx.fillRect(0, 0, 400, 214);
    ctx.fillStyle = P.wall2;
    if (tier === 0) {
      const wg = ctx.createLinearGradient(0, 0, 0, 214); wg.addColorStop(0, '#2A2258'); wg.addColorStop(1, '#3A2C6E');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, 400, 214);
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      for (let y = 8; y < 200; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 400; x += 16) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
    } else if (tier === 1) { for (let y = 10; y < 214; y += 18) for (let x = (y / 18) % 2 ? 0 : 20; x < 400; x += 40) ctx.fillRect(x, y, 38, 16); }
    else if (tier === 5) { for (let x = 0; x < 400; x += 50) ctx.fillRect(x, 0, 2, 214); ctx.fillRect(0, 100, 400, 2); }
    else { for (let x = 0; x < 400; x += 26) ctx.fillRect(x, 0, 12, 214); }
    ctx.fillStyle = P.trim; ctx.fillRect(0, 208, 400, 8);
    ctx.fillStyle = P.floor; ctx.fillRect(0, 216, 400, 64);
    ctx.fillStyle = P.floor2;
    if (tier === 0) {
      const fg = ctx.createLinearGradient(0, 216, 0, 280); fg.addColorStop(0, '#7A5238'); fg.addColorStop(1, '#5A3A26');
      ctx.fillStyle = fg; ctx.fillRect(0, 216, 400, 64);
      for (let row = 0; row < 6; row++) {
        const y = 216 + row * 11;
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, y, 400, 1.2);
        for (let x = (row % 2) * 45; x < 400; x += 90) { ctx.fillRect(x, y, 1.2, 11); ctx.fillStyle = row % 3 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; ctx.fillRect(x + 2, y + 2, 86, 8); ctx.fillStyle = 'rgba(0,0,0,.22)'; }
      }
    }
    else if (tier === 4) { ctx.globalAlpha = .4; for (let x = -40; x < 400; x += 70) { ctx.beginPath(); ctx.moveTo(x, 216); ctx.lineTo(x + 50, 280); ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.stroke(); } ctx.globalAlpha = 1; }
    else for (let x = 0; x < 400; x += 40) ctx.fillRect(x, 216, 1.5, 64);

    drawWindow(ctx, tier, t);
    if (tier === 0) drawBedroomExtras(ctx, t);

    // lights
    const li = L('light');
    if (li >= 2) { const g = ctx.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, li >= 6 ? `hsla(${(t / 30) % 360},90%,65%,.55)` : 'rgba(255,79,139,.45)'); g.addColorStop(1, 'rgba(255,79,139,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 30); }
    if (li === 0 || li === 1) { ctx.strokeStyle = '#1a1033'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 14); ctx.stroke(); ctx.fillStyle = '#FFE7A3'; ctx.beginPath(); ctx.arc(200, 18, 5, 0, 7); ctx.fill(); }
    if (li >= 5) { // chandelier
      ctx.strokeStyle = '#FFC94A'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(200, 0); ctx.lineTo(200, 12); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(200, 18, 22, 6, 0, 0, 7); ctx.stroke();
      for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#FFF3D6'; ctx.beginPath(); ctx.arc(200 + k * 10, 24, 2.5, 0, 7); ctx.fill(); }
    }
    if (li >= 3) { // neon sign: candle + "TP"
      const on = Math.sin(t / 300) > -0.95;
      ctx.save(); ctx.shadowColor = '#FF4F8B'; ctx.shadowBlur = on ? 14 : 0;
      ctx.strokeStyle = on ? '#FF7AA8' : '#7A3A57'; ctx.lineWidth = 3; rr(ctx, 136, 36, 92, 34, 10); ctx.stroke();
      ctx.fillStyle = on ? '#FFD1E1' : '#7A3A57'; ctx.font = '600 15px Unbounded, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAKE PROFIT', 182, 54);
      ctx.restore();
    }
    if (li >= 4) { // spotlights glow on floor
      ctx.fillStyle = 'rgba(255,230,160,.08)'; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(20, 280); ctx.lineTo(120, 280); ctx.fill(); ctx.beginPath(); ctx.moveTo(340, 0); ctx.lineTo(280, 280); ctx.lineTo(380, 280); ctx.fill();
    }

    drawDecor(ctx, L('decor'));

    // rug
    if (tier >= 1) { ctx.fillStyle = tier >= 4 ? '#B4325E' : '#5B3FA8'; ctx.beginPath(); ctx.ellipse(190, 258, 120, 16, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(190, 258, 108, 12, 0, 0, 7); ctx.stroke(); }

    if (tier === 0) drawBed(ctx);

    drawDesk(ctx, L('desk'), L('monitors'), L('pet') === 1, t);
    drawComputer(ctx, L('computer'), t);
    drawChair(ctx, L('chair'), tier);
    drawPlant(ctx, L('plant'), t);
    drawPet(ctx, L('pet'), t);

    drawPlayer(ctx, L('chair'));
    drawPip(ctx, t);

    // ambient light: monitor glow + soft vignette for depth
    const glow = ctx.createRadialGradient(185, 160, 10, 185, 160, 160);
    glow.addColorStop(0, 'rgba(124,92,255,.16)'); glow.addColorStop(1, 'rgba(124,92,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 400, 280);
    const vig = ctx.createRadialGradient(200, 140, 120, 200, 140, 300);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(5,3,20,.45)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, 400, 280);

    ctx.restore();
  }

  // Bedroom details: curtains, fairy lights, shelf, sneakers.
  function drawBedroomExtras(ctx, t) {
    // curtains around the window (window is x 244..376, y 26..130)
    const cur = (x, flip) => {
      const g = ctx.createLinearGradient(x, 0, x + 22, 0); g.addColorStop(0, '#5B3FA8'); g.addColorStop(1, '#7C5CFF');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(x, 18); ctx.lineTo(x + 22, 18); ctx.quadraticCurveTo(x + (flip ? 8 : 14), 90, x + (flip ? 2 : 20), 150); ctx.lineTo(x + (flip ? -4 : 0), 150); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      for (let k = 6; k < 20; k += 6) { ctx.beginPath(); ctx.moveTo(x + k, 20); ctx.quadraticCurveTo(x + k - 2, 90, x + k + (flip ? -6 : 2), 148); ctx.stroke(); }
    };
    ctx.fillStyle = '#16122E'; ctx.fillRect(232, 14, 156, 4);
    cur(232, false); cur(366, true);
    // fairy lights
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 8);
    for (let x = 0; x <= 230; x += 23) ctx.quadraticCurveTo(x + 11.5, 18, x + 23, 8);
    ctx.stroke();
    const cols = ['#FFD36B', '#FF7AB6', '#7CFFCB', '#9CC6FF'];
    for (let k = 0; k < 20; k++) {
      const x = 6 + k * 11.5, y = 10 + Math.sin((k / 20) * Math.PI * 20) * 2 + 3, on = 0.55 + 0.45 * Math.sin(t / 380 + k * 1.7);
      ctx.save(); ctx.globalAlpha = on; ctx.shadowColor = cols[k % 4]; ctx.shadowBlur = 8; ctx.fillStyle = cols[k % 4];
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); ctx.restore();
    }
    // wall shelf above the bed with books, a mini trophy and a plant
    ctx.fillStyle = '#5A3A26'; rr(ctx, 8, 128, 92, 5, 2); ctx.fill();
    const books = [['#FF4F8B', 16], ['#3CFFB1', 14], ['#FFC94A', 18], ['#7C5CFF', 15], ['#4FA8FF', 13]];
    let bx = 14;
    books.forEach(([c, hgt], i) => { ctx.fillStyle = c; ctx.fillRect(bx, 128 - hgt, 6, hgt); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(bx + 1, 128 - hgt + 3, 4, 1); bx += i === 2 ? 9 : 7; });
    ctx.fillStyle = '#FFC94A'; ctx.fillRect(62, 118, 8, 10); ctx.beginPath(); ctx.arc(66, 116, 6, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#B4532F'; ctx.fillRect(80, 120, 12, 8);
    ctx.fillStyle = '#3FD18B'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(86 + k * 4, 114, 3, 7, k * .5, 0, 7); ctx.fill(); }
    // round shaggy rug
    ctx.fillStyle = '#C24B8F'; ctx.beginPath(); ctx.ellipse(196, 262, 92, 13, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(196, 262, 80 - k * 22, 10 - k * 3, 0, 0, 7); ctx.stroke(); }
    // sneakers by the bed
    const shoe = (x) => { ctx.fillStyle = '#F2EEFF'; rr(ctx, x, 252, 18, 7, 3); ctx.fill(); ctx.fillStyle = '#FF4F8B'; ctx.fillRect(x + 2, 252, 9, 3); ctx.fillStyle = '#2A2258'; ctx.fillRect(x, 258, 18, 1.5); };
    shoe(60); shoe(80);
  }

  function drawBed(ctx) {
    // headboard
    ctx.fillStyle = '#2A1B4F'; rr(ctx, 4, 150, 104, 40, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)'; rr(ctx, 10, 156, 92, 6, 3); ctx.fill();
    // frame + legs
    ctx.fillStyle = '#3B2A6B'; rr(ctx, 4, 196, 104, 22, 4); ctx.fill();
    ctx.fillStyle = '#1E1440'; ctx.fillRect(8, 216, 6, 12); ctx.fillRect(98, 216, 6, 12);
    // mattress
    ctx.fillStyle = '#EDE6FF'; rr(ctx, 6, 182, 100, 18, 5); ctx.fill();
    // pillows
    ctx.fillStyle = '#FFFFFF'; rr(ctx, 10, 170, 30, 16, 7); ctx.fill();
    ctx.fillStyle = '#FFD1E6'; rr(ctx, 26, 172, 26, 14, 7); ctx.fill();
    // duvet with gradient and stitching
    const g = ctx.createLinearGradient(40, 180, 106, 214); g.addColorStop(0, '#7C5CFF'); g.addColorStop(1, '#FF4FD8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(44, 182); ctx.quadraticCurveTo(70, 176, 108, 184); ctx.lineTo(108, 212); ctx.quadraticCurveTo(76, 216, 40, 212); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    for (let x = 58; x < 108; x += 16) { ctx.beginPath(); ctx.moveTo(x, 182); ctx.lineTo(x - 2, 212); ctx.stroke(); }
    ctx.setLineDash([]);
    // folded blanket stripe
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(44, 186, 64, 3);
  }

  function drawWindow(ctx, tier, t) {
    ctx.save();
    if (tier === 5) {
      ctx.fillStyle = '#9AA6B6'; ctx.beginPath(); ctx.arc(312, 86, 58, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(312, 86, 50, 0, 7); ctx.clip();
      ctx.fillStyle = '#05030F'; ctx.fillRect(250, 30, 130, 120);
      for (let k = 0; k < 30; k++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + (k % 3) * 0.2})`; ctx.fillRect(262 + (k * 37) % 100, 40 + (k * 53) % 90, 1.5, 1.5); }
      ctx.fillStyle = '#2F7BFF'; ctx.beginPath(); ctx.arc(330, 100, 24, 0, 7); ctx.fill();
      ctx.fillStyle = '#3FD18B'; ctx.beginPath(); ctx.ellipse(322, 94, 9, 6, .5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(338, 110, 7, 5, -.4, 0, 7); ctx.fill();
      ctx.restore(); return;
    }
    const big = tier === 4;
    const x = big ? 206 : 244, y = big ? 14 : 26, w = big ? 186 : 132, h = big ? 186 : 104;
    ctx.fillStyle = '#1A1033'; rr(ctx, x - 4, y - 4, w + 8, h + 8, 6); ctx.fill();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    const skies = [['#0B1640', '#2A2470'], ['#FF8A5C', '#7A3A8F'], ['#3A6FD8', '#9CC6FF'], ['#5FA8FF', '#D8ECFF'], ['#0A0A2E', '#3A1F6B']];
    sky.addColorStop(0, skies[tier][0]); sky.addColorStop(1, skies[tier][1]);
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    if (tier === 0 || tier === 4) {
      for (let k = 0; k < 18; k++) { const tw = 0.5 + 0.5 * Math.sin(t / 400 + k); ctx.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.6})`; ctx.fillRect(x + (k * 41) % w, y + (k * 23) % (h * 0.5), 1.6, 1.6); }
      ctx.fillStyle = '#FFF3D6'; ctx.beginPath(); ctx.arc(x + w - 26, y + 22, 10, 0, 7); ctx.fill();
    }
    if (tier === 0) { // suburban roofs
      ctx.fillStyle = '#140C2E';
      [[0, 70], [40, 60], [80, 74]].forEach(([dx, hh]) => { ctx.beginPath(); ctx.moveTo(x + dx, y + h); ctx.lineTo(x + dx, y + hh); ctx.lineTo(x + dx + 22, y + hh - 16); ctx.lineTo(x + dx + 44, y + hh); ctx.lineTo(x + dx + 44, y + h); ctx.fill(); });
      ctx.fillStyle = '#FFD36B'; ctx.fillRect(x + 50, y + 76, 6, 6); ctx.fillRect(x + 92, y + 86, 6, 6);
    }
    if (tier === 1) { ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(x + 40, y + 70, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#3B1F4F'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * 24, y + h, 22 + (k % 2) * 8, Math.PI, 0); ctx.fill(); } }
    if (tier >= 2 && tier <= 4) {
      const base = tier === 2 ? y + 30 : tier === 3 ? y + 66 : y + 100;
      if (tier === 3) { ctx.fillStyle = 'rgba(255,255,255,.85)'; const cx = x + ((t / 60) % (w + 60)) - 30; ctx.beginPath(); ctx.ellipse(cx, y + 30, 22, 8, 0, 0, 7); ctx.ellipse(cx + 18, y + 26, 14, 7, 0, 0, 7); ctx.fill(); }
      for (let k = 0; k < 12; k++) {
        const bw = 14 + (k * 7) % 14, bx = x + k * 17 - 4, bh = (tier === 4 ? 30 : 20) + ((k * 37) % 50);
        ctx.fillStyle = tier === 4 ? '#140B2A' : '#1F2D4F'; ctx.fillRect(bx, base + 60 - bh, bw, h);
        ctx.fillStyle = tier === 4 ? '#FFC94A' : '#9CC6FF';
        for (let wy = base + 64 - bh; wy < y + h; wy += 7) for (let wx = bx + 3; wx < bx + bw - 3; wx += 5) if ((wx * 7 + wy * 3 + k) % 5 < 2) ctx.fillRect(wx, wy, 2, 3);
      }
    }
    ctx.restore();
    ctx.strokeStyle = '#1A1033'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
    if (!big) { ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); }
  }

  function drawDecor(ctx, l) {
    if (!l) return;
    // poster with a mini chart
    ctx.fillStyle = l >= 2 ? '#C99A3A' : '#F6F0FF'; rr(ctx, 26, 34, 70, 52, 3); ctx.fill();
    ctx.fillStyle = '#1B1236'; ctx.fillRect(30, 38, 62, 44);
    const ys = [70, 64, 68, 56, 60, 48, 52, 44];
    ys.forEach((yy, i) => { ctx.fillStyle = i % 3 === 2 ? '#FF5C7A' : '#2EE6A6'; ctx.fillRect(34 + i * 7, yy, 4, 10); });
    if (l >= 3) { ctx.fillStyle = '#5C3F2B'; rr(ctx, 110, 92, 40, 30, 3); ctx.fill(); ctx.fillStyle = '#FFC94A'; ctx.beginPath(); ctx.arc(130, 107, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#C77A0A'; ctx.fillRect(128, 102, 4, 10); }
    if (l >= 4) { ctx.fillStyle = '#2A1D52'; ctx.fillRect(22, 110, 80, 5); [32, 52, 72, 90].forEach((xx, i) => { ctx.fillStyle = i % 2 ? '#C0C7D6' : '#FFC94A'; ctx.fillRect(xx - 4, 98, 8, 12); ctx.beginPath(); ctx.arc(xx, 96, 6, 0, Math.PI); ctx.fill(); }); }
    if (l >= 5) { ctx.fillStyle = '#FFC94A'; ctx.beginPath(); ctx.ellipse(62, 140, 18, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(48, 136); ctx.lineTo(42, 126); ctx.lineTo(52, 133); ctx.moveTo(76, 136); ctx.lineTo(82, 126); ctx.lineTo(72, 133); ctx.fill(); ctx.fillRect(56, 148, 12, 8); }
    if (l >= 6) { ctx.fillStyle = 'rgba(255,201,74,.18)'; rr(ctx, 16, 24, 150, 160, 10); ctx.fill(); }
  }

  function drawDesk(ctx, l, mon, fish, t) {
    const cx = 185;
    if (l === 0) {
      ctx.fillStyle = '#B8834F'; ctx.fillRect(140, 188, 90, 44); ctx.fillStyle = '#9C6C3C'; ctx.fillRect(140, 188, 90, 6); ctx.fillStyle = '#7E552E'; ctx.fillRect(183, 196, 4, 20);
    } else {
      const w = [0, 150, 170, 190, 200, 210, 230][l], top = 184;
      const colors = [null, '#8A5A3A', '#2D2154', '#3D2E6E', 'rgba(200,230,255,.45)', '#E2B13C', '#1B1236'];
      ctx.fillStyle = colors[l]; rr(ctx, cx - w / 2, top, w, 8, 2); ctx.fill();
      ctx.fillStyle = l === 5 ? '#B4862A' : l === 4 ? 'rgba(200,230,255,.3)' : '#1A1033';
      ctx.fillRect(cx - w / 2 + 6, top + 8, 6, 44); ctx.fillRect(cx + w / 2 - 12, top + 8, 6, 44);
      if (l === 2 || l === 6) { ctx.fillStyle = '#FF4F8B'; ctx.fillRect(cx - w / 2, top + 7, w, 2); }
      if (l === 3) { ctx.fillStyle = '#3D2E6E'; ctx.fillRect(cx + w / 2 - 50, top, 50, 30); }
      if (l >= 1) { ctx.fillStyle = '#100A22'; rr(ctx, cx - 26, top - 4, 52, 5, 2); ctx.fill(); } // keyboard
    }
    // lamp on desk
    // monitors
    const counts = [1, 2, 3, 4, 5, 6, 8], n = counts[mon];
    const mw = 38, mh = 26, gap = 4, perRow = n > 4 ? Math.ceil(n / 2) : n, rows = n > 4 ? 2 : 1;
    const deskTop = l === 0 ? 188 : 184;
    for (let k = 0; k < n; k++) {
      const row = rows === 2 ? (k < perRow ? 0 : 1) : 0, col = row ? k - perRow : k;
      const inRow = row ? n - perRow : perRow;
      const x = cx - (inRow * mw + (inRow - 1) * gap) / 2 + col * (mw + gap);
      const y = deskTop - 8 - mh - (rows - 1 - row) * (mh + 4);
      ctx.fillStyle = '#100A22'; rr(ctx, x - 2, y - 2, mw + 4, mh + 4, 3); ctx.fill();
      if (row === rows - 1) { ctx.fillRect(x + mw / 2 - 2, y + mh, 4, deskTop - y - mh); }
      ctx.fillStyle = '#1B1236'; ctx.fillRect(x, y, mw, mh);
      const wk = walks[k], off = Math.floor(t / 700) + k * 37;
      let lo = 1e9, hi = -1e9;
      for (let c = 0; c < 8; c++) { const kk = wk[(off + c) % wk.length]; lo = Math.min(lo, kk.l); hi = Math.max(hi, kk.h); }
      for (let c = 0; c < 8; c++) {
        const kk = wk[(off + c) % wk.length], up = kk.c >= kk.o;
        const sy = (v) => y + mh - 3 - ((v - lo) / Math.max(1, hi - lo)) * (mh - 6);
        ctx.fillStyle = up ? '#2EE6A6' : '#FF5C7A';
        ctx.fillRect(x + 2 + c * 4.5 + 1.2, sy(kk.h), 0.8, sy(kk.l) - sy(kk.h));
        ctx.fillRect(x + 2 + c * 4.5, sy(Math.max(kk.o, kk.c)), 3, Math.max(1, Math.abs(sy(kk.o) - sy(kk.c))));
      }
    }
    if (fish) { ctx.fillStyle = 'rgba(160,210,255,.5)'; ctx.beginPath(); ctx.arc(cx + 62, deskTop - 10, 10, 0, 7); ctx.fill(); ctx.fillStyle = '#FF9F43'; const fx = cx + 58 + Math.sin(t / 600) * 4; ctx.beginPath(); ctx.ellipse(fx, deskTop - 10, 3.5, 2.2, 0, 0, 7); ctx.fill(); }
  }

  function drawComputer(ctx, l, t) {
    if (!l) return;
    const blink = (k) => (Math.floor(t / 250 + k) % 3 ? '#2EE6A6' : '#0F5E45');
    if (l === 1) { ctx.fillStyle = '#5A5F70'; rr(ctx, 118, 170, 26, 16, 2); ctx.fill(); ctx.fillStyle = '#9CC6FF'; ctx.fillRect(121, 172, 20, 11); return; }
    if (l <= 3) {
      const h = l === 2 ? 50 : 60, x = 276, y = 232 - h;
      ctx.fillStyle = '#1A1033'; rr(ctx, x, y, 26, h, 3); ctx.fill();
      ctx.fillStyle = l === 3 ? '#FF4F8B' : '#7C4DFF'; ctx.fillRect(x + 4, y + 6, 2, h - 12);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = blink(k); ctx.fillRect(x + 14, y + 8 + k * 8, 6, 3); }
      return;
    }
    const h = l === 4 ? 100 : l === 5 ? 110 : 120, x = 270, y = 232 - h, w = l === 6 ? 40 : 34;
    ctx.fillStyle = l === 6 ? '#0E0A1F' : '#1A1033'; rr(ctx, x, y, w, h, 3); ctx.fill();
    for (let r = 0; r < Math.floor(h / 12); r++) { ctx.fillStyle = '#2D2154'; ctx.fillRect(x + 3, y + 4 + r * 12, w - 6, 9); for (let k = 0; k < 3; k++) { ctx.fillStyle = l >= 5 && (r + k) % 4 === 0 ? '#B18CFF' : blink(r + k); ctx.fillRect(x + 6 + k * 6, y + 7 + r * 12, 3, 3); } }
    if (l === 6) { ctx.save(); ctx.shadowColor = '#B18CFF'; ctx.shadowBlur = 16; ctx.strokeStyle = '#B18CFF'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 3); ctx.stroke(); ctx.restore(); }
  }

  function drawChair(ctx, l, tier) {
    const cx = 185;
    const base = 262;
    if (l === 0) { ctx.fillStyle = '#FF4F8B'; ctx.beginPath(); ctx.ellipse(cx, base - 4, 26, 9, 0, 0, 7); ctx.fill(); return; }
    if (l === 1) { ctx.fillStyle = '#8A5A3A'; ctx.fillRect(cx - 18, base - 30, 36, 6); ctx.fillRect(cx - 15, base - 24, 4, 24); ctx.fillRect(cx + 11, base - 24, 4, 24); return; }
    const col = ['', '', '#3D2E6E', '#FF4F8B', '#5C3F2B', '#E2B13C', '#B18CFF'][l];
    const bh = l >= 5 ? 50 : l === 3 ? 46 : 40, bw = l >= 5 ? 50 : 44;
    if (l === 6) { ctx.fillStyle = 'rgba(177,140,255,.35)'; ctx.beginPath(); ctx.ellipse(cx, base + 4, 30, 5, 0, 0, 7); ctx.fill(); }
    else { ctx.fillStyle = '#1A1033'; ctx.fillRect(cx - 2, base - 22, 4, 18); ctx.fillRect(cx - 18, base - 4, 36, 4); }
    ctx.fillStyle = col; rr(ctx, cx - bw / 2, base - 22 - bh + (l === 6 ? -8 : 0), bw, bh, 12); ctx.fill();
    if (l === 3) { ctx.fillStyle = '#1A1033'; rr(ctx, cx - 10, base - 22 - bh + 10, 20, 26, 6); ctx.fill(); }
    if (l === 5) { ctx.fillStyle = '#B4862A'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 18 - 6, base - 22 - bh); ctx.lineTo(cx + k * 18, base - 36 - bh); ctx.lineTo(cx + k * 18 + 6, base - 22 - bh); ctx.fill(); } }
    void tier;
  }

  function drawPlant(ctx, l, t) {
    if (!l) return;
    const x = 372, y = 250;
    ctx.fillStyle = l >= 5 ? '#E2B13C' : '#B4532F'; ctx.beginPath(); ctx.moveTo(x - 14, y - 22); ctx.lineTo(x + 14, y - 22); ctx.lineTo(x + 10, y); ctx.lineTo(x - 10, y); ctx.fill();
    const sway = Math.sin(t / 900) * 2;
    if (l === 1) { ctx.fillStyle = '#3FB27F'; rr(ctx, x - 5, y - 52, 10, 32, 5); ctx.fill(); rr(ctx, x - 14, y - 42, 8, 14, 4); ctx.fill(); return; }
    const leaf = l === 6 ? '#7CFFCB' : l === 5 ? '#3FD18B' : '#2FA36B', hgt = [0, 0, 40, 70, 46, 60, 66][l];
    if (l === 6) { ctx.save(); ctx.shadowColor = '#7CFFCB'; ctx.shadowBlur = 12; }
    for (let k = -3; k <= 3; k++) { ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(x + k * 6 + sway, y - 24 - hgt * (1 - Math.abs(k) * 0.18), 6, 16, k * 0.35, 0, 7); ctx.fill(); }
    if (l === 5) { for (let k = 0; k < 5; k++) { ctx.fillStyle = '#FFC94A'; ctx.beginPath(); ctx.arc(x - 12 + k * 6 + sway, y - 50 - (k % 2) * 14, 3, 0, 7); ctx.fill(); } }
    if (l === 6) ctx.restore();
  }

  function drawPet(ctx, l, t) {
    if (l < 2) return;
    const x = 116, y = 258, b = Math.abs(Math.sin(t / 350)) * 3;
    if (l === 2) { ctx.fillStyle = '#3A3A4A'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 10, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 14, y - 18, 8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 9, y - 24); ctx.lineTo(x + 11, y - 32); ctx.lineTo(x + 15, y - 25); ctx.moveTo(x + 15, y - 25); ctx.lineTo(x + 19, y - 32); ctx.lineTo(x + 21, y - 23); ctx.fill(); ctx.strokeStyle = '#3A3A4A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 14, y - 10); ctx.quadraticCurveTo(x - 26, y - 22 - b, x - 20, y - 30); ctx.stroke(); ctx.fillStyle = '#FFE08A'; ctx.fillRect(x + 12, y - 20, 2, 2); ctx.fillRect(x + 17, y - 20, 2, 2); return; }
    if (l === 3 || l === 4) {
      const body = l === 3 ? '#D9A066' : '#AEB8CC';
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x, y - 10 - b, 18, 11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 16, y - 22 - b, 9, 0, 7); ctx.fill();
      ctx.fillStyle = l === 3 ? '#8A5A3A' : '#5A6478'; ctx.beginPath(); ctx.ellipse(x + 10, y - 24 - b, 4, 7, -.4, 0, 7); ctx.fill();
      ctx.fillStyle = l === 4 ? '#2EE6A6' : '#1A1033'; ctx.fillRect(x + 18, y - 24 - b, 2.5, 2.5);
      ctx.fillStyle = body; ctx.fillRect(x - 12, y - 4 - b, 4, 6 + b); ctx.fillRect(x + 8, y - 4 - b, 4, 6 + b);
      return;
    }
    // dragon / phoenix
    const col = l === 5 ? '#2EE6A6' : '#FF7A3D', wing = l === 5 ? '#1FA97A' : '#FFC94A';
    const fy = y - 30 - Math.sin(t / 400) * 6;
    ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(x - 4, fy); ctx.lineTo(x - 22, fy - 16 - Math.sin(t / 150) * 6); ctx.lineTo(x - 2, fy - 6); ctx.moveTo(x + 4, fy); ctx.lineTo(x + 22, fy - 16 - Math.sin(t / 150) * 6); ctx.lineTo(x + 2, fy - 6); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, fy, 9, 12, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, fy - 13, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#1A1033'; ctx.fillRect(x - 3, fy - 15, 2, 2); ctx.fillRect(x + 2, fy - 15, 2, 2);
  }

  // A canvas host that animates the room until it leaves the page.
  function mountRoom(host) {
    const cv = document.createElement('canvas');
    cv.className = 'room-canvas';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    function frame(t) {
      if (!host.isConnected) return;
      const w = host.clientWidth, h = Math.round(w * 0.7), dpr = Math.min(devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRoom(ctx, w, h, t);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- screen
  function collect() {
    const amt = pending();
    if (!amt) return 0;
    room().lastCollect = Date.now();
    UI().giveCoins(amt);
    Store.save();
    return amt;
  }

  function roomScreen() {
    const U = UI();
    const r = room();
    const tier = TIERS[r.tier], next = TIERS[r.tier + 1];
    const rate = RATES[lvl('computer')];
    const pend = pending();
    const capped = rate && (Date.now() - r.lastCollect) / 3600000 >= CAP_HOURS;
    const maxL = maxLevel();
    const root = U.el(`<main class="screen roomscr">
      <section class="room-hero">
        <div class="room-stage"></div>
        <div class="room-caption"><div><h2>${U.esc(S.name || 'Your')}'s ${tier.name.toLowerCase()}</h2><p class="tiny">Room value ${r.spent.toLocaleString()} · upgrades up to level ${maxL}</p></div>
          <button class="chip style-btn">${ic('shop')}Style</button></div>
      </section>
      <section class="bot-card ${rate ? '' : 'off'}">
        <span class="bot-ic">${ic('bolt')}</span>
        <div><b>${rate ? `Trading bot: ${rate} coins/hour` : 'No trading bot yet'}</b><small>${rate ? (capped ? 'Storage full! Collect to keep earning.' : `Stores up to ${CAP_HOURS} hours of earnings`) : 'Buy one below and it earns coins while you\'re away.'}</small></div>
        ${rate ? `<button class="btn small buy collect" ${pend ? '' : 'disabled'}>${coin()}${pend}</button>` : ''}
      </section>
      ${next ? `<section class="move-card">
        <div><b>Move to the ${next.name.toLowerCase()}</b><small>${next.blurb} Unlocks upgrades up to level ${Math.min(6, r.tier + 3)}.</small></div>
        <button class="btn small ${S.coins >= next.cost ? 'btn-flame' : 'btn-ghost'} move">${coin()}${next.cost.toLocaleString()}</button>
      </section>` : '<section class="move-card done"><div><b>You made it to the moon!</b><small>The biggest trading room in the game.</small></div></section>'}
      <h2 class="section-title">Upgrades</h2>
      <div class="upgrade-list"></div>
    </main>`);
    const list = root.querySelector('.upgrade-list');
    ITEMS.forEach((it) => {
      const l = lvl(it.id);
      const atMax = l >= 6;
      const locked = !atMax && l >= maxL;
      const cost = atMax ? 0 : costOf(it, l);
      const row = U.el(`<div class="upgrade">
        <div class="up-main"><b>${it.name}</b><small>${U.esc(it.levels[l])}${it.perk ? ' · ' + U.esc(it.perk(l)) : ''}</small>
          <span class="up-dots">${[1, 2, 3, 4, 5, 6].map((k) => `<i class="${k <= l ? 'on' : k > maxL ? 'cap' : ''}"></i>`).join('')}</span></div>
        ${atMax ? '<span class="up-max">Maxed</span>'
          : locked ? `<span class="up-lock">${ic('lock')}Move up a room</span>`
            : `<button class="btn small ${S.coins >= cost ? 'buy' : 'btn-ghost'} up-buy" title="Upgrade to ${U.esc(it.levels[l + 1])}">${coin()}${cost.toLocaleString()}</button>`}
      </div>`);
      const b = row.querySelector('.up-buy');
      if (b) b.addEventListener('click', () => {
        if (S.coins < cost) { Store.sfx.bad(); U.toast(`You need ${cost - S.coins} more coins for the ${it.levels[l + 1].toLowerCase()}.`, '🪙'); return; }
        S.coins -= cost; r.spent += cost;
        if (it.id === 'computer' && l === 0) r.lastCollect = Date.now();
        r.items[it.id] = l + 1;
        Store.save(); Store.sfx.win(); Store.badge('room1'); if (window.CQMeta) window.CQMeta.track('roomUp');
        U.toast(`New: ${it.levels[l + 1]}!`, '✨');
        U.go(roomScreen);
      });
      list.appendChild(row);
    });
    U.app.append(U.hud(null, 'My room'), root, U.nav('room'));
    mountRoom(root.querySelector('.room-stage'));
    const c = root.querySelector('.collect');
    if (c) c.addEventListener('click', () => { const a = collect(); if (a) { U.toast(`Your bot made ${a} coins!`, '🤖'); U.go(roomScreen); } });
    root.querySelector('.style-btn').addEventListener('click', () => { Store.sfx.tap(); U.go(U.shop); });
    const mv = root.querySelector('.move');
    if (mv) mv.addEventListener('click', () => {
      if (S.coins < next.cost) { Store.sfx.bad(); U.toast(`Save ${(next.cost - S.coins).toLocaleString()} more coins to move.`, '🏠'); return; }
      S.coins -= next.cost; r.spent += next.cost; r.tier++;
      Store.save(); Store.sfx.win(); U.confetti(90);
      if (r.tier >= 4) Store.badge('tycoon');
      U.toast(`Welcome to your ${TIERS[r.tier].name.toLowerCase()}!`, '🏙️');
      U.go(roomScreen);
    });
  }

  window.CQRoom = { roomScreen, mountRoom, pending, collect, tpBonus, room, TIERS, RATES };
})();
