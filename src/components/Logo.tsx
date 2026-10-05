import { SITE } from "@/lib/site";
import { BrandMark } from "./BrandMark";

/** The mark in the site's brand tokens (see globals.css). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <BrandMark
      size={size}
      colors={{ sky: "var(--logo-sky)", sun: "var(--logo-sun)", sea: "var(--logo-sea)", foam: "var(--logo-foam)", wave: "var(--logo-wave)" }}
    />
  );
}

/** Mark plus name; the name's last three letters ("zza") are set in gold. */
export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span>
        {SITE.name.slice(0, -3)}
        <span className="logo__accent">{SITE.name.slice(-3)}</span>
      </span>
    </span>
  );
}
