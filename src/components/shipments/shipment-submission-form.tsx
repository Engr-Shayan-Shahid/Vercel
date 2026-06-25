"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShipmentRequest } from "@/types/shipment-request";

interface ShipmentSubmissionFormProps {
  request: ShipmentRequest;
}

export function ShipmentSubmissionForm({ request }: ShipmentSubmissionFormProps) {
  const router = useRouter();
  const [emissionFactor, setEmissionFactor] = useState("");
  const [directEmissions, setDirectEmissions] = useState("");
  const [indirectEmissions, setIndirectEmissions] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const factor = Number(emissionFactor);

    if (!emissionFactor.trim()) {
      newErrors.emissionFactor = "Emission factor is required.";
    } else if (Number.isNaN(factor) || factor < 0) {
      newErrors.emissionFactor = "Emission factor must be zero or greater.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = {
        action: "submit",
        emissionFactor: factor,
      };

      if (directEmissions.trim()) {
        const de = Number(directEmissions);
        if (!Number.isNaN(de) && de >= 0) body.directEmissions = de;
      }
      if (indirectEmissions.trim()) {
        const ie = Number(indirectEmissions);
        if (!Number.isNaN(ie) && ie >= 0) body.indirectEmissions = ie;
      }
      if (submissionNotes.trim()) {
        body.submissionNotes = submissionNotes.trim();
      }

      const res = await fetch(`/api/shipment-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? "Submission failed.");
        return;
      }

      const { emailSent, emailError } = json as { emailSent?: boolean; emailError?: string };
      if (emailSent === false || emailError) {
        toast.warning(
          "Emission data submitted — but the notification email failed to send. The importer can still see your submission in the portal.",
          { duration: 6000 }
        );
      } else {
        toast.success("Emission data submitted — the importer has been notified.");
      }
      router.push("/exporter/requests");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Shipment summary */}
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">Shipment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Material", value: request.materialType },
              { label: "Mass", value: `${request.mass.toLocaleString()} tonnes` },
              { label: "Origin Country", value: request.originCountry },
              { label: "Exporter Email", value: request.exporterEmail },
              ...(request.cnCode ? [{ label: "CN Code", value: request.cnCode }] : []),
              ...(request.referenceNumber
                ? [{ label: "Reference", value: request.referenceNumber }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                <dd className="text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          {request.notes && (
            <div className="mt-4 rounded-lg border border-border/50 bg-black/20 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Notes from importer</p>
              <p className="mt-1 text-sm text-foreground">{request.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission form */}
      <Card className="border-border/80 bg-charcoal/40">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">Submit Emission Data</CardTitle>
          <p className="text-sm text-muted-foreground">
            Provide the embedded emission factor for this shipment. Direct and indirect breakdowns are optional.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="emissionFactor">
                Emission Factor <span className="text-destructive">*</span>
                <span className="ml-1 text-xs text-muted-foreground">(t CO₂e / tonne)</span>
              </Label>
              <Input
                id="emissionFactor"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 2.35"
                value={emissionFactor}
                onChange={(e) => setEmissionFactor(e.target.value)}
                disabled={isLoading}
                className={errors.emissionFactor ? "border-destructive" : ""}
              />
              {errors.emissionFactor && (
                <p className="text-xs text-destructive">{errors.emissionFactor}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="directEmissions">
                  Direct Emissions
                  <span className="ml-1 text-xs text-muted-foreground">(optional, t CO₂e)</span>
                </Label>
                <Input
                  id="directEmissions"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 1.80"
                  value={directEmissions}
                  onChange={(e) => setDirectEmissions(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="indirectEmissions">
                  Indirect Emissions
                  <span className="ml-1 text-xs text-muted-foreground">(optional, t CO₂e)</span>
                </Label>
                <Input
                  id="indirectEmissions"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.55"
                  value={indirectEmissions}
                  onChange={(e) => setIndirectEmissions(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submissionNotes">
                Notes
                <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="submissionNotes"
                rows={3}
                placeholder="Any relevant context about this emission data…"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                disabled={isLoading}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/exporter/requests")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Submitting…" : "Submit Emission Data"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
