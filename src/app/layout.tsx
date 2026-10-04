import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Fraunces({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Deckforge: AI presentation maker", template: "%s · Deckforge" },
  description: "Describe your idea. Deckforge plans it, writes it and designs it. Then make it yours.",
  openGraph: {
    title: "Deckforge: AI presentation maker",
    description: "Ideas to slides in a minute.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        {process.env.DEMO_AI === "1" && (
          <div className="demo-banner no-print" role="note">
            Demo mode: decks use sample text, not real AI. No API costs.
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
