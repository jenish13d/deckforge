import { SITE } from "@/lib/site";

/** Two slides (olive and terracotta) with a lemon sun. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="8" width="21" height="15" rx="4" fill="#8a9a4b" />
      <rect x="8" y="12" width="22" height="16" rx="4" fill="#b4462a" />
      <path d="M13.5 18h11M13.5 22h7" stroke="#fff7ea" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26" cy="6.5" r="4" fill="#f2c94c" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span>{SITE.name}</span>
    </span>
  );
}
