import { Gem, Sparkles, Zap } from "lucide-react";

import type { ModeId } from "@/lib/plans";

const ICONS = { quick: Zap, standard: Sparkles, premium: Gem };

export function ModeIcon({ mode, size = 16 }: { mode: ModeId; size?: number }) {
  const Icon = ICONS[mode];
  return <Icon size={size} aria-hidden="true" className="mode-icon" />;
}
