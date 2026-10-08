/* Wickd — the camp tycoon: your crew starts in the woods with a tent and a phone
 * hotspot, and coins upgrade you all the way to a skyline penthouse. Screens boost
 * take-profit coins, better signal runs a bot that earns while you're away,
 * everything else is for style.
 */
(function () {
  'use strict';
  const Store = window.CQStore;
  const S = Store.state;
  const { ic, coin } = window.CQIcons;
  const UI = () => window.CQUI;

  // From the woods to the skyline: every crew starts with a tent and a phone hotspot.
  const TIERS = [
    { name: 'Woods camp', cost: 0, blurb: 'A tent, a campfire and one bar of signal. Everyone starts here.' },
    { name: 'Base camp', cost: 800, blurb: 'A bigger tent, a tarp over your desk and real power.' },
    { name: 'Log cabin', cost: 2500, blurb: 'Four walls, a porch and the city lights getting closer.' },
    { name: 'City studio', cost: 6000, blurb: 'You made it to the city. Small place, big view.' },
    { name: 'Downtown loft', cost: 14000, blurb: 'Brick walls, tall windows, serious setup.' },
    { name: 'Skyline penthouse', cost: 35000, blurb: 'The whole city below you. You started in a tent.' },
  ];

  // ids are kept from the room version so saves carry over
  const ITEMS = [
    { id: 'monitors', name: 'Screens', base: 90, levels: ['Phone', 'Old laptop', 'Laptop + monitor', '2 monitors', '3 monitors', '4 monitors', '6-screen wall'],
      perk: (l) => (l ? `+${l * 5}% coins on every take profit` : 'Add screens to earn bonus coins on take profits') },
    { id: 'computer', name: 'Signal & bot', base: 120, levels: ['Phone hotspot', 'Mobile router', 'Signal booster', 'Satellite dish', 'Fiber line', 'Data center link', 'Private server'],
      perk: (l) => (l ? `Your bot earns ${RATES[l]} coins an hour while you're away` : 'Better signal lets a trading bot run while you\'re away') },
    { id: 'desk', name: 'Desk', base: 60, levels: ['Log bench', 'Folding table', 'Camp desk', 'Wood desk', 'Standing desk', 'Glass desk', 'Executive desk'] },
    { id: 'chair', name: 'Seat', base: 40, levels: ['Tree stump', 'Camp chair', 'Folding chair', 'Office chair', 'Gaming chair', 'Lounge chair', 'Throne'] },
    { id: 'light', name: 'Lighting', base: 50, levels: ['Campfire', 'Lantern', 'String lights', 'Desk lamp', 'LED strip', 'Neon flame sign', 'Skyline glow'] },
    { id: 'decor', name: 'Decor', base: 45, levels: ['Nothing yet', 'Crew flag', 'Map board', 'Chart posters', 'Trophy shelf', 'Golden bull & bear', 'Hall of fame'] },
    { id: 'plant', name: 'Power', base: 30, levels: ['Phone battery', 'Power bank', 'Solar panel', 'Generator', 'Grid power', 'Battery wall', 'Fusion core'] },
    { id: 'pet', name: 'Companion', base: 150, levels: ['None', 'Firefly jar', 'Owl', 'Raccoon', 'Husky pup', 'Hawk', 'Phoenix'] },
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

  // ---------------------------------------------------------------- drawing (400 x 280 scene)
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  const rnd = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const STARS = (() => { const r = rnd(42), a = []; for (let i = 0; i < 70; i++) a.push([r() * 400, r() * 150, r() * 1.3 + 0.3, r() * 6]); return a; })();
  const CITY = (() => { const r = rnd(7), a = []; let x = 0; while (x < 420) { const w = 8 + r() * 18, h = 20 + r() * 70; a.push([x, w, h, r()]); x += w + 1; } return a; })();
  const FLAME = (ctx, x, y, s, t, a) => {
    const f = 1 + Math.sin(t / 140 + x) * 0.06;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s * f);
    ctx.fillStyle = a || '#FF7A2F';
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.bezierCurveTo(10, -6, 12, 2, 6, 10); ctx.bezierCurveTo(3, 14, -3, 14, -6, 10); ctx.bezierCurveTo(-12, 2, -9, -7, 0, -16); ctx.fill();
    ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.bezierCurveTo(5, 1, 5, 6, 2, 9); ctx.bezierCurveTo(0, 11, -2, 11, -3, 9); ctx.bezierCurveTo(-5, 5, -4, 1, 0, -4); ctx.fill();
    ctx.restore();
  };
  const glow = (ctx, x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const pine = (ctx, x, y, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h * 0.32, y - h * 0.35); ctx.lineTo(x + h * 0.2, y - h * 0.35); ctx.lineTo(x + h * 0.42, y); ctx.lineTo(x - h * 0.42, y); ctx.lineTo(x - h * 0.2, y - h * 0.35); ctx.lineTo(x - h * 0.32, y - h * 0.35); ctx.closePath(); ctx.fill(); };

  function drawSky(ctx, tier, t, li) {
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, '#060C1C'); g.addColorStop(1, li >= 6 ? '#2A2350' : '#18263F');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 400, 280);
    STARS.forEach(([x, y, r, ph]) => { ctx.globalAlpha = 0.45 + 0.4 * Math.sin(t / 700 + ph); ctx.fillStyle = '#DCE6FF'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  function drawCityFar(ctx, y, scale, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, y - 40 * scale, 0, y); g.addColorStop(0, 'rgba(255,170,90,0)'); g.addColorStop(1, 'rgba(255,170,90,.28)');
    ctx.fillStyle = g; ctx.fillRect(150, y - 40 * scale, 250, 40 * scale);
    const r = rnd(11);
    CITY.forEach(([x, w, h, k]) => {
      if (x < 160) return;
      ctx.fillStyle = '#0E1729'; ctx.fillRect(x, y - h * 0.35 * scale, w * 0.8, h * 0.35 * scale);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = r() > 0.4 ? '#FFC873' : '#7FD6FF'; ctx.fillRect(x + r() * w * 0.7, y - r() * h * 0.33 * scale, 1.4, 1.4); }
    });
    ctx.restore();
  }
  function drawMountains(ctx) {
    ctx.fillStyle = '#111D33'; ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(60, 120); ctx.lineTo(110, 150); ctx.lineTo(170, 105); ctx.lineTo(240, 150); ctx.lineTo(300, 125); ctx.lineTo(400, 160); ctx.lineTo(400, 200); ctx.lineTo(0, 200); ctx.fill();
    ctx.fillStyle = '#0D172A'; ctx.beginPath(); ctx.moveTo(0, 185); ctx.lineTo(80, 150); ctx.lineTo(140, 175); ctx.lineTo(220, 150); ctx.lineTo(320, 178); ctx.lineTo(400, 165); ctx.lineTo(400, 210); ctx.lineTo(0, 210); ctx.fill();
  }
  function drawGround(ctx, tier) {
    const g = ctx.createLinearGradient(0, 196, 0, 280); g.addColorStop(0, '#121B1C'); g.addColorStop(1, '#080D0E');
    ctx.fillStyle = g; ctx.fillRect(0, 196, 400, 84);
    ctx.fillStyle = tier >= 2 ? '#2A2219' : '#241F19'; ctx.beginPath(); ctx.ellipse(210, 248, 190, 30, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(120,150,110,.18)';
    for (let i = 0; i < 26; i++) { const x = (i * 53) % 400, y = 205 + ((i * 37) % 70); ctx.fillRect(x, y, 1.5, 5); ctx.fillRect(x + 3, y + 1, 1.2, 4); }
  }
  function drawTrees(ctx, tier) {
    [[18, 205, 96], [44, 200, 70], [388, 206, 104], [362, 200, 76], [330, 196, 54], [80, 196, 50]].forEach(([x, y, h], i) => { if (tier === 2 && i === 4) return; pine(ctx, x, y, h, i % 2 ? '#0C1626' : '#091221'); });
  }
  function drawTent(ctx, big, t) {
    const x = big ? 20 : 34, w = big ? 128 : 96, h = big ? 84 : 64, base = 226;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, base + 2, w / 2 + 6, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1B5C60'; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + w / 2, base - h); ctx.lineTo(x + w, base); ctx.fill();
    ctx.fillStyle = '#237479'; ctx.beginPath(); ctx.moveTo(x + w * 0.18, base); ctx.lineTo(x + w / 2, base - h); ctx.lineTo(x + w * 0.62, base); ctx.fill();
    ctx.fillStyle = '#0A1416'; ctx.beginPath(); ctx.moveTo(x + w * 0.4, base); ctx.lineTo(x + w / 2, base - h * 0.55); ctx.lineTo(x + w * 0.6, base); ctx.fill();
    glow(ctx, x + w / 2, base - 10, 18, 'rgba(255,190,110,A)', 0.35);
    ctx.strokeStyle = '#0F3A3D'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + w / 2, base - h); ctx.lineTo(x + w / 2, base - h - 8); ctx.stroke();
    // crew flame patch on the tent
    ctx.fillStyle = '#122B30'; ctx.beginPath(); ctx.moveTo(x + w * 0.74, base - h * 0.42); ctx.lineTo(x + w * 0.8, base - h * 0.32); ctx.lineTo(x + w * 0.74, base - h * 0.2); ctx.lineTo(x + w * 0.68, base - h * 0.32); ctx.fill();
    FLAME(ctx, x + w * 0.74, base - h * 0.31, 0.32, t);
    if (big) { // tarp over the desk
      ctx.fillStyle = '#1E6468'; ctx.beginPath(); ctx.moveTo(150, 128); ctx.lineTo(388, 112); ctx.lineTo(392, 124); ctx.lineTo(154, 140); ctx.fill();
      ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(156, 138); ctx.lineTo(156, 232); ctx.moveTo(388, 122); ctx.lineTo(388, 232); ctx.stroke();
    }
  }
  function drawCabin(ctx, t) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(10, 222, 170, 8);
    ctx.fillStyle = '#4A3322'; ctx.fillRect(16, 128, 160, 98);
    for (let y = 132; y < 224; y += 9) { ctx.fillStyle = y % 18 ? '#5A3E28' : '#523823'; rr(ctx, 14, y, 164, 8, 4); ctx.fill(); }
    ctx.fillStyle = '#2B1D14'; ctx.beginPath(); ctx.moveTo(4, 132); ctx.lineTo(96, 84); ctx.lineTo(188, 132); ctx.fill();
    ctx.fillStyle = '#33241A'; ctx.beginPath(); ctx.moveTo(20, 132); ctx.lineTo(96, 92); ctx.lineTo(172, 132); ctx.fill();
    ctx.fillStyle = '#FFC873'; rr(ctx, 34, 150, 34, 28, 3); ctx.fill(); glow(ctx, 51, 164, 40, 'rgba(255,190,110,A)', 0.35);
    ctx.strokeStyle = '#2B1D14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(51, 150); ctx.lineTo(51, 178); ctx.moveTo(34, 164); ctx.lineTo(68, 164); ctx.stroke();
    ctx.fillStyle = '#2E2016'; rr(ctx, 104, 160, 30, 66, 3); ctx.fill();
    ctx.fillStyle = '#5E6B7A'; ctx.fillRect(140, 92, 12, 26);
  }
  function drawInterior(ctx, tier, t, li) {
    // wall
    const wallCol = tier === 4 ? '#3A2420' : tier === 5 ? '#141A2A' : '#22293A';
    ctx.fillStyle = wallCol; ctx.fillRect(0, 0, 400, 214);
    if (tier === 4) { ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 4; y < 214; y += 12) for (let x = (y / 12) % 2 ? 0 : 14; x < 400; x += 28) ctx.fillRect(x, y, 26, 10); }
    // window(s) with the city
    const wins = tier === 3 ? [[150, 26, 200, 130]] : tier === 4 ? [[120, 14, 110, 170], [240, 14, 110, 170]] : [[0, 0, 400, 205]];
    wins.forEach(([x, y, w, h]) => {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#071026'); g.addColorStop(1, li >= 6 ? '#3A2A5A' : '#1B2A48');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      STARS.slice(0, 30).forEach(([sx, sy, sr]) => { ctx.fillStyle = 'rgba(220,230,255,.6)'; ctx.fillRect(sx, sy * 0.6, sr, sr); });
      const base = y + h, sc = tier === 5 ? 1.2 : 1.6, r = rnd(5 + tier);
      CITY.forEach(([cx, cw, ch, k]) => {
        const hh = ch * sc * (tier === 5 ? 0.9 : 1);
        ctx.fillStyle = k > 0.5 ? '#0E1830' : '#121E38'; ctx.fillRect(cx, base - hh, cw, hh);
        for (let wy = base - hh + 4; wy < base - 2; wy += 6) for (let wx = cx + 2; wx < cx + cw - 2; wx += 4) if (r() > 0.55) { ctx.fillStyle = r() > 0.25 ? 'rgba(255,200,115,.85)' : 'rgba(127,214,255,.8)'; ctx.fillRect(wx, wy, 1.6, 2); }
      });
      ctx.restore();
      ctx.strokeStyle = tier === 5 ? 'rgba(200,220,255,.18)' : '#0B0F18'; ctx.lineWidth = tier === 5 ? 2 : 5; ctx.strokeRect(x, y, w, h);
      if (tier === 5) for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(k * 100, 0); ctx.lineTo(k * 100, 205); ctx.stroke(); }
    });
    // floor
    const fg = ctx.createLinearGradient(0, 205, 0, 280); fg.addColorStop(0, tier === 5 ? '#2A2A33' : '#3B2A1E'); fg.addColorStop(1, tier === 5 ? '#14141A' : '#22170F');
    ctx.fillStyle = fg; ctx.fillRect(0, 205, 400, 75);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < 400; x += 36) ctx.fillRect(x, 205, 1.2, 75);
    // sofa on the left
    ctx.fillStyle = tier === 5 ? '#D9D2C3' : '#2F5E63'; rr(ctx, 16, 196, 120, 36, 10); ctx.fill();
    ctx.fillStyle = tier === 5 ? '#C9C0AE' : '#24494D'; rr(ctx, 16, 182, 120, 22, 10); ctx.fill();
    ctx.fillStyle = '#E8641F'; rr(ctx, 26, 188, 22, 14, 5); ctx.fill();
  }
  function drawCampfire(ctx, x, y, t) {
    glow(ctx, x, y - 10, 110, 'rgba(255,140,60,A)', 0.32);
    ctx.fillStyle = '#2B2622'; for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 18, y + Math.sin(a) * 5, 5, 3.5, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#5A3A22'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x + 12, y - 6); ctx.moveTo(x + 14, y + 2); ctx.lineTo(x - 12, y - 6); ctx.stroke(); ctx.lineCap = 'butt';
    FLAME(ctx, x - 5, y - 12, 0.9, t, '#FF6A1F'); FLAME(ctx, x + 5, y - 10, 0.75, t + 300, '#FF8A2F'); FLAME(ctx, x, y - 16, 1.05, t + 600);
    for (let k = 0; k < 4; k++) { const ph = (t / 900 + k / 4) % 1; ctx.fillStyle = `rgba(255,190,90,${1 - ph})`; ctx.fillRect(x + Math.sin(k * 3 + t / 300) * 10, y - 26 - ph * 40, 1.6, 1.6); }
  }
  function drawSignal(ctx, l, t, indoor) {
    if (l === 0) { // hotspot arcs from the phone
      const ph = (t / 900) % 1;
      ctx.strokeStyle = `rgba(127,233,255,${0.8 - ph * 0.6})`; ctx.lineWidth = 1.6;
      for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(312, 200, 5 + k * 6 + ph * 4, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      return;
    }
    const x = 372;
    if (indoor && l < 5) { if (l >= 1) { ctx.fillStyle = '#20263A'; rr(ctx, 356, 208, 26, 12, 3); ctx.fill(); ctx.fillStyle = '#3CFFB1'; ctx.fillRect(362, 213, 2, 2); ctx.fillRect(368, 213, 2, 2); } return; }
    ctx.strokeStyle = '#3A4256'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 232); ctx.lineTo(x, l >= 2 ? 150 : 214); ctx.stroke();
    if (l === 1) { ctx.fillStyle = '#20263A'; rr(ctx, x - 12, 206, 24, 12, 3); ctx.fill(); ctx.fillStyle = '#3CFFB1'; ctx.fillRect(x - 6, 211, 2, 2); ctx.fillRect(x, 211, 2, 2); ctx.strokeStyle = '#20263A'; ctx.beginPath(); ctx.moveTo(x - 8, 206); ctx.lineTo(x - 10, 196); ctx.moveTo(x + 8, 206); ctx.lineTo(x + 10, 196); ctx.stroke(); }
    if (l === 2) { ctx.fillStyle = '#C9D1E0'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 8 + k * 0, 150 + k * 8, 16 - k * 3, 2); }
    if (l >= 3) {
      ctx.fillStyle = '#D9DEE8'; ctx.beginPath(); ctx.ellipse(x - 6, 148, 16, 10, -0.5, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8B93A6'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, 148); ctx.lineTo(x + 6, 138); ctx.stroke();
    }
    if (l >= 4) { ctx.strokeStyle = `hsla(${180 + Math.sin(t / 400) * 20},90%,60%,.8)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 232); ctx.quadraticCurveTo(350, 250, 330, 236); ctx.stroke(); }
    if (l >= 5) { ctx.fillStyle = '#151A28'; rr(ctx, x - 16, 180, 30, 52, 3); ctx.fill(); for (let k = 0; k < 6; k++) { ctx.fillStyle = (Math.floor(t / 200) + k) % 3 ? '#3CFFB1' : '#1C4A3A'; ctx.fillRect(x - 10, 186 + k * 7, 3, 3); ctx.fillStyle = '#2A3248'; ctx.fillRect(x - 4, 186 + k * 7, 14, 3); } }
    if (l >= 6) { ctx.fillStyle = 'rgba(42, 157, 160,.25)'; ctx.fillRect(x - 18, 178, 34, 56); }
  }
  function drawDesk(ctx, l) {
    const x0 = 150, x1 = l >= 4 ? 392 : 384, top = 220;
    if (l === 0) { // log bench
      ctx.fillStyle = '#4E3524'; rr(ctx, x0, top - 4, x1 - x0, 26, 13); ctx.fill();
      ctx.fillStyle = '#6A4A31'; ctx.beginPath(); ctx.ellipse(x1 - 6, top + 9, 8, 13, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8A6643'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x1 - 6, top + 9, 4, 7, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = '#3A2719'; ctx.fillRect(x0 + 20, top + 20, 10, 24); ctx.fillRect(x1 - 40, top + 20, 10, 24);
      return top - 4;
    }
    const cols = ['', '#9AA3B2', '#7A5A3A', '#6B4A2E', '#2E3446', 'rgba(170,220,255,.35)', '#2A1C16'];
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x0 + 4, top + 44, x1 - x0, 6);
    if (l === 1) { ctx.strokeStyle = '#6E7686'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0 + 14, top + 4); ctx.lineTo(x0 + 40, top + 46); ctx.moveTo(x0 + 40, top + 4); ctx.lineTo(x0 + 14, top + 46); ctx.moveTo(x1 - 14, top + 4); ctx.lineTo(x1 - 40, top + 46); ctx.moveTo(x1 - 40, top + 4); ctx.lineTo(x1 - 14, top + 46); ctx.stroke(); }
    else { ctx.fillStyle = l === 5 ? 'rgba(170,220,255,.22)' : cols[l]; ctx.fillRect(x0 + 2, top + 4, x1 - x0 - 4, 42); if (l !== 5) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x0 + 2, top + 4, x1 - x0 - 4, 6); } }
    ctx.fillStyle = l === 5 ? 'rgba(200,235,255,.6)' : l === 1 ? '#C9CFDA' : cols[l]; ctx.fillRect(x0 - 4, top - 2, x1 - x0 + 8, 7);
    if (l === 6) { ctx.fillStyle = '#E2B04A'; ctx.fillRect(x0 - 4, top + 4, x1 - x0 + 8, 2); }
    return top - 2;
  }
  function screen(ctx, x, y, w, h, t, k) {
    ctx.fillStyle = '#0D1018'; rr(ctx, x - 2, y - 2, w + 4, h + 4, 3); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0E2340'); g.addColorStop(1, '#0A1628'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const n = Math.max(5, Math.floor(w / 5)), r = rnd(100 + k);
    let p = h * 0.5;
    for (let i = 0; i < n; i++) { const o = p; p = Math.max(3, Math.min(h - 3, p + (r() - 0.5) * h * 0.4)); const up = p < o; ctx.fillStyle = up ? '#3CFFB1' : '#FF4D6D'; const cx = x + 2 + i * (w - 4) / n; ctx.fillRect(cx, y + Math.min(o, p), 2.4, Math.max(1.5, Math.abs(o - p))); }
    glow(ctx, x + w / 2, y + h / 2, w, 'rgba(90,170,255,A)', 0.12);
  }
  function drawScreens(ctx, l, top, t) {
    if (l === 0) { ctx.fillStyle = '#111520'; rr(ctx, 306, top - 18, 12, 18, 2); ctx.fill(); ctx.fillStyle = '#3B7BD9'; ctx.fillRect(307.5, top - 16, 9, 13); glow(ctx, 312, top - 9, 18, 'rgba(90,170,255,A)', 0.3); return; }
    const slots = { 1: [[280, 34, 22]], 2: [[262, 34, 22], [312, 46, 30]], 3: [[262, 50, 32], [318, 50, 32]], 4: [[250, 40, 28], [296, 40, 28], [342, 40, 28]], 5: [[262, 50, 26], [318, 50, 26], [262, 50, 26, -30], [318, 50, 26, -30]], 6: [[248, 40, 24], [294, 40, 24], [340, 40, 24], [248, 40, 24, -28], [294, 40, 24, -28], [340, 40, 24, -28]] }[l];
    slots.forEach(([x, w, h, dy], i) => {
      const y = top - h - 8 + (dy || 0);
      if (l === 1) { ctx.fillStyle = '#5C6475'; ctx.beginPath(); ctx.moveTo(x - 4, top); ctx.lineTo(x + w + 4, top); ctx.lineTo(x + w, top - 4); ctx.lineTo(x, top - 4); ctx.fill(); screen(ctx, x, top - 4 - h, w, h, t, i); return; }
      if (!dy) { ctx.fillStyle = '#2A2F3D'; ctx.fillRect(x + w / 2 - 2, top - 8, 4, 8); ctx.fillRect(x + w / 2 - 8, top - 2, 16, 2); }
      screen(ctx, x, y, w, h, t, i + l * 10);
    });
    if (l === 2) { ctx.fillStyle = '#5C6475'; ctx.fillRect(258, top - 2, 42, 2); }
  }
  function drawLighting(ctx, l, tier, top, t) {
    if (l >= 1 && tier <= 2) { // lantern hanging from a pole
      ctx.strokeStyle = '#2A1E14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, 232); ctx.lineTo(150, 150); ctx.lineTo(170, 150); ctx.stroke();
      ctx.fillStyle = '#2B2F3D'; ctx.fillRect(165, 152, 10, 4); ctx.fillStyle = '#FFD27A'; rr(ctx, 165, 156, 10, 14, 3); ctx.fill(); glow(ctx, 170, 163, 46, 'rgba(255,200,120,A)', 0.35);
    }
    if (l >= 2) { // string lights
      const pts = tier <= 2 ? [[20, 118], [200, 140], [384, 112]] : [[0, 18], [200, 34], [400, 18]];
      ctx.strokeStyle = 'rgba(20,20,20,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(pts[1][0], pts[1][1] + 16, pts[2][0], pts[2][1]); ctx.stroke();
      for (let k = 0; k <= 16; k++) { const u = k / 16, x = (1 - u) * (1 - u) * pts[0][0] + 2 * u * (1 - u) * pts[1][0] + u * u * pts[2][0], y = (1 - u) * (1 - u) * pts[0][1] + 2 * u * (1 - u) * (pts[1][1] + 16) + u * u * pts[2][1]; const on = Math.sin(t / 500 + k) > -0.6; ctx.fillStyle = on ? ['#FFC873', '#FF8A3D', '#7FE9FF'][k % 3] : '#4A4030'; ctx.beginPath(); ctx.arc(x, y + 3, 1.8, 0, 7); ctx.fill(); if (on) glow(ctx, x, y + 3, 7, 'rgba(255,200,120,A)', 0.3); }
    }
    if (l >= 3) { ctx.strokeStyle = '#1F2330'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(240, top); ctx.lineTo(234, top - 26); ctx.lineTo(246, top - 34); ctx.stroke(); ctx.fillStyle = '#E8641F'; ctx.beginPath(); ctx.moveTo(242, top - 38); ctx.lineTo(254, top - 30); ctx.lineTo(244, top - 26); ctx.fill(); glow(ctx, 250, top - 22, 34, 'rgba(255,190,110,A)', 0.4); }
    if (l >= 4) { ctx.fillStyle = 'rgba(60,220,230,.35)'; ctx.fillRect(152, top + 6, 236, 3); glow(ctx, 270, top + 14, 60, 'rgba(60,220,230,A)', 0.18); }
    if (l >= 5) { // neon flame sign
      const x = tier <= 2 ? 200 : 106, y = tier <= 2 ? 160 : 44, on = Math.sin(t / 260) > -0.93;
      ctx.save(); ctx.shadowColor = '#FF7A2F'; ctx.shadowBlur = on ? 16 : 0; ctx.strokeStyle = on ? '#FF9A4D' : '#6A3A22'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.bezierCurveTo(x + 10, y - 6, x + 12, y + 2, x + 6, y + 10); ctx.bezierCurveTo(x + 3, y + 14, x - 3, y + 14, x - 6, y + 10); ctx.bezierCurveTo(x - 12, y + 2, x - 9, y - 7, x, y - 16); ctx.stroke(); ctx.restore();
    }
  }
  function drawDecor(ctx, l, tier, t) {
    if (l >= 1) { // crew flag
      const x = tier <= 2 ? 196 : 360, y = tier <= 2 ? 232 : 200;
      ctx.strokeStyle = '#8A93A6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 74); ctx.stroke();
      const wv = Math.sin(t / 300) * 3;
      ctx.fillStyle = '#1F6A6E'; ctx.beginPath(); ctx.moveTo(x, y - 74); ctx.quadraticCurveTo(x + 18, y - 70 + wv, x + 34, y - 72); ctx.lineTo(x + 34, y - 50); ctx.quadraticCurveTo(x + 18, y - 48 + wv, x, y - 52); ctx.fill();
      FLAME(ctx, x + 17, y - 61, 0.42, t);
    }
    if (tier >= 3) {
      if (l >= 2) { ctx.fillStyle = '#E8D9B5'; rr(ctx, 26, 60, 44, 32, 2); ctx.fill(); ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(32, 80); ctx.lineTo(44, 70); ctx.lineTo(54, 76); ctx.lineTo(64, 66); ctx.stroke(); }
      if (l >= 3) { ctx.fillStyle = '#0E1424'; rr(ctx, 26, 104, 44, 30, 2); ctx.fill(); ctx.strokeStyle = '#3CFFB1'; ctx.beginPath(); ctx.moveTo(30, 128); ctx.lineTo(42, 118); ctx.lineTo(52, 122); ctx.lineTo(66, 108); ctx.stroke(); }
      if (l >= 4) { ctx.fillStyle = '#5A4030'; ctx.fillRect(100, 150, 50, 4); ctx.fillStyle = '#FFC94A'; for (let k = 0; k < 3; k++) { ctx.fillRect(106 + k * 15, 140, 6, 10); ctx.beginPath(); ctx.arc(109 + k * 15, 138, 5, 0, 7); ctx.fill(); } }
    } else {
      if (l >= 2) { ctx.strokeStyle = '#3A2719'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(216, 232); ctx.lineTo(224, 190); ctx.lineTo(232, 232); ctx.stroke(); ctx.fillStyle = '#E8D9B5'; rr(ctx, 210, 182, 30, 22, 2); ctx.fill(); ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(214, 198); ctx.lineTo(222, 190); ctx.lineTo(228, 194); ctx.lineTo(236, 186); ctx.stroke(); }
    }
    if (l >= 5) { // golden bull and bear statues by the desk
      const x = tier <= 2 ? 232 : 112, y = tier <= 2 ? 276 : 270;
      ctx.fillStyle = '#E2B04A'; rr(ctx, x - 22, y - 14, 18, 10, 4); ctx.fill(); ctx.beginPath(); ctx.arc(x - 24, y - 15, 4, 0, 7); ctx.fill();
      rr(ctx, x + 2, y - 15, 20, 11, 5); ctx.fill(); ctx.beginPath(); ctx.arc(x + 22, y - 16, 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#B8862A'; ctx.fillRect(x - 26, y - 4, 52, 4);
    }
    if (l >= 6) { ctx.fillStyle = 'rgba(255,201,74,.18)'; ctx.fillRect(0, 0, 400, 4); }
  }
  function drawPower(ctx, l, tier, t) {
    const x = tier <= 2 ? 150 : 150, y = 262;
    if (l === 1) { ctx.fillStyle = '#20263A'; rr(ctx, 168, 252, 16, 9, 2); ctx.fill(); ctx.fillStyle = '#3CFFB1'; ctx.fillRect(171, 255, 6, 3); }
    if (l === 2 && tier <= 2) { ctx.fillStyle = '#1C2A44'; ctx.beginPath(); ctx.moveTo(110, 262); ctx.lineTo(146, 246); ctx.lineTo(162, 262); ctx.lineTo(126, 276); ctx.fill(); ctx.strokeStyle = 'rgba(127,214,255,.5)'; ctx.lineWidth = 0.8; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(110 + k * 9, 262 - k * 4); ctx.lineTo(126 + k * 9, 276 - k * 4); ctx.stroke(); } }
    if (l === 3) { ctx.fillStyle = '#B83A2A'; rr(ctx, 112, 246, 34, 22, 3); ctx.fill(); ctx.fillStyle = '#1A1C24'; ctx.fillRect(116, 250, 12, 6); if (Math.floor(t / 300) % 2) { ctx.fillStyle = 'rgba(200,200,200,.25)'; ctx.beginPath(); ctx.arc(146, 240, 4, 0, 7); ctx.fill(); } }
    if (l >= 5) { ctx.fillStyle = '#1A2032'; rr(ctx, 106, 236, 40, 34, 3); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.fillStyle = '#3CFFB1'; ctx.fillRect(110 + k * 9, 262 - (k + 1) * 5, 6, (k + 1) * 5); } }
    if (l >= 6) glow(ctx, 126, 250, 30, 'rgba(42, 157, 160,A)', 0.4);
  }
  function drawSeat(ctx, l, tier) {
    const x = tier <= 2 ? 104 : 150, y = 262;
    if (tier <= 2 && l === 0) { ctx.fillStyle = '#4E3524'; ctx.fillRect(x - 12, y - 18, 24, 18); ctx.fillStyle = '#6A4A31'; ctx.beginPath(); ctx.ellipse(x, y - 18, 12, 4, 0, 0, 7); ctx.fill(); return; }
    const col = ['#4E3524', '#1F6A6E', '#6E7686', '#2B2F3D', '#C94A3A', '#D9D2C3', '#E2B04A'][l];
    ctx.fillStyle = col; rr(ctx, x - 14, y - 22, 28, 8, 3); ctx.fill(); rr(ctx, x - 14, y - 44, 6, 24, 3); ctx.fill();
    ctx.strokeStyle = '#2A2F3D'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, y - 14); ctx.lineTo(x - 12, y); ctx.moveTo(x + 10, y - 14); ctx.lineTo(x + 12, y); ctx.stroke();
  }
  function drawCompanion(ctx, l, tier, t) {
    if (l === 1) { ctx.fillStyle = 'rgba(200,230,255,.25)'; rr(ctx, 186, 244, 12, 16, 3); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(220,255,140,.9)'; ctx.beginPath(); ctx.arc(190 + Math.sin(t / 300 + k) * 3, 250 + Math.cos(t / 400 + k * 2) * 4, 1.2, 0, 7); ctx.fill(); } }
    if (l === 2) { const x = tier <= 2 ? 52 : 372, y = tier <= 2 ? 150 : 150; ctx.fillStyle = '#6A5644'; ctx.beginPath(); ctx.ellipse(x, y, 8, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 2.2, 0, 7); ctx.arc(x + 3, y - 4, 2.2, 0, 7); ctx.fill(); }
    if (l === 3) { const x = 130, y = 268; ctx.fillStyle = '#6E6A72'; ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 12, y - 14, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#1A1A1E'; ctx.fillRect(x + 9, y - 16, 8, 3); ctx.strokeStyle = '#6E6A72'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 10, y - 8); ctx.lineTo(x - 22, y - 16); ctx.stroke(); }
    if (l === 4) { const x = 136, y = 270; ctx.fillStyle = '#C9CED8'; ctx.beginPath(); ctx.ellipse(x, y - 7, 14, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4A5060'; ctx.beginPath(); ctx.arc(x + 14, y - 12, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#C9CED8'; ctx.beginPath(); ctx.moveTo(x + 10, y - 18); ctx.lineTo(x + 12, y - 24); ctx.lineTo(x + 15, y - 18); ctx.moveTo(x + 15, y - 18); ctx.lineTo(x + 18, y - 24); ctx.lineTo(x + 20, y - 17); ctx.fill(); }
    if (l === 5) { const x = 372, y = 108 + Math.sin(t / 500) * 2; ctx.fillStyle = '#7A5A3A'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 16, y - 6); ctx.lineTo(x - 4, y + 2); ctx.lineTo(x + 16, y - 6); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, y + 4, 4, 7, 0, 0, 7); ctx.fill(); }
    if (l === 6) { const x = 330 + Math.sin(t / 900) * 30, y = 70 + Math.sin(t / 400) * 6; glow(ctx, x, y, 30, 'rgba(255,120,40,A)', 0.4); const wv = Math.sin(t / 150) * 8; ctx.fillStyle = '#FF7A2F'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y - 10 - wv); ctx.lineTo(x - 6, y + 2); ctx.lineTo(x + 6, y + 2); ctx.lineTo(x + 22, y - 10 - wv); ctx.fill(); ctx.fillStyle = '#FFD27A'; ctx.beginPath(); ctx.ellipse(x, y + 4, 5, 8, 0, 0, 7); ctx.fill(); }
  }
  function drawCharacter(ctx, t) {
    const C = window.CQCrew;
    if (!C || !C.picked()) return;
    const L = C.look(), ch = C.char(), im = C.cutImage(L.id, L.color);
    if (!im.complete || !im.naturalWidth) return;
    const h = 156, w = h * ch.size[0] / ch.size[1], x = 214 - w / 2, y = 104 + Math.sin(t / 900) * 1.2;
    ctx.drawImage(im, x, y, w, h);
  }
  function drawPip(ctx, t, tier) {
    const x = tier >= 3 ? 372 : 346, y = (tier >= 3 ? 34 : 40) + Math.sin(t / 700) * 4;
    glow(ctx, x, y, 34, 'rgba(255,120,40,A)', 0.45);
    ctx.fillStyle = '#122030'; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 13, y); ctx.lineTo(x, y + 18); ctx.lineTo(x - 13, y); ctx.fill();
    FLAME(ctx, x, y + 1, 0.62, t);
  }

  function drawRoom(ctx, W, H, t, r) {
    r = r || room();
    const s = W / 400;
    ctx.save(); ctx.scale(s, s);
    const tier = r.tier, L = (id) => r.items[id] || 0;
    const outdoors = tier <= 2;
    if (outdoors) {
      drawSky(ctx, tier, t, L('light'));
      drawCityFar(ctx, 168 - tier * 4, 1 + tier * 0.35, 0.7 + tier * 0.15);
      drawMountains(ctx);
      drawTrees(ctx, tier);
      drawGround(ctx, tier);
      if (tier === 2) drawCabin(ctx, t); else drawTent(ctx, tier === 1, t);
      drawCampfire(ctx, tier === 2 ? 230 : 196, 262, t);
    } else drawInterior(ctx, tier, t, L('light'));
    drawPip(ctx, t, tier);
    drawDecor(ctx, L('decor'), tier, t);
    drawPower(ctx, L('plant'), tier, t);
    drawSeat(ctx, L('chair'), tier);
    drawSignal(ctx, L('computer'), t, !outdoors);
    drawCharacter(ctx, t);
    const top = drawDesk(ctx, L('desk'));
    drawScreens(ctx, L('monitors'), top, t);
    drawLighting(ctx, L('light'), tier, top, t);
    drawCompanion(ctx, L('pet'), tier, t);
    const vig = ctx.createRadialGradient(200, 150, 120, 200, 150, 300);
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(2,5,14,.55)');
    ctx.fillStyle = vig; ctx.fillRect(0, 0, 400, 280);
    ctx.restore();
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
        <div class="room-caption"><div><h2>${U.esc(window.CQCrew ? window.CQCrew.displayName() : (S.name || 'Your'))}'s ${tier.name.toLowerCase()}</h2><p class="tiny">Camp value ${r.spent.toLocaleString()} · upgrades up to level ${maxL}</p></div>
          <button class="chip style-btn">${ic('user')}Look</button></div>
      </section>
      <section class="bot-card ${rate ? '' : 'off'}">
        <span class="bot-ic">${ic('bolt')}</span>
        <div><b>${rate ? `Trading bot: ${rate} coins/hour` : 'No trading bot yet'}</b><small>${rate ? (capped ? 'Storage full! Collect to keep earning.' : `Stores up to ${CAP_HOURS} hours of earnings`) : 'Upgrade your signal and a bot trades for you while you\'re away.'}</small></div>
        ${rate ? `<button class="btn small buy collect" ${pend ? '' : 'disabled'}>${coin()}${pend}</button>` : ''}
      </section>
      ${next ? `<section class="move-card">
        <div><b>Move to the ${next.name.toLowerCase()}</b><small>${next.blurb} Unlocks upgrades up to level ${Math.min(6, r.tier + 3)}.</small></div>
        <button class="btn small ${S.coins >= next.cost ? 'btn-flame' : 'btn-ghost'} move">${coin()}${next.cost.toLocaleString()}</button>
      </section>` : '<section class="move-card done"><div><b>You made it to the skyline.</b><small>From a tent in the woods to the top of the city.</small></div></section>'}
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
          : locked ? `<span class="up-lock">${ic('lock')}Move up first</span>`
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
    U.app.append(U.hud(null, 'My camp'), root, U.nav('room'));
    mountRoom(root.querySelector('.room-stage'));
    const c = root.querySelector('.collect');
    if (c) c.addEventListener('click', () => { const a = collect(); if (a) { U.toast(`Your bot made ${a} coins!`, '🤖'); U.go(roomScreen); } });
    root.querySelector('.style-btn').addEventListener('click', () => { Store.sfx.tap(); U.go(window.CQCrew.editor, { back: () => U.go(roomScreen) }); });
    const mv = root.querySelector('.move');
    if (mv) mv.addEventListener('click', () => {
      if (S.coins < next.cost) { Store.sfx.bad(); U.toast(`Save ${(next.cost - S.coins).toLocaleString()} more coins to move.`, '🏠'); return; }
      S.coins -= next.cost; r.spent += next.cost; r.tier++;
      Store.save(); Store.sfx.win(); U.confetti(90);
      if (r.tier >= 4) Store.badge('tycoon');
      U.toast(`Welcome to your ${TIERS[r.tier].name.toLowerCase()}!`, r.tier >= 3 ? '🏙️' : '🏕️');
      U.go(roomScreen);
    });
  }

  window.CQRoom = { roomScreen, mountRoom, pending, collect, tpBonus, room, TIERS, RATES };
})();
