"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  CalendarDays,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Radar,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/radar", label: "Product Radar", icon: Radar },
  { href: "/prompt-lab", label: "Prompt Lab", icon: FlaskConical },
  { href: "/personas", label: "Persona Studio", icon: UserRound },
  { href: "/campaigns", label: "Campaign Board", icon: CalendarDays },
  { href: "/monitor", label: "Monitor", icon: Activity },
  { href: "/compliance", label: "Compliance Check", icon: ShieldCheck },
  { href: "/analytics", label: "Winner Tracker", icon: Trophy },
  { href: "/settings", label: "Integrations", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-6 py-5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Radar className="size-4" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Affiliate</div>
        <div className="text-xs text-muted-foreground">Command Center</div>
      </div>
    </Link>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar lg:flex">
        <Brand />
        <NavLinks />
        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-xs text-muted-foreground">v1 · mock data</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-30 bg-background pt-20 lg:hidden">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      )}
      {/* Mobile content offset */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
