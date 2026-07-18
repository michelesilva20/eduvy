import {
  Award,
  BadgeCheck,
  Building,
  Building2,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Landmark,
  LibraryBig,
  Medal,
  MessagesSquare,
  Palette,
  PenLine,
  Plug,
  Smartphone,
  Trophy,
  UserRound,
  Video,
  type LucideIcon,
} from "lucide-react";

export const landingIconMap: Record<string, LucideIcon> = {
  "building-2": Building2,
  "graduation-cap": GraduationCap,
  "user-round": UserRound,
  landmark: Landmark,
  "pen-line": PenLine,
  "clipboard-check": ClipboardCheck,
  "library-big": LibraryBig,
  "messages-square": MessagesSquare,
  trophy: Trophy,
  video: Video,
  award: Award,
  "chart-no-axes-combined": ChartNoAxesCombined,
  building: Building,
  palette: Palette,
  plug: Plug,
  smartphone: Smartphone,
  flame: Flame,
  "badge-check": BadgeCheck,
  medal: Medal,
};

interface LandingIconProps {
  name: string;
  className?: string;
}

export function LandingIcon({ name, className }: LandingIconProps) {
  const Icon = landingIconMap[name] ?? CircleHelp;
  return <Icon className={className} aria-hidden />;
}
