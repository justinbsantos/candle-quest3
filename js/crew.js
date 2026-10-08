/* Wickd crew. Bull, bear, fox, wolf. Teal jackets, flame patch, chart roll.
   Species is free. Field or Studio is a cut, not a gender. Clothes do not change a fill. */
(function (G) {
  'use strict';
  const SCOUTS = {
    bull: { name: 'Bram', species: 'Bull', habit: 'Rising trail', coat: '#3a3d44' },
    bear: { name: 'Nera', species: 'Bear', habit: 'Falling trail', coat: '#8a6244' },
    fox: { name: 'Vesper', species: 'Fox', habit: 'Early turn', coat: '#d9772a' },
    wolf: { name: 'Calder', species: 'Wolf', habit: 'Loud weather', coat: '#8e97a3' }
  };
  const JACKET = '#0E7C86';
  const FLAME = '#ff7a3c';

  function idOf(look) {
    const id = look && look.species;
    return SCOUTS[id] ? id : 'fox';
  }
  function scout(look) { return SCOUTS[idOf(look)]; }

  function head(id, coat) {
    if (id === 'bull') return `<ellipse cx="120" cy="78" rx="46" ry="40" fill="${coat}"/><path d="M78 52 Q70 28 88 40" fill="#f4efe4"/><path d="M162 52 Q170 28 152 40" fill="#f4efe4"/><ellipse cx="120" cy="92" rx="18" ry="12" fill="#e7c2a4"/>`;
    if (id === 'bear') return `<circle cx="86" cy="48" r="16" fill="${coat}"/><circle cx="154" cy="48" r="16" fill="${coat}"/><ellipse cx="120" cy="78" rx="44" ry="40" fill="${coat}"/><ellipse cx="120" cy="92" rx="16" ry="12" fill="#c4a574"/>`;
    if (id === 'wolf') return `<path d="M78 70 L70 36 L98 58 Z" fill="${coat}"/><path d="M162 70 L170 36 L142 58 Z" fill="${coat}"/><ellipse cx="120" cy="82" rx="40" ry="36" fill="${coat}"/><ellipse cx="120" cy="96" rx="14" ry="10" fill="#d9dde3"/>`;
    return `<path d="M76 70 L62 28 L100 58 Z" fill="${coat}"/><path d="M164 70 L178 28 L140 58 Z" fill="${coat}"/><ellipse cx="120" cy="82" rx="38" ry="34" fill="${coat}"/><ellipse cx="120" cy="98" rx="12" ry="8" fill="#f4efe4"/>`;
  }

  function svg(look, opt) {
    opt = opt || {};
    const id = idOf(look);
    const s = scout(look);
    const lane = (look && look.lane) || 'field';
    const box = opt.crop === 'head' ? '70 20 100 110' : '40 10 160 250';
    const roll = id === 'fox' ? `<rect x="150" y="150" width="16" height="42" rx="6" fill="#e7d7b8" transform="rotate(18 158 170)"/>` : '';
    const crop = lane === 'studio' ? `<path d="M78 128 H162 L156 168 H84 Z" fill="${JACKET}"/>` : `<path d="M70 124 H170 L164 196 H76 Z" fill="${JACKET}"/>`;
    return `<svg class="${opt.cls || 'trader crew'}" viewBox="${box}" aria-label="${s.name} the ${s.species}">
      <ellipse cx="120" cy="236" rx="46" ry="8" fill="rgba(0,0,0,.35)"/>
      <rect x="96" y="188" width="16" height="40" rx="6" fill="#1c2430"/>
      <rect x="128" y="188" width="16" height="40" rx="6" fill="#1c2430"/>
      ${crop}
      <path d="M92 150 h10 v14 h-10z" fill="${FLAME}"/>
      ${roll}
      ${head(id, s.coat)}
      <circle cx="104" cy="80" r="4" fill="#12161c"/><circle cx="136" cy="80" r="4" fill="#12161c"/>
      <path d="M78 58 h28 v10 h-20z" fill="${JACKET}"/><path d="M134 58 h28 v10 h-20z" fill="${JACKET}"/>
    </svg>`;
  }

  function avatar(flairId, cls) {
    const look = G.CQAvatar && G.CQAvatar.look ? G.CQAvatar.look() : { species: 'fox' };
    const s = scout(look);
    return `<span class="${cls || 'avatar'} av-round crew-av" title="${s.name}"><span class="crew-face">${svg(look, { crop: 'head', cls: 'av-face' })}</span></span>`;
  }

  function picker(onPick) {
    const look = G.CQAvatar.look();
    const row = document.createElement('div');
    row.className = 'crew-pick';
    Object.keys(SCOUTS).forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'crew-chip' + (idOf(look) === id ? ' on' : '');
      b.textContent = SCOUTS[id].species;
      b.onclick = () => {
        look.species = id;
        G.CQStore.save();
        if (onPick) onPick(id);
      };
      row.appendChild(b);
    });
    return row;
  }

  function install() {
    if (!G.CQAvatar) return;
    if (!document.getElementById('crew-css')) {
      const st = document.createElement('style');
      st.id = 'crew-css';
      st.textContent = '.crew-pick{display:flex;gap:8px;margin:8px 0}.crew-chip{border:1px solid #2A3344;background:#1A2130;color:#F4F1EA;border-radius:999px;padding:6px 10px}.crew-chip.on{border-color:#0E7C86}';
      document.head.appendChild(st);
    }
    const base = G.CQAvatar;
    const oldLook = base.look;
    base.look = function () {
      const L = oldLook();
      if (!L.species) L.species = 'fox';
      if (!L.lane) L.lane = 'field';
      return L;
    };
    base.svg = function (L, opt) { return svg(L || base.look(), opt); };
    base.avatar = avatar;
    base.crew = SCOUTS;
    base.picker = picker;
  }

  G.CQCrew = { SCOUTS, svg, avatar, picker, scout, install };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window);
