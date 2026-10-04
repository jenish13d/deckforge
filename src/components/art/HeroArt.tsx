// Original illustration: three floating slide cards (chart, photo, title) with sparkles.
// Pure SVG, so it is crisp at any size and renders the same in every browser.

const star = "M0 -1 C0.12 -0.12 0.12 -0.12 1 0 C0.12 0.12 0.12 0.12 0 1 C-0.12 0.12 -0.12 0.12 -1 0 C-0.12 -0.12 -0.12 -0.12 0 -1Z";

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 260" role="img" aria-label="Slides being created">
      <defs>
        <linearGradient id="ha-primary" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#e9d5ff" />
        </linearGradient>
        <linearGradient id="ha-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="ha-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="ha-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <filter id="ha-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#312e81" floodOpacity="0.18" />
        </filter>
        {(["#c7d2fe", "#fbcfe8", "#fde68a"] as const).map((color, i) => (
          <radialGradient key={color} id={`ha-glow${i}`}>
            <stop offset="0" stopColor={color} stopOpacity="0.9" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* soft glow behind the cards */}
      <g className="hero-art__glow">
        <circle cx="140" cy="140" r="120" fill="url(#ha-glow0)" />
        <circle cx="285" cy="110" r="110" fill="url(#ha-glow1)" />
        <circle cx="235" cy="190" r="80" fill="url(#ha-glow2)" />
      </g>

      {/* back-left card: bar chart */}
      <g transform="rotate(-11 125 115)" filter="url(#ha-shadow)">
        <rect x="40" y="58" width="172" height="112" rx="14" fill="#ffffff" />
        <rect x="56" y="74" width="70" height="9" rx="4.5" fill="#c7d2fe" />
        <rect x="58" y="128" width="20" height="28" rx="4" fill="url(#ha-bar)" />
        <rect x="86" y="112" width="20" height="44" rx="4" fill="url(#ha-bar)" />
        <rect x="114" y="120" width="20" height="36" rx="4" fill="url(#ha-bar)" />
        <rect x="142" y="96" width="20" height="60" rx="4" fill="url(#ha-primary)" />
        <rect x="170" y="104" width="20" height="52" rx="4" fill="url(#ha-bar)" />
      </g>

      {/* back-right card: photo */}
      <g transform="rotate(9 285 95)" filter="url(#ha-shadow)">
        <rect x="205" y="38" width="160" height="108" rx="14" fill="#ffffff" />
        <clipPath id="ha-photo">
          <rect x="215" y="48" width="140" height="70" rx="8" />
        </clipPath>
        <g clipPath="url(#ha-photo)">
          <rect x="215" y="48" width="140" height="70" fill="url(#ha-sky)" />
          <circle cx="322" cy="70" r="11" fill="url(#ha-sun)" />
          <path d="M215 118 L252 82 L280 104 L300 88 L355 118 Z" fill="url(#ha-hill)" />
          <path d="M262 118 L300 88 L338 118 Z" fill="#a5b4fc" />
        </g>
        <rect x="215" y="127" width="84" height="8" rx="4" fill="#e0e7ff" />
      </g>

      {/* front card: title slide */}
      <g transform="rotate(-3 205 170)" filter="url(#ha-shadow)">
        <rect x="108" y="112" width="196" height="120" rx="16" fill="url(#ha-primary)" />
        <circle cx="134" cy="138" r="9" fill="#ffffff" opacity="0.9" />
        <rect x="126" y="160" width="124" height="13" rx="6.5" fill="#ffffff" />
        <rect x="126" y="181" width="90" height="8" rx="4" fill="#ffffff" opacity="0.65" />
        <rect x="126" y="206" width="44" height="12" rx="6" fill="#ffffff" opacity="0.3" />
      </g>

      {/* sparkles */}
      <path d={star} transform="translate(318 168) scale(20)" fill="url(#ha-sun)" />
      <path d={star} transform="translate(84 48) scale(11)" fill="#f472b6" />
      <path d={star} transform="translate(356 196) scale(8)" fill="#a855f7" />
      <circle cx="58" cy="196" r="5" fill="#a5b4fc" />
      <circle cx="372" cy="56" r="4" fill="#f9a8d4" />
      <circle cx="196" cy="30" r="3.5" fill="#fbbf24" />
    </svg>
  );
}
