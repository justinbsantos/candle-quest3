/* Candle Quest — brand marks and UI icon set (inline SVG, currentColor). */
(function (G) {
  'use strict';
  const P = {
    home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
    trade: '<path d="M4 18 9.5 12l3.5 3.5L20 8"/><path d="M15 8h5v5"/>',
    school: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.8V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.2"/><path d="M21.5 9.5V15"/>',
    shop: '<path d="M5 8h14l-1.2 11.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v3M8.5 20h7M9.5 20l.5-4h4l.5 4"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
    fast: '<path d="M4 6.5v11l7-5.5zM12 6.5v11l7-5.5z" fill="currentColor"/>',
    lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z"/><path d="M9 12h6"/>',
    bolt: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z" fill="currentColor" stroke="none"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-2.5 0-4.5-1-4.5-2.7S9.6 3.8 12 9zm0 0c2.5 0 4.5-1 4.5-2.7S14.4 3.8 12 9z"/>',
    flame: '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.5 3-5.2 3.6-9.4 2.3 1.4 3.6 3.6 3.4 6 1-.6 1.6-1.6 1.9-2.8 1.8 1.5 3.1 3.7 3.1 6.2 0 3.2-2.4 5.6-6 5.6z"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M4 4l16 16"/><path d="M10 6c.6-.1 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.3M6.6 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1.1"/>',
    book: '<path d="M4.5 5.5c2.5-.8 5-.6 7.5 1 2.5-1.6 5-1.8 7.5-1v13c-2.5-.8-5-.6-7.5 1-2.5-1.6-5-1.8-7.5-1z"/><path d="M12 6.5v13"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.5H15"/>',
    map: '<path d="M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
    heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" fill="currentColor" stroke="none"/>',
    up: '<path d="M12 5 5 13h4.5v6h5v-6H19z" fill="currentColor" stroke="none"/>',
    down: '<path d="M12 19 5 11h4.5V5h5v6H19z" fill="currentColor" stroke="none"/>',
    hand: '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V11m0-4a1.5 1.5 0 0 1 3 0v6.5A6.5 6.5 0 0 1 10.5 20 5.5 5.5 0 0 1 5.6 17L3.8 13.6a1.5 1.5 0 0 1 2.5-1.6L8 14"/>',
    owl: '<path d="M6 8 5 4l3.5 2.5h7L19 4l-1 4c1 1.3 1.5 2.9 1.5 4.6 0 4.4-3.4 7.4-7.5 7.4s-7.5-3-7.5-7.4C4.5 10.9 5 9.3 6 8z"/><circle cx="9.3" cy="11.5" r="1.6"/><circle cx="14.7" cy="11.5" r="1.6"/><path d="M11 14.5h2l-1 1.3z"/>',
  };

  function ic(name, cls) {
    return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  }

  // The coin: a gold disc stamped with a tiny candle.
  function coin(cls) {
    return `<svg class="coin ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#E9A21C"/><circle cx="12" cy="11.2" r="9.6" fill="#FFC94A"/>
      <circle cx="12" cy="11.2" r="7.2" fill="none" stroke="#E9A21C" stroke-width="1.2"/>
      <path d="M12 5.2c2.9 2.6 3.7 4.9 2.6 7-.6 1.1-1.5 1.6-2.6 1.6s-2-.5-2.6-1.6c-1.1-2.1-.3-4.4 2.6-7z" fill="#D9850B"/><path d="M12 9.4c.9.9 1.2 1.6.8 2.3-.2.3-.5.5-.8.5s-.6-.2-.8-.5c-.4-.7-.1-1.4.8-2.3z" fill="#FFE7A3"/><rect x="9.8" y="14.4" width="4.4" height="1.6" rx=".8" fill="#D9850B"/>
    </svg>`;
  }

  // The logo mark: a candlestick whose wick turns into a flame.
  function mark(cls) {
    return `<svg class="mark ${cls || ''}" viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="cqFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF4F8B"/><stop offset="1" stop-color="#FFB23E"/></linearGradient></defs>
      <rect x="15" y="20" width="18" height="22" rx="5" fill="#2EE6A6"/>
      <rect x="15" y="20" width="6" height="22" rx="3" fill="#7BF5C9" opacity=".55"/>
      <path d="M24 42v5" stroke="#2EE6A6" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 3c5 4.6 6.6 8.6 4.6 12.2-1 1.9-2.6 2.8-4.6 2.8s-3.6-.9-4.6-2.8C17.4 11.6 19 7.6 24 3z" fill="url(#cqFlame)"/>
      <path d="M24 10.5c1.8 1.7 2.3 3.1 1.6 4.4-.3.6-.9.9-1.6.9s-1.3-.3-1.6-.9c-.7-1.3-.2-2.7 1.6-4.4z" fill="#FFF3D6"/>
    </svg>`;
  }

  function wordmark() {
    return `<span class="wordmark">${mark()}<span class="wm-text"><span>Candle</span><span>Quest</span></span></span>`;
  }

  G.CQIcons = { ic, coin, mark, wordmark };
})(window);
