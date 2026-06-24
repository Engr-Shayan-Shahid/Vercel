"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserSettings } from "@/context/user-settings-context";
import { getInitials } from "@/lib/settings-schema";
import { createBrowserClient } from "@/lib/supabase/client";

export function UserMenu() {
  const router = useRouter();
  const { settings } = useUserSettings();

  async function handleLogout() {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Sign out failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-none text-foreground">
          {settings.complianceOfficerName || settings.email || "User"}
        </p>
        <p className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
          {settings.email || "Compliance Officer"}
        </p>
      </div>
      <Avatar>
        <AvatarFallback>
          {getInitials(settings.complianceOfficerName || settings.email || "User")}
        </AvatarFallback>
      </Avatar>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void handleLogout()}
        aria-label="Sign out"
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </Button>
    </div>
  );
}
