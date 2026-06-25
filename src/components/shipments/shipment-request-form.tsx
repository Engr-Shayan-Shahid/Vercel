"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MATERIAL_TYPES, ORIGIN_COUNTRIES } from "@/types/import-record";
import type { ShipmentRequest } from "@/types/shipment-request";

interface FormState {
  materialType: string;
  mass: string;
  originCountry: string;
  exporterEmail: string;
  cnCode: string;
  referenceNumber: string;
  notes: string;
}

interface FormErrors {
  materialType?: string;
  mass?: string;
  originCountry?: string;
  exporterEmail?: string;
}

const EMPTY_FORM: FormState = {
  materialType: "",
  mass: "",
  originCountry: "",
  exporterEmail: "",
  cnCode: "",
  referenceNumber: "",
  notes: "",
};

interface ShipmentRequestFormProps {
  onCreated: (request: ShipmentRequest) => void;
}

export function ShipmentRequestForm({ onCreated }: ShipmentRequestFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof FormErrors];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!form.materialType) newErrors.materialType = "Material type is required.";
    if (!form.mass.trim()) {
      newErrors.mass = "Mass is required.";
    } else if (Number.isNaN(Number(form.mass)) || Number(form.mass) <= 0) {
      newErrors.mass = "Mass must be a positive number.";
    }
    if (!form.originCountry) newErrors.originCountry = "Origin country is required.";
    if (!form.exporterEmail.trim()) {
      newErrors.exporterEmail = "Exporter email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.exporterEmail)) {
      newErrors.exporterEmail = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setInviteLink(null);

    try {
      const response = await fetch("/api/shipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialType: form.materialType,
          mass: Number(form.mass),
          originCountry: form.originCountry,
          exporterEmail: form.exporterEmail.trim().toLowerCase(),
          cnCode: form.cnCode.trim() || undefined,
          referenceNumber: form.referenceNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        toast.error("Failed to create request", {
          description: json.error ?? "Please try again.",
        });
        return;
      }

      onCreated(json.request as ShipmentRequest);
      setForm(EMPTY_FORM);
      setErrors({});

      if (json.emailSent) {
        if (json.devRedirected) {
          toast.success("Invitation sent (dev mode)", {
            description: `Sandbox delivered to ${json.deliveredTo as string}. Intended for ${json.intendedRecipient as string}.`,
            duration: 10000,
          });
        } else {
          toast.success("Invitation sent", {
            description: `An invite email has been sent to ${form.exporterEmail.trim()}.`,
          });
        }
      } else {
        toast.warning("Request created — copy invite link", {
          description: (json.emailError as string | undefined) ?? "Email could not be sent. Share the link manually.",
          duration: 10000,
        });
        setInviteLink(json.inviteLink as string);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border/80 bg-charcoal/40">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal text-foreground">
          New Shipment Request
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Invite an exporter to submit embedded emission data for a CBAM-covered shipment.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FieldGroup label="Material Type" error={errors.materialType} htmlFor="materialType">
              <Select
                value={form.materialType || undefined}
                onValueChange={(v) => updateField("materialType", v)}
                disabled={isLoading}
              >
                <SelectTrigger id="materialType" aria-invalid={!!errors.materialType}>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Origin Country" error={errors.originCountry} htmlFor="originCountry">
              <Select
                value={form.originCountry || undefined}
                onValueChange={(v) => updateField("originCountry", v)}
                disabled={isLoading}
              >
                <SelectTrigger id="originCountry" aria-invalid={!!errors.originCountry}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>

            <FieldGroup label="Mass (Tonnes)" error={errors.mass} htmlFor="mass">
              <Input
                id="mass"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 320"
                value={form.mass}
                onChange={(e) => updateField("mass", e.target.value)}
                aria-invalid={!!errors.mass}
                disabled={isLoading}
                className={cn(errors.mass && "border-destructive/50 focus-visible:ring-destructive/50")}
              />
            </FieldGroup>

            <FieldGroup
              label="Exporter Email"
              error={errors.exporterEmail}
              htmlFor="exporterEmail"
            >
              <Input
                id="exporterEmail"
                type="email"
                placeholder="supplier@company.com"
                value={form.exporterEmail}
                onChange={(e) => updateField("exporterEmail", e.target.value)}
                aria-invalid={!!errors.exporterEmail}
                disabled={isLoading}
                className={cn(
                  errors.exporterEmail && "border-destructive/50 focus-visible:ring-destructive/50"
                )}
              />
            </FieldGroup>

            <FieldGroup label="CN Code (optional)" htmlFor="cnCode">
              <Input
                id="cnCode"
                placeholder="e.g. 7207"
                value={form.cnCode}
                onChange={(e) => updateField("cnCode", e.target.value)}
                disabled={isLoading}
              />
            </FieldGroup>

            <FieldGroup label="Reference Number (optional)" htmlFor="referenceNumber">
              <Input
                id="referenceNumber"
                placeholder="e.g. PO-2026-001"
                value={form.referenceNumber}
                onChange={(e) => updateField("referenceNumber", e.target.value)}
                disabled={isLoading}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Notes (optional)" htmlFor="notes">
            <Input
              id="notes"
              placeholder="Any additional context for the exporter"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              disabled={isLoading}
            />
          </FieldGroup>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <Button type="submit" disabled={isLoading} className="min-w-[180px]">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>

        {inviteLink && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="mb-2 text-sm font-medium text-amber-400">
              Email delivery failed — share this link manually
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              With <code className="text-amber-300/90">onboarding@resend.dev</code>, Resend only
              delivers to your account email in dev. Set{" "}
              <code className="text-amber-300/90">RESEND_DEV_INBOX</code> in{" "}
              <code className="text-amber-300/90">.env.local</code>, or verify a custom domain for
              production.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-black/30 px-3 py-2 text-xs text-muted-foreground">
                {inviteLink}
              </code>
              <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FieldGroup({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
