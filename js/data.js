/* Candle Quest — game content: worlds, levels, lessons, shop, badges. */
(function (G) {
  'use strict';

  const WORLDS = [
    {
      id: 'w1', name: 'Candle Island', emoji: '🕯️', color: '#f59e0b',
      blurb: 'Learn to read candles — the building blocks of every chart.',
      lesson: [
        { title: 'What is a candle?', text: 'Each candle shows what price did in a slice of time. The fat part is the BODY. The thin lines are WICKS — they show how far price stretched.', demo: 'wick' },
        { title: 'Green vs Red', text: 'GREEN candle = price closed HIGHER than it opened (buyers won). RED candle = price closed LOWER (sellers won).', demo: 'green' },
        { title: 'Highs', text: 'The very top of a wick is the HIGH. Traders watch the highest and lowest prices because lots of orders wait there.', demo: 'highest' },
      ],
      levels: [
        { name: 'Green & Red', rounds: ['green', 'red', 'green', 'red', 'green'] },
        { name: 'Wick Watch', rounds: ['wick', 'highest', 'wick', 'highest', 'wick'] },
        { name: 'Candle Champ', rounds: ['red', 'wick', 'green', 'highest', 'wick'] },
      ],
    },
    {
      id: 'w2', name: 'Mountain Trail', emoji: '⛰️', color: '#10b981',
      blurb: 'Find the peaks and valleys and learn which way the market is walking.',
      lesson: [
        { title: 'Swing highs', text: 'A SWING HIGH is a mountain top: price went up, made a peak, then came down.', demo: 'swingHigh' },
        { title: 'Swing lows', text: 'A SWING LOW is a valley: price went down, made a bottom, then went up.', demo: 'swingLow' },
        { title: 'Trends', text: 'Higher highs + higher lows = UPTREND. Lower highs + lower lows = DOWNTREND. Bouncing in a box = SIDEWAYS.', demo: 'trend' },
      ],
      levels: [
        { name: 'Mountain Tops', rounds: ['swingHigh', 'swingHigh', 'swingLow', 'swingHigh', 'swingLow'] },
        { name: 'Deep Valleys', rounds: ['swingLow', 'swingLow', 'swingHigh', 'swingLow', 'swingHigh'] },
        { name: 'Trend Spotter', rounds: ['trend', 'trend', 'trend', 'trend', 'trend'] },
        { name: 'Trail Boss', rounds: ['swingHigh', 'trend', 'swingLow', 'trend', 'highest'] },
      ],
    },
    {
      id: 'w3', name: 'Liquidity Lagoon', emoji: '💧', color: '#3b82f6',
      blurb: 'Discover where the hidden orders sleep — and watch big players grab them.',
      lesson: [
        { title: 'Hidden treasure', text: 'Traders put STOP orders just above highs and just below lows. All those orders together are called LIQUIDITY 💰.', demo: 'bsl' },
        { title: 'The sweep', text: 'Big players push price just past the highs or lows to grab that liquidity — then price snaps back. That is a LIQUIDITY SWEEP 🧹.', demo: 'ssl' },
        { title: 'What happens next?', text: 'After price sweeps the highs, it often drops. After it sweeps the lows, it often rises. Not always — but often!', demo: 'sweepPredict' },
      ],
      levels: [
        { name: 'Buy-side Treasure', rounds: ['bsl', 'bsl', 'bsl', 'highest', 'bsl'] },
        { name: 'Sell-side Treasure', rounds: ['ssl', 'ssl', 'bsl', 'ssl', 'ssl'] },
        { name: 'Sweep Predictor', rounds: ['sweepPredict', 'sweepPredict', 'sweepPredict', 'sweepPredict', 'sweepPredict'] },
        { name: 'Lagoon Boss', rounds: ['bsl', 'ssl', 'sweepPredict', 'ssl', 'sweepPredict'] },
      ],
    },
    {
      id: 'w4', name: 'Gap Canyon', emoji: '🏜️', color: '#ef4444',
      blurb: 'Super-fast candles leave holes in the chart. Find them!',
      lesson: [
        { title: 'Fair Value Gap', text: 'When one candle moves SUPER fast, the candles before and after it don\'t touch. That empty space is a FAIR VALUE GAP (FVG) 🕳️.', demo: 'fvgBull' },
        { title: 'Gaps both ways', text: 'Fast moves UP leave bullish gaps. Fast moves DOWN leave bearish gaps.', demo: 'fvgBear' },
        { title: 'Filling the gap', text: 'Price often comes back to the gap, then continues the way the big candle went.', demo: 'fvgPredict' },
      ],
      levels: [
        { name: 'Gap Finder', rounds: ['fvgBull', 'fvgBull', 'fvgBull', 'fvgBull', 'fvgBull'] },
        { name: 'Upside-Down Gaps', rounds: ['fvgBear', 'fvgBear', 'fvgBull', 'fvgBear', 'fvgBull'] },
        { name: 'Gap Bounce', rounds: ['fvgPredict', 'fvgPredict', 'fvgPredict', 'fvgPredict', 'fvgPredict'] },
        { name: 'Canyon Boss', rounds: ['fvgBull', 'fvgPredict', 'fvgBear', 'sweepPredict', 'fvgPredict'] },
      ],
    },
    {
      id: 'w5', name: 'Block Fortress', emoji: '🏰', color: '#8b5cf6',
      blurb: 'Order blocks and structure shifts — how the pros spot a turnaround.',
      lesson: [
        { title: 'Order Block', text: 'The LAST down candle before a huge move up is a bullish ORDER BLOCK 🧱. Big buyers loaded up there.', demo: 'obBull' },
        { title: 'Bearish blocks', text: 'The LAST up candle before a huge drop is a bearish order block.', demo: 'obBear' },
        { title: 'Structure shift', text: 'When price CLOSES past the last swing point the "wrong" way, the trend may be flipping. That is a MARKET STRUCTURE SHIFT ⚡.', demo: 'mss' },
      ],
      levels: [
        { name: 'Brick by Brick', rounds: ['obBull', 'obBull', 'obBull', 'obBull', 'obBull'] },
        { name: 'Upside-Down Blocks', rounds: ['obBear', 'obBear', 'obBull', 'obBear', 'obBull'] },
        { name: 'Lightning Shift', rounds: ['mss', 'mss', 'mss', 'mss', 'mss'] },
        { name: 'Fortress Boss', rounds: ['obBull', 'mss', 'obBear', 'fvgBull', 'mss'] },
      ],
    },
    {
      id: 'w6', name: 'Kill Zone Volcano', emoji: '🌋', color: '#f97316',
      blurb: 'Put it ALL together and take real (pretend) trades like an ICT pro.',
      lesson: [
        { title: 'The full model', text: '1️⃣ Price sweeps liquidity 🧹  2️⃣ A big candle breaks structure ⚡ and leaves a gap 🕳️  3️⃣ Price comes back into the gap — that is the ENTRY.', demo: 'trade' },
        { title: 'Stop & target', text: 'The STOP 🛑 goes past the sweep. The TARGET 🎯 is the liquidity on the other side. Pros ALWAYS use a stop.', demo: 'trade' },
        { title: 'Play coins only', text: 'In Candle Quest you trade with play coins. Real trading is for grown-ups and needs lots of practice. You are getting that practice right now! 🧠', demo: null },
      ],
      levels: [
        { name: 'Boss Setup I', rounds: ['trade', 'trade', 'trade'] },
        { name: 'Boss Setup II', rounds: ['trade', 'mss', 'trade', 'fvgPredict', 'trade'] },
        { name: 'Grand Master', rounds: ['sweepPredict', 'mss', 'fvgPredict', 'trade', 'trade'] },
      ],
    },
  ];

  // Concepts unlocked for Practice Arena once a world has been reached.
  const WORLD_KEYS = WORLDS.map((w) => Array.from(new Set(w.levels.flatMap((l) => l.rounds))));

  const THEMES = [
    { id: 'classic', name: 'Midnight', price: 0, bg: '#1B1236', grid: '#271B4A', up: '#2EE6A6', down: '#FF5C7A', text: '#E9E2FF', future: '#22173F' },
    { id: 'day', name: 'Daylight', price: 150, bg: '#FFFFFF', grid: '#EEF0F6', up: '#12B886', down: '#F03E5E', text: '#2B2350', future: '#F3F1FA' },
    { id: 'candy', name: 'Candy Land', price: 200, bg: '#2A0F2E', grid: '#3D1B42', up: '#7CFFCB', down: '#FF7AB6', text: '#FFE3F3', future: '#331437' },
    { id: 'ocean', name: 'Deep Ocean', price: 250, bg: '#071E33', grid: '#0E2E4A', up: '#3CE0C0', down: '#FF8A5C', text: '#D6F1FF', future: '#0B2640' },
    { id: 'jungle', name: 'Jungle', price: 300, bg: '#0E2318', grid: '#17352A', up: '#9BF05A', down: '#FF8A4C', text: '#E3FFE9', future: '#132C20' },
    { id: 'neon', name: 'Neon Arcade', price: 450, bg: '#08051A', grid: '#1A1240', up: '#39FF14', down: '#FF2E88', text: '#E0E0FF', future: '#110B2C' },
  ];

  const HATS = [
    { id: 'none', name: 'No hat', price: 0 },
    { id: 'cap', name: 'Trader Cap', price: 100 },
    { id: 'pirate', name: 'Pirate Hat', price: 200 },
    { id: 'wizard', name: 'Chart Wizard', price: 250 },
    { id: 'astro', name: 'To the Moon', price: 350 },
    { id: 'crown', name: 'Market King', price: 500 },
  ];

  const BADGES = [
    { id: 'first', emoji: '🌟', name: 'First Steps', desc: 'Finish your first level' },
    { id: 'perfect', emoji: '💯', name: 'Perfect!', desc: 'Get 3 stars on a level' },
    { id: 'w1', emoji: '🕯️', name: 'Candle Reader', desc: 'Finish Candle Island' },
    { id: 'w2', emoji: '⛰️', name: 'Trail Blazer', desc: 'Finish Mountain Trail' },
    { id: 'w3', emoji: '💧', name: 'Liquidity Hunter', desc: 'Finish Liquidity Lagoon' },
    { id: 'w4', emoji: '🕳️', name: 'Gap Master', desc: 'Finish Gap Canyon' },
    { id: 'w5', emoji: '🧱', name: 'Block Builder', desc: 'Finish Block Fortress' },
    { id: 'w6', emoji: '👑', name: 'ICT Grand Master', desc: 'Beat Kill Zone Volcano' },
    { id: 'streak3', emoji: '🔥', name: 'On Fire', desc: 'Claim the daily treasure 3 days in a row' },
    { id: 'streak7', emoji: '📅', name: 'Every Day', desc: '7-day treasure streak' },
    { id: 'practice10', emoji: '🎯', name: 'Sharp Eye', desc: '10 in a row in Practice Arena' },
    { id: 'practice25', emoji: '🦅', name: 'Eagle Eye', desc: '25 in a row in Practice Arena' },
    { id: 'rich', emoji: '💰', name: 'Coin Collector', desc: 'Earn 1,000 coins in total' },
    { id: 'shopper', emoji: '🛍️', name: 'Style Star', desc: 'Buy something in the shop' },
    { id: 'win5', emoji: '📈', name: 'Winning Trader', desc: 'Win 5 boss trades in Trading School' },
    { id: 'tp1', emoji: '🎯', name: 'First Take Profit', desc: 'Hit your first TP in the live market' },
    { id: 'sniper', emoji: '🌟', name: 'Gap Sniper', desc: 'Win a trade with a perfect ICT entry' },
    { id: 'tp25', emoji: '💎', name: 'Profit Machine', desc: 'Hit 25 Take Profits' },
    { id: 'm9', emoji: '🌋', name: 'Kill Zone Master', desc: 'Complete every live mission' },
    { id: 'room1', emoji: '🛋️', name: 'Home Upgrade', desc: 'Buy your first room upgrade' },
    { id: 'tycoon', emoji: '🏙️', name: 'Tycoon', desc: 'Move into the penthouse' },
  ];

  const PRAISE = ['Nice! 🎉', 'Awesome! ⭐', 'You got it! 🙌', 'Sharp eyes! 👀', 'Pro move! 💪', 'Boom! 💥', 'Chart wizard! 🧙'];
  const OOPS = ['Not quite!', 'So close!', 'Good try!', 'Almost!'];

  G.CQData = { WORLDS, WORLD_KEYS, THEMES, HATS, BADGES, PRAISE, OOPS };
})(typeof window !== 'undefined' ? window : globalThis);
