import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";

import { FeedbackButton } from "@/components/FeedbackButton";
import { getCurrentUser } from "@/lib/auth";
import { captchaEnabled } from "@/lib/captcha";
import { SITE } from "@/lib/site";
import { siteUrl } from "@/lib/url";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Fraunces({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"] });

// One look everywhere: the site stays light even when the device is in dark mode.
export const viewport: Viewport = { colorScheme: "light", themeColor: "#ffffff" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  // Ownership checks for Google Search Console and Bing Webmaster Tools (public codes, set in Vercel).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  title: { default: `${SITE.name}: AI presentation maker`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name}: AI presentation maker`,
    description: SITE.tagline,
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        {process.env.DEMO_AI === "1" && (
          <div className="demo-banner no-print" role="note">
            Demo mode: decks use sample text, not real AI. No API costs.
          </div>
        )}
        {children}
        <FeedbackButton loggedIn={Boolean(user)} captcha={captchaEnabled()} />
      </body>
    </html>
  );
}
