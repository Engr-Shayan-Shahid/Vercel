"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, SendHorizonal, Settings, Shield, X, Factory } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/exporter", icon: LayoutDashboard },
  { label: "My Requests", href: "/exporter/requests", icon: SendHorizonal },
  { label: "Settings", href: "/exporter/settings", icon: Settings },
] as const;

interface ExporterSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ExporterSidebar({ open, onClose }: ExporterSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/exporter" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Shield className="h-5 w-5 text-amber-400" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-foreground">
                CBAMVault
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Exporter Portal
              </span>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/exporter" ? pathname === "/exporter" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_#f59e0b]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-amber-400" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer — Role badge */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <Factory className="h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-medium text-foreground">Exporter workspace</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Emission data submissions
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
