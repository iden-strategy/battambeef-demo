import {
  Ban,
  BookOpen,
  ChefHat,
  CircleHelp,
  Flame,
  Handshake,
  Map,
  MapPin,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Refrigerator,
  Thermometer,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { AboutIcon, BusinessIcon, ContactIcon, KnowledgeIcon } from "@/lib/data";

/** Data files name their icons; this maps the names to lucide icons (data stays free of React). */
const ICONS: Record<AboutIcon | BusinessIcon | KnowledgeIcon | ContactIcon, LucideIcon> = {
  "map-pin": MapPin,
  "shield-check": ShieldCheck,
  "chef-hat": ChefHat,
  sparkles: Sparkles,
  users: Users,
  warehouse: Warehouse,
  scissors: Scissors,
  handshake: Handshake,
  map: Map,
  flame: Flame,
  snowflake: Snowflake,
  "book-open": BookOpen,
  "circle-help": CircleHelp,
  "shopping-bag": ShoppingBag,
  refrigerator: Refrigerator,
  thermometer: Thermometer,
  ban: Ban,
};

export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  const Component = ICONS[name];
  return <Component aria-hidden className={className} />;
}

/** An icon in a round crimson badge (crimson as a fill, never as text). */
export function IconBadge({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ${className ?? ""}`}>
      <Icon name={name} className="size-5" />
    </span>
  );
}
