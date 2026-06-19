"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  FileText,
  KanbanSquare,
  ClipboardList,
  CalendarCheck,
  CalendarDays,
  Receipt,
  Settings,
  Megaphone,
  TrendingUp,
  BarChart3,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

// Links directos (no colapsables) que aparecen arriba del sidebar
const topLinks: NavItem[] = [
  { href: "/direccion/general", label: "Panel General", icon: LayoutDashboard },
  { href: "/direccion/rendimiento", label: "Rendimiento del Negocio", icon: TrendingUp },
];

const sections: NavSection[] = [
  {
    id: "setter",
    title: "Setter",
    icon: Users,
    items: [
      { href: "/setter/panel", label: "Panel de Leads", icon: LayoutDashboard },
      { href: "/setter/leads", label: "Leads", icon: Users },
      { href: "/setter/kanban", label: "Estado de los leads", icon: KanbanSquare },
      { href: "/setter/leads/nuevo", label: "Nuevo lead", icon: ClipboardList },
      { href: "/setter/leads/nuevo-agendado", label: "Nuevo lead agendado", icon: CalendarCheck },
      { href: "/setter/triage", label: "Triage", icon: ClipboardList },
      { href: "/setter/kpis-diarios", label: "KPIs diarios", icon: BarChart3 },
    ],
  },
  {
    id: "closer",
    title: "Closer",
    icon: Phone,
    items: [
      { href: "/closer/triages", label: "Triages activos", icon: LayoutDashboard },
      { href: "/closer/reporte", label: "Reporte de Llamadas", icon: ClipboardList },
      { href: "/closer/grilla", label: "Grilla de Reportes", icon: FileText },
      { href: "/closer/calendario", label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: Megaphone,
    items: [
      { href: "/marketing", label: "Rendimiento del Contenido", icon: FileText },
    ],
  },
  {
    id: "cobros",
    title: "Cobros",
    icon: Receipt,
    items: [
      { href: "/cobros", label: "Cuotas y seguimientos", icon: Calendar },
    ],
  },
];

function sectionForPath(pathname: string | null): string | null {
  if (!pathname) return null;
  for (const section of sections) {
    if (section.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
      return section.id;
    }
  }
  return null;
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav() {
  const pathname = usePathname();
  const activeSection = sectionForPath(pathname);
  // Start collapsed; auto-open only the section that contains the current route.
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection] : []),
  );

  function toggle(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <nav className="scrollbar-hide flex h-full flex-col gap-1 overflow-y-auto p-3">
      {/* Links directos arriba (Panel General, Rendimiento del Negocio) */}
      <div className="mb-3 space-y-0.5">
        {topLinks.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-light))] before:absolute before:-left-[10px] before:top-1/2 before:h-5 before:w-[2px] before:-translate-y-1/2 before:rounded-r before:bg-[hsl(var(--gold))]"
                  : "text-muted-foreground hover:bg-[hsl(var(--gold)/0.08)] hover:text-[hsl(var(--gold-light))]",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {sections.map((section) => {
        const isOpen = openSections.has(section.id);
        const hasActiveItem = activeSection === section.id;
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                hasActiveItem
                  ? "text-[hsl(var(--gold-light))]"
                  : "text-muted-foreground hover:bg-[hsl(var(--gold)/0.06)] hover:text-[hsl(var(--gold-light))]",
              )}
              aria-expanded={isOpen}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  isOpen && "rotate-90",
                )}
              />
              <section.icon className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">{section.title}</span>
            </button>
            {isOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-light))] before:absolute before:-left-[10px] before:top-1/2 before:h-5 before:w-[2px] before:-translate-y-1/2 before:rounded-r before:bg-[hsl(var(--gold))]"
                          : "text-muted-foreground hover:bg-[hsl(var(--gold)/0.08)] hover:text-[hsl(var(--gold-light))]",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-auto border-t border-border pt-3">
        <Link
          href="/ajustes"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
            pathname?.startsWith("/ajustes")
              ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-light))]"
              : "text-muted-foreground hover:bg-[hsl(var(--gold)/0.08)] hover:text-[hsl(var(--gold-light))]",
          )}
        >
          <Settings className="h-4 w-4" />
          Ajustes
        </Link>
      </div>
    </nav>
  );
}
