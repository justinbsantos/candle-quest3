/* Candle Quest — Pip the Chart Owl (original SVG mascot) + hats. */
(function (G) {
  'use strict';

  const HAT_SVG = {
    none: '',
    cap: '<path d="M30 30 Q60 6 90 30 Z" fill="#2563eb"/><rect x="28" y="28" width="64" height="7" rx="3" fill="#1d4ed8"/><path d="M86 31 L110 36 L88 38 Z" fill="#1d4ed8"/><circle cx="60" cy="16" r="3" fill="#fbbf24"/>',
    pirate: '<path d="M22 32 Q60 -4 98 32 Q60 22 22 32 Z" fill="#1f2937"/><circle cx="60" cy="20" r="6" fill="#f8fafc"/><path d="M55 27 L65 27" stroke="#f8fafc" stroke-width="2"/>',
    wizard: '<path d="M34 34 L60 -14 L86 34 Z" fill="#7C4DFF"/><ellipse cx="60" cy="34" rx="32" ry="6" fill="#5B2FD6"/><path d="m58 6 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#FFC94A"/>',
    astro: '<circle cx="60" cy="52" r="46" fill="#bfdbfe" fill-opacity="0.35" stroke="#e2e8f0" stroke-width="5"/><rect x="50" y="2" width="20" height="8" rx="4" fill="#94a3b8"/>',
    crown: '<path d="M34 34 L38 10 L50 24 L60 6 L70 24 L82 10 L86 34 Z" fill="#fbbf24" stroke="#d97706" stroke-width="2"/><circle cx="60" cy="24" r="3" fill="#ef4444"/><circle cx="45" cy="28" r="2.5" fill="#3b82f6"/><circle cx="75" cy="28" r="2.5" fill="#22c55e"/>',
  };

  function owlSVG(hat, mood, cls) {
    mood = mood || 'happy';
    const pupils = mood === 'sad'
      ? '<circle cx="46" cy="58" r="5" fill="#1A1033"/><circle cx="74" cy="58" r="5" fill="#1A1033"/><path d="M36 46 L54 50 M84 46 L66 50" stroke="#8A3A10" stroke-width="3" stroke-linecap="round"/>'
      : mood === 'wow'
        ? '<circle cx="46" cy="54" r="7" fill="#1A1033"/><circle cx="74" cy="54" r="7" fill="#1A1033"/><circle cx="48" cy="51" r="2.5" fill="#fff"/><circle cx="76" cy="51" r="2.5" fill="#fff"/>'
        : '<circle cx="47" cy="55" r="6" fill="#1A1033"/><circle cx="73" cy="55" r="6" fill="#1A1033"/><circle cx="49" cy="53" r="2" fill="#fff"/><circle cx="75" cy="53" r="2" fill="#fff"/>';
    const mouth = mood === 'sad' ? '' : '<path d="M52 72 Q60 80 68 72" stroke="#B23A62" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return `<svg class="${cls || 'owl'}" viewBox="0 -16 120 150" xmlns="http://www.w3.org/2000/svg" aria-label="Pip the owl">
      <path d="M30 34 L26 14 L44 28 Z" fill="#E9772B"/><path d="M90 34 L94 14 L76 28 Z" fill="#E9772B"/>
      <ellipse cx="60" cy="78" rx="42" ry="48" fill="#FF9F43"/>
      <ellipse cx="50" cy="62" rx="22" ry="15" fill="#fff" opacity=".14"/>
      <ellipse cx="60" cy="92" rx="26" ry="28" fill="#FFE8C4"/>
      <path d="M48 88 l4 4 l4 -4 M60 98 l4 4 l4 -4 M64 86 l4 4 l4 -4" stroke="#F4BE82" stroke-width="2" fill="none"/>
      <ellipse cx="20" cy="84" rx="10" ry="24" fill="#E9772B" transform="rotate(12 20 84)"/>
      <ellipse cx="100" cy="84" rx="10" ry="24" fill="#E9772B" transform="rotate(-12 100 84)"/>
      <circle cx="46" cy="55" r="15" fill="#fff"/><circle cx="74" cy="55" r="15" fill="#fff"/>
      ${pupils}
      <path d="M55 64 L65 64 L60 73 Z" fill="#FF4F8B"/>
      ${mouth}
      <path d="M44 124 l-4 6 M48 124 v7 M52 124 l4 6 M68 124 l-4 6 M72 124 v7 M76 124 l4 6" stroke="#FF4F8B" stroke-width="3" stroke-linecap="round"/>
      <g class="hat">${HAT_SVG[hat] || ''}</g>
    </svg>`;
  }

  G.CQMascot = { owlSVG };
})(window);
