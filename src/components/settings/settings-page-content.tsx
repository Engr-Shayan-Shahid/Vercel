"use client";

import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { OrganizationSettingsForm } from "@/components/settings/organization-settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSettings } from "@/context/user-settings-context";

export function SettingsPageContent() {
  const { isLoading, source } = useUserSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          User Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your profile, organization identifiers, and notification preferences.
        </p>
        {source && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Data source:</span>
            <Badge variant="outline" className="capitalize">
              {source === "supabase" ? "Supabase" : "Local storage"}
            </Badge>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border/60 bg-charcoal/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Loading settings…
        </div>
      ) : (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettingsForm />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationSettingsForm />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettingsForm />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
