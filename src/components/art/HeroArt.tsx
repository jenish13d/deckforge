// Original illustration: three floating slide cards (chart, Tuscan landscape, title)
// with a lemon and sparkles. Pure SVG, so it is crisp at any size and renders the
// same in every browser.

const star = "M0 -1 C0.12 -0.12 0.12 -0.12 1 0 C0.12 0.12 0.12 0.12 0 1 C-0.12 0.12 -0.12 0.12 -1 0 C-0.12 -0.12 -0.12 -0.12 0 -1Z";

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 260" role="img" aria-label="Slides being created">
      <defs>
        <linearGradient id="ha-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--brand-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--brand-b)" }} />
        </linearGradient>
        <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9d6ef" />
          <stop offset="1" stopColor="#fdf1d2" />
        </linearGradient>
        <linearGradient id="ha-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe88f" />
          <stop offset="1" stopColor="#f2b134" />
        </linearGradient>
        <linearGradient id="ha-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--art-bar-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--art-bar-b)" }} />
        </linearGradient>
        <linearGradient id="ha-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a9a4b" />
          <stop offset="1" stopColor="#5f6d31" />
        </linearGradient>
        {(["var(--art-glow-a)", "var(--art-glow-b)", "var(--art-glow-c)"] as const).map((color, i) => (
          <radialGradient key={color} id={`ha-glow${i}`}>
            <stop offset="0" style={{ stopColor: color, stopOpacity: 0.9 }} />
            <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
          </radialGradient>
        ))}
        <filter id="ha-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" style={{ floodColor: "var(--art-shadow)", floodOpacity: 0.18 }} />
        </filter>
      </defs>

      {/* soft glow behind the cards */}
      <g className="hero-art__glow">
        <circle cx="140" cy="140" r="120" fill="url(#ha-glow0)" />
        <circle cx="285" cy="110" r="110" fill="url(#ha-glow1)" />
        <circle cx="235" cy="190" r="80" fill="url(#ha-glow2)" />
      </g>

      {/* back-left card: bar chart */}
      <g transform="rotate(-11 125 115)" filter="url(#ha-shadow)">
        <rect x="40" y="58" width="172" height="112" rx="14" fill="#fffdf8" />
        <rect x="56" y="74" width="70" height="9" rx="4.5" style={{ fill: "var(--art-chip)" }} />
        <rect x="58" y="128" width="20" height="28" rx="4" fill="url(#ha-bar)" />
        <rect x="86" y="112" width="20" height="44" rx="4" fill="url(#ha-bar)" />
        <rect x="114" y="120" width="20" height="36" rx="4" fill="url(#ha-bar)" />
        <rect x="142" y="96" width="20" height="60" rx="4" fill="url(#ha-primary)" />
        <rect x="170" y="104" width="20" height="52" rx="4" fill="url(#ha-bar)" />
      </g>

      {/* back-right card: Tuscan hills with cypress trees */}
      <g transform="rotate(9 285 95)" filter="url(#ha-shadow)">
        <rect x="205" y="38" width="160" height="108" rx="14" fill="#fffdf8" />
        <clipPath id="ha-photo">
          <rect x="215" y="48" width="140" height="70" rx="8" />
        </clipPath>
        <g clipPath="url(#ha-photo)">
          <rect x="215" y="48" width="140" height="70" fill="url(#ha-sky)" />
          <circle cx="324" cy="68" r="10" fill="url(#ha-sun)" />
          <path d="M215 104 C245 86 270 92 292 100 C312 92 336 88 355 96 L355 118 L215 118 Z" fill="#c9d18f" />
          <path d="M215 118 C238 100 262 98 286 110 C304 102 330 100 355 112 L355 118 Z" fill="url(#ha-hill)" />
          <ellipse cx="262" cy="92" rx="3.2" ry="11" fill="#3f4a22" />
          <ellipse cx="270" cy="95" rx="2.6" ry="8.5" fill="#3f4a22" />
          <ellipse cx="318" cy="90" rx="3" ry="10" fill="#3f4a22" />
          <path d="M226 118 L226 110 L238 104 L250 110 L250 118 Z" fill="#e8b48c" />
          <path d="M224 111 L238 102 L252 111" style={{ stroke: "var(--brand-a)" }} strokeWidth="3" fill="none" strokeLinejoin="round" />
        </g>
        <rect x="215" y="127" width="84" height="8" rx="4" style={{ fill: "var(--art-chip)" }} />
      </g>

      {/* front card: title slide */}
      <g transform="rotate(-3 205 170)" filter="url(#ha-shadow)">
        <rect x="108" y="112" width="196" height="120" rx="16" fill="url(#ha-primary)" />
        <circle cx="134" cy="138" r="9" fill="#fff7ea" opacity="0.9" />
        <rect x="126" y="160" width="124" height="13" rx="6.5" fill="#fff7ea" />
        <rect x="126" y="181" width="90" height="8" rx="4" fill="#fff7ea" opacity="0.65" />
        <rect x="126" y="206" width="44" height="12" rx="6" fill="#fff7ea" opacity="0.3" />
      </g>

      {/* a lemon with a leaf */}
      <g transform="translate(70 206) rotate(-18)">
        <path d="M6 -10 C16 -22 30 -20 34 -14 C26 -8 14 -6 6 -10Z" fill="#6b7a3a" />
        <ellipse cx="0" cy="0" rx="17" ry="12.5" fill="url(#ha-sun)" />
        <circle cx="-17" cy="0" r="2.6" fill="#f2b134" />
        <circle cx="17" cy="0" r="2.6" fill="#f2b134" />
        <ellipse cx="-5" cy="-4" rx="5" ry="2.5" fill="#fff6c8" opacity="0.7" />
      </g>

      {/* sparkles */}
      <path d={star} transform="translate(318 168) scale(20)" fill="url(#ha-sun)" />
      <path d={star} transform="translate(84 48) scale(11)" style={{ fill: "var(--brand-b)" }} />
      <path d={star} transform="translate(356 196) scale(8)" style={{ fill: "var(--accent)" }} />
      <circle cx="372" cy="56" r="4" style={{ fill: "var(--art-glow-a)" }} />
      <circle cx="196" cy="30" r="3.5" style={{ fill: "var(--gold)" }} />
    </svg>
  );
}
