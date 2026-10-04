import { ChartColumn, GraduationCap, Handshake, Mic, Rocket, Sparkles, Users, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  pitch: Rocket,
  sales: Handshake,
  report: ChartColumn,
  lesson: GraduationCap,
  onboarding: Users,
  talk: Mic,
};

/** Line icon for a template (emoji look different in every browser; these don't). */
export function TemplateIcon({ id, size = 16 }: { id: string; size?: number }) {
  const Icon = ICONS[id] ?? Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}
