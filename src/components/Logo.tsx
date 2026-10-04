import { SITE } from "@/lib/site";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="7" width="22" height="16" rx="4" fill="#a5a0ff" />
      <rect x="8" y="10" width="22" height="16" rx="4" fill="#4f46e5" />
      <path d="M14 15.5h10M14 19.5h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
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
