import type { ComponentProps } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleMinus,
  Database,
  FileText,
  Globe2,
  History,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  RefreshCcw,
  ShieldCheck,
  ShieldKeyhole,
  Sun,
  TriangleAlert,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "solar:alt-arrow-right-linear": ArrowRight,
  "solar:arrow-right-linear": ArrowRight,
  "solar:arrow-right-up-linear": ArrowUpRight,
  "solar:buildings-2-linear": Building2,
  "solar:chart-square-linear": ChartNoAxesCombined,
  "solar:check-circle-linear": CheckCircle2,
  "solar:close-circle-linear": XCircle,
  "solar:danger-triangle-linear": TriangleAlert,
  "solar:database-linear": Database,
  "solar:document-text-linear": FileText,
  "solar:global-linear": Globe2,
  "solar:hamburger-menu-linear": Menu,
  "solar:history-linear": History,
  "solar:lock-keyhole-linear": LockKeyhole,
  "solar:logout-2-linear": LogOut,
  "solar:minus-circle-linear": CircleMinus,
  "solar:moon-linear": Moon,
  "solar:refresh-circle-linear": RefreshCcw,
  "solar:shield-check-bold": ShieldCheck,
  "solar:shield-check-linear": ShieldCheck,
  "solar:shield-keyhole-bold": ShieldKeyhole,
  "solar:shield-keyhole-linear": ShieldKeyhole,
  "solar:sun-2-linear": Sun,
  "solar:user-check-linear": UserCheck,
  "solar:verified-check-bold": BadgeCheck,
  "solar:verified-check-linear": BadgeCheck,
};

export function Icon({
  icon,
  ...props
}: { icon: string } & ComponentProps<"svg">) {
  const Component = icons[icon] ?? ShieldCheck;
  return (
    <Component
      aria-hidden="true"
      focusable="false"
      strokeWidth={1.8}
      {...props}
    />
  );
}
