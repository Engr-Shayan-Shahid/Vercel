"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Shield, Users } from "lucide-react";

import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { ComplianceSettingsForm } from "@/components/settings/compliance-settings-form";
import { TeamMembersTab } from "@/components/settings/team-members-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrganizationSettings } from "@/lib/organization-store";

export function SettingsPageContent() {
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null);
  const [role, setRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/organization");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load settings.");
      setOrganization(data.organization);
      setRole(data.role ?? "member");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganization();
  }, [loadOrganization]);

  const canEdit = role === "owner";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your company profile, team access, and compliance calculation preferences.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="hidden h-4 w-4 sm:block" />
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="hidden h-4 w-4 sm:block" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="hidden h-4 w-4 sm:block" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6">
          {isLoading ? (
            <LoadingCard label="Loading company profile…" />
          ) : (
            <CompanyProfileForm
              organization={organization}
              isLoading={isLoading}
              canEdit={canEdit}
              onSaved={setOrganization}
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamMembersTab canManage={canEdit} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          {isLoading ? (
            <LoadingCard label="Loading compliance settings…" />
          ) : (
            <ComplianceSettingsForm
              organization={organization}
              isLoading={isLoading}
              canEdit={canEdit}
              onSaved={setOrganization}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-charcoal/40 px-6 py-12 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
