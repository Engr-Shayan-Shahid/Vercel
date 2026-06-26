"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Building2, Factory } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { getDefaultHomePath, clearRoleCookieClient, type AccountType } from "@/lib/auth/account-type";

interface AuthFormProps {
  mode: "login" | "signup";
}

const ROLE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.ElementType; tagline: string; signupTagline: string }
> = {
  importer: {
    label: "Importer",
    icon: Building2,
    tagline: "Access your CBAM compliance dashboard.",
    signupTagline: "Track imports, calculate embedded emissions, and generate quarterly reports.",
  },
  exporter: {
    label: "Exporter",
    icon: Factory,
    tagline: "Access your emission submissions portal.",
    signupTagline: "Submit emission data and respond to importer requests with ease.",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? null;
  const roleParam = searchParams.get("role");
  const teamInvite = searchParams.get("team_invite");
  const emailParam = searchParams.get("email") ?? "";

  const [accountType, setAccountType] = useState<AccountType>(
    roleParam === "exporter" ? "exporter" : "importer"
  );
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const isLogin = mode === "login";
  const config = ROLE_CONFIG[accountType];

  useEffect(() => {
    if (teamInvite) {
      setAccountType("importer");
      if (!isLogin) {
        toast.info("Team invitation", {
          description: "Create your account to join your organization's workspace.",
        });
      }
    }
  }, [teamInvite, isLogin]);

  useEffect(() => {
    if (!forgotPasswordSent) return;

    const timer = window.setTimeout(() => {
      setForgotPasswordSent(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [forgotPasswordSent]);

  function buildToggleHref(targetMode: "login" | "signup") {
    const base = targetMode === "login" ? "/login" : "/signup";
    const params = new URLSearchParams();
    params.set("role", accountType);
    if (redirect && redirect !== "/") params.set("redirect", redirect);
    if (teamInvite) params.set("team_invite", teamInvite);
    return `${base}?${params.toString()}`;
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Enter your email address first.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setForgotPasswordSent(true);
      toast.success("Password reset email sent — check your inbox");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email.");
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createBrowserClient();

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Verify the account_type matches the selected role
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("user_id", data.user.id)
          .maybeSingle();

        const storedRole = (profileRow as { account_type?: string } | null)?.account_type;

        if (storedRole && storedRole !== accountType) {
          await supabase.auth.signOut();
          clearRoleCookieClient();
          toast.error("Wrong account type selected", {
            description: `This account is registered as ${storedRole === "exporter" ? "an Exporter" : "an Importer"}. Please select the correct role.`,
          });
          return;
        }

        toast.success("Signed in successfully.");
        const homePath = getDefaultHomePath((storedRole as AccountType) ?? accountType);
        // Respect invite redirects for exporters; other redirect rules unchanged
        const isInviteRedirect = redirect?.startsWith("/invite/");
        const destination =
          isInviteRedirect
            ? redirect!
            : accountType === "importer" && redirect && !redirect.startsWith("/exporter")
              ? redirect
              : homePath;
        router.push(destination);
        router.refresh();
        return;
      }

      // Signup
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim() || undefined,
            account_type: accountType,
          },
        },
      });

      if (error) throw error;

      // Email confirmation enabled — session won't exist until user clicks the link
      if (!signUpData.session) {
        toast.success("Check your email", {
          description: "We sent a confirmation link. Click it to activate your account.",
        });
        return;
      }

      toast.success("Account created.", {
        description:
          accountType === "exporter"
            ? "Your Exporter portal is ready."
            : "Your organization workspace is ready.",
      });
      const isInviteRedirect = redirect?.startsWith("/invite/");
      router.push(isInviteRedirect ? redirect! : getDefaultHomePath(accountType));
      router.refresh();
    } catch (error) {
      toast.error(isLogin ? "Sign in failed" : "Sign up failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 bg-charcoal/40">
      <CardHeader className="space-y-4 pb-4">
        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1 ring-1 ring-border/50">
          {(["importer", "exporter"] as const).map((role) => {
            const rc = ROLE_CONFIG[role];
            const RoleIcon = rc.icon;
            const isActive = accountType === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setAccountType(role)}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <RoleIcon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                {isLogin ? `Sign in as ${rc.label}` : rc.label}
              </button>
            );
          })}
        </div>

        <div>
          <CardTitle className="normal-case tracking-normal text-foreground">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </CardTitle>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLogin ? config.tagline : config.signupTagline}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              disabled={isLoading}
              readOnly={!isLogin && !!emailParam}
              className={!isLogin && emailParam ? "bg-muted/30 cursor-default" : undefined}
            />
            {!isLogin && emailParam && (
              <p className="text-xs text-muted-foreground">
                Pre-filled from your invitation — this email must match.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {forgotPasswordSent ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                A password reset link was sent to{" "}
                <span className="font-medium text-foreground">{email.trim()}</span>. Check your
                inbox.
              </div>
            ) : (
              <>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={isLoading}
                />
                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleForgotPassword()}
                      disabled={isLoading || isResettingPassword}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      {isResettingPassword ? "Sending…" : "Forgot password?"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || forgotPasswordSent}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait…
              </>
            ) : isLogin ? (
              `Sign in as ${config.label}`
            ) : (
              `Create ${config.label} account`
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={buildToggleHref(isLogin ? "signup" : "login")}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
