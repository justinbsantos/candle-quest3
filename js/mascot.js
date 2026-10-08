/* Wickd — Pip the AI coach (a glowing orb) and player avatars with flair rings. */
(function (G) {
  'use strict';

  // Flairs are the avatar ring styles players unlock in the shop.
  const FLAIR_COLORS = {
    none: ['#2A9DA0', '#F26A2E'],
    mint: ['#3CFFB1', '#3DB8FF'],
    sunset: ['#FFB23E', '#FF4F7B'],
    ice: ['#B9F3FF', '#6C8CFF'],
    gold: ['#FFE08A', '#E9A21C'],
    holo: ['#3CFFB1', '#F26A2E'],
  };
  const flair = (id) => FLAIR_COLORS[id] || FLAIR_COLORS.none;

  let uid = 0;
  // Pip: a glossy orb with a flame inside. Mood shifts its colors.
  function coachSVG(mood, cls) {
    const id = 'pip' + (++uid);
    const c = mood === 'wow' ? ['#3CFFB1', '#3DB8FF'] : mood === 'sad' ? ['#6C6A8F', '#3B3760'] : ['#2A9DA0', '#F26A2E'];
    return `<svg class="${cls || 'owl'}" viewBox="0 0 64 64" aria-label="Pip, your coach">
      <defs><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></radialGradient></defs>
      <circle cx="32" cy="32" r="28" fill="url(#${id})"/>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>
      <path d="M32 15c6.2 5.6 8.2 10.6 5.7 15.1-1.3 2.4-3.3 3.5-5.7 3.5s-4.4-1.1-5.7-3.5C23.8 25.6 25.8 20.6 32 15z" fill="#fff" fill-opacity=".92"/>
      <rect x="27" y="36" width="10" height="13" rx="3" fill="#fff" fill-opacity=".92"/>
    </svg>`;
  }

  // Back-compat: older screens call owlSVG(hat, mood, cls) for the coach.
  function owlSVG(hat, mood, cls) { return coachSVG(mood, cls); }

  function avatarSVG(name, flairId, cls) {
    if (G.CQCrew && G.CQStore && G.CQCrew.picked()) return G.CQCrew.avatar(flairId, cls);
    if (G.CQAvatar && G.CQStore) return G.CQAvatar.avatar(flairId, cls);
    const id = 'av' + (++uid);
    const [a, b] = flair(flairId);
    const letter = String(name || '?').trim().charAt(0).toUpperCase() || '?';
    return `<svg class="${cls || 'avatar'}" viewBox="0 0 64 64" aria-label="${letter} avatar">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <circle cx="32" cy="32" r="30" fill="url(#${id})"/>
      <circle cx="32" cy="32" r="25" fill="#16122E"/>
      <text x="32" y="33" text-anchor="middle" dominant-baseline="middle" font-family="Unbounded, sans-serif" font-weight="700" font-size="24" fill="url(#${id})">${letter}</text>
    </svg>`;
  }

  G.CQMascot = { owlSVG, coachSVG, avatarSVG, flair };
})(window);
