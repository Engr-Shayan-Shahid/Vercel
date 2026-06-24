"use client";

import { Bell, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserSettings } from "@/context/user-settings-context";
import { getInitials } from "@/lib/settings-schema";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { settings } = useUserSettings();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-deep-black/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search imports, reports..."
          className="h-10 w-full pl-10"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-deep-black" />
        </Button>

        <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
          aria-label="User menu"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {settings.complianceOfficerName}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Compliance Officer</p>
          </div>
          <Avatar>
            <AvatarFallback>{getInitials(settings.complianceOfficerName)}</AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
