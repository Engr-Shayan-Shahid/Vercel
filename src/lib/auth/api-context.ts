import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AccountType, OrgType } from "@/types/shipment-request";
import { isAccountType, isOrgType } from "@/types/shipment-request";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type MembershipContextRow = {
  organization_id: string;
  organizations: OrganizationRow | null;
  profiles: Pick<ProfileRow, "account_type" | "email">;
};

export interface ApiContext {
  supabase: SupabaseClient<Database>;
  user: User;
  organizationId: string;
  organization: OrganizationRow;
  accountType: AccountType;
  orgType: OrgType;
}

export type ApiContextResult =
  | { ok: true; context: ApiContext }
  | { ok: false; response: NextResponse };

function resolveAccountType(
  profile: Pick<ProfileRow, "account_type"> | null,
  organization: OrganizationRow
): AccountType {
  if (profile?.account_type && isAccountType(profile.account_type)) {
    return profile.account_type;
  }
  if (organization.org_type && isOrgType(organization.org_type)) {
    return organization.org_type;
  }
  return "importer";
}

function resolveOrgType(organization: OrganizationRow): OrgType {
  if (organization.org_type && isOrgType(organization.org_type)) {
    return organization.org_type;
  }
  return "importer";
}

export async function getApiContext(): Promise<ApiContextResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 503 }
      ),
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Failed to create Supabase client." }, { status: 503 }),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data: membershipRow, error: membershipError } = await supabase
    .from("organization_members")
    .select(
      `
      organization_id,
      organizations (*),
      profiles!inner (account_type, email)
    `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return {
      ok: false,
      response: NextResponse.json({ error: membershipError.message }, { status: 500 }),
    };
  }

  const membership = membershipRow as MembershipContextRow | null;

  if (!membership?.organization_id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "No organization found for this account. Please sign up again or contact support.",
        },
        { status: 403 }
      ),
    };
  }

  const organization = membership.organizations;

  if (!organization) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Organization not found." }, { status: 404 }),
    };
  }

  const profile = membership.profiles;
  const orgType = resolveOrgType(organization);
  const accountType = resolveAccountType(profile, organization);

  return {
    ok: true,
    context: {
      supabase,
      user,
      organizationId: membership.organization_id,
      organization,
      accountType,
      orgType,
    },
  };
}

export async function requireImporterContext(): Promise<ApiContextResult> {
  const result = await getApiContext();
  if (!result.ok) return result;

  if (result.context.orgType !== "importer") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This action requires an importer account." },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireExporterContext(): Promise<ApiContextResult> {
  const result = await getApiContext();
  if (!result.ok) return result;

  if (result.context.orgType !== "exporter") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This action requires an exporter account." },
        { status: 403 }
      ),
    };
  }

  return result;
}
