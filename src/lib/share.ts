const enc = encodeURIComponent;

export type ShareTarget = "whatsapp" | "telegram" | "x" | "linkedin" | "facebook" | "reddit" | "email";

/** Links that open each app's own share screen with the deck link filled in. */
export function shareLinks(url: string, title: string): { id: ShareTarget; label: string; href: string }[] {
  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}` },
    { id: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { id: "reddit", label: "Reddit", href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}` },
    { id: "email", label: "Email", href: `mailto:?subject=${enc(title)}&body=${enc(`Take a look at this presentation: ${url}`)}` },
  ];
}
