/* Painted crew is the body. Gear sits on top. Faces do not change a fill. */
(function (G) {
  'use strict';
  const SCOUTS = {
    bull: { name: 'Bram', species: 'Bull', habit: 'Rising trail' },
    bear: { name: 'Nera', species: 'Bear', habit: 'Falling trail' },
    fox: { name: 'Vesper', species: 'Fox', habit: 'Early turn' },
    wolf: { name: 'Calder', species: 'Wolf', habit: 'Loud weather' }
  };
  const GEAR = ['Cap', 'Chart roll', 'Headphones', 'Tablet'];

  function idOf(look) {
    const id = look && look.species;
    return SCOUTS[id] ? id : 'fox';
  }
  function face(id) {
    return (G.CQCrewFaces && G.CQCrewFaces[id]) || '';
  }
  function svg(look, opt) {
    opt = opt || {};
    const id = idOf(look);
    const s = SCOUTS[id];
    const src = face(id);
    const gear = (look && look.gear) || ['Cap'];
    const chips = gear.map((g) => `<tspan>${g}</tspan>`).join(' · ');
    return `<svg class="${opt.cls || 'trader crew'}" viewBox="0 0 240 320" aria-label="${s.name} the ${s.species}">
      <image href="${src}" x="20" y="8" width="200" height="250" preserveAspectRatio="xMidYMid slice"/>
      <text x="120" y="286" text-anchor="middle" fill="#F4F1EA" font-size="16" font-family="sans-serif">${s.name}</text>
      <text x="120" y="306" text-anchor="middle" fill="#9AA3B2" font-size="12" font-family="sans-serif">${chips}</text>
    </svg>`;
  }
  function avatar(flairId, cls) {
    const look = G.CQAvatar && G.CQAvatar.look ? G.CQAvatar.look() : { species: 'fox' };
    const id = idOf(look);
    const src = face(id);
    return `<span class="${cls || 'avatar'} av-round crew-av" title="${SCOUTS[id].name}"><img alt="${SCOUTS[id].name}" src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></span>`;
  }
  function install() {
    if (!G.CQAvatar) return;
    const base = G.CQAvatar;
    const oldLook = base.look;
    const oldCreator = base.creator;
    base.look = function () {
      const L = oldLook();
      if (!L.species) L.species = 'fox';
      if (!L.lane) L.lane = 'field';
      if (!L.gear) L.gear = ['Cap'];
      return L;
    };
    base.svg = function (L, opt) { return svg(L || base.look(), opt); };
    base.avatar = avatar;
    base.crew = SCOUTS;
    base.creator = function (arg) {
      oldCreator(arg);
      const look = base.look();
      const panel = document.querySelector('.cr-panel');
      if (!panel || panel.querySelector('.crew-pick')) return;
      const row = document.createElement('div');
      row.className = 'crew-pick';
      row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0';
      Object.keys(SCOUTS).forEach((id) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = SCOUTS[id].species;
        b.className = 'chip' + (idOf(look) === id ? ' on' : '');
        b.onclick = () => {
          look.species = id;
          G.CQStore.save();
          const fig = document.querySelector('.cr-fig');
          if (fig) fig.innerHTML = svg(look, { cls: 'trader big' });
          row.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        };
        row.appendChild(b);
      });
      const tools = document.createElement('div');
      tools.className = 'crew-pick';
      tools.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0';
      GEAR.forEach((name) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = name;
        b.className = 'chip' + (look.gear.includes(name) ? ' on' : '');
        b.onclick = () => {
          const i = look.gear.indexOf(name);
          if (i >= 0) look.gear.splice(i, 1); else look.gear.push(name);
          G.CQStore.save();
          b.classList.toggle('on');
          const fig = document.querySelector('.cr-fig');
          if (fig) fig.innerHTML = svg(look, { cls: 'trader big' });
        };
        tools.appendChild(b);
      });
      panel.prepend(tools);
      panel.prepend(row);
    };
  }
  G.CQCrew = { SCOUTS, svg, avatar, install };
  install();
})(window);
