export interface NavigationItem {
  label: string;
  href: string;
}

export interface Audience {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ValuePillar {
  id: string;
  title: string;
  description: string;
  featured?: boolean;
}

export interface PlatformFeature {
  id: string;
  label: string;
}

export type ModuleCategory =
  | "avaliacao"
  | "engajamento"
  | "gestao"
  | "personalizacao";

export interface EduvyModule {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  icon: string;
  connected?: boolean;
}

export interface UseCase {
  id: string;
  tabLabel: string;
  title: string;
  features: string[];
  illustration: {
    headline: string;
    metrics: { label: string; value: string }[];
  };
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  variant: "default" | "highlight" | "enterprise";
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  x: number;
  y: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked?: boolean;
}

export interface ModularStep {
  id: string;
  step: number;
  title: string;
  description: string;
  items: string[];
}

export interface DemoModuleChip {
  id: string;
  label: string;
}

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export interface FooterLinkGroup {
  title: string;
  links: { label: string; href?: string; demo?: boolean }[];
}
