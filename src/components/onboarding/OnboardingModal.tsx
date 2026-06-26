"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Euro,
  Info,
  Leaf,
  Loader2,
  Mail,
  Package,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { useImports } from "@/context/imports-context";
import { useUserSettings } from "@/context/user-settings-context";
import { saveOnboardingOrgSetup } from "@/lib/supabase-client";
import { MATERIAL_BENCHMARKS, DEFAULT_ETS_PRICE, CBAM_FACTOR, CBAM_BENCHMARK_ALLOWANCE_FACTOR } from "@/lib/cbam-constants";
import { getCnCodesForMaterial } from "@/lib/cn-codes";
import { formatTaxLiability, formatEmbeddedEmissions } from "@/lib/calculate-tax-liability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MATERIAL_TYPES, ORIGIN_COUNTRIES, type MaterialType } from "@/types/import-record";

const PRIMARY_COMMODITIES = [...MATERIAL_TYPES, "Multiple"] as const;
type PrimaryCommodity = (typeof PRIMARY_COMMODITIES)[number];

// ─── Step state types ───────────────────────────────────────────────────────

interface Step2State {
  companyName: string;
  eoriNumber: string;
  primaryCommodity: PrimaryCommodity | "";
}

interface Step3State {
  materialType: MaterialType | "";
  mass: string;
  originCountry: string;
  importDate: string;
}

interface CalcPreview {
  embeddedEmissions: number;
  liability: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computePreview(materialType: MaterialType, mass: number): CalcPreview {
  const emissionFactor = MATERIAL_BENCHMARKS[materialType];
  const embeddedEmissions = mass * emissionFactor;
  const taxableEmissions = embeddedEmissions * CBAM_BENCHMARK_ALLOWANCE_FACTOR;
  const liability = taxableEmissions * DEFAULT_ETS_PRICE * CBAM_FACTOR;
  return { embeddedEmissions, liability };
}

function fireConfetti() {
  const count = 220;
  const defaults = { origin: { y: 0.6 }, zIndex: 9999 };

  function fire(particleRatio: number, opts: confetti.Options) {
    void confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#10b981", "#34d399"] });
  fire(0.2, { spread: 60, colors: ["#6366f1", "#818cf8"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#fbbf24", "#f59e0b"] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i + 1 < current
              ? "w-2 bg-primary"
              : i + 1 === current
                ? "w-6 bg-primary"
                : "w-2 bg-muted/40"
          )}
        />
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onDismiss: () => void;
}

export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const { settings, completeOnboarding } = useUserSettings();
  const { addImport } = useImports();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 state
  const [step2, setStep2] = useState<Step2State>({
    companyName: settings.companyLegalName ?? "",
    eoriNumber: settings.eoriNumber ?? "",
    primaryCommodity: "",
  });

  // Step 3 state
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step3, setStep3] = useState<Step3State>({
    materialType: "",
    mass: "",
    originCountry: "",
    importDate: new Date().toISOString().split("T")[0],
  });
  const [preview, setPreview] = useState<CalcPreview | null>(null);

  // Step 4 state
  const [supplierEmail, setSupplierEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Pre-select material type from step 2 choice
  useEffect(() => {
    if (step === 3 && step2.primaryCommodity && step2.primaryCommodity !== "Multiple") {
      setStep3((prev) => ({ ...prev, materialType: step2.primaryCommodity as MaterialType }));
    }
  }, [step, step2.primaryCommodity]);

  // Live preview computation
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);

    const { materialType, mass } = step3;
    const massNum = parseFloat(mass);

    if (!materialType || !massNum || massNum <= 0) {
      setPreview(null);
      return;
    }

    previewTimerRef.current = setTimeout(() => {
      setPreview(computePreview(materialType as MaterialType, massNum));
    }, 300);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [step3.materialType, step3.mass]);

  // ── Step handlers ──────────────────────────────────────────────────────────

  const handleStep2Next = useCallback(async () => {
    if (!step2.companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const orgId = settings.organizationId;
      if (orgId) {
        // Save directly — do NOT call refreshSettings() here because it flips
        // isLoading in the context, which would remount the modal from step 1.
        await saveOnboardingOrgSetup(orgId, {
          companyLegalName: step2.companyName.trim(),
          eoriNumber: step2.eoriNumber.trim() || (settings.eoriNumber ?? ""),
          primaryCommodity: step2.primaryCommodity || "Multiple",
        });
      }
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save company details.");
    } finally {
      setIsSubmitting(false);
    }
  }, [step2, settings.organizationId, settings.eoriNumber]);

  const handleStep3Submit = useCallback(async () => {
    if (!step3.materialType || !step3.mass || !step3.originCountry || !step3.importDate) {
      setError("Please fill in all fields.");
      return;
    }
    const massNum = parseFloat(step3.mass);
    if (isNaN(massNum) || massNum <= 0) {
      setError("Mass must be a positive number.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const materialType = step3.materialType as MaterialType;
      const emissionFactor = MATERIAL_BENCHMARKS[materialType];
      const cnCodes = getCnCodesForMaterial(materialType);
      const cnCode = cnCodes[0]?.code ?? "";

      const result = await addImport({
        materialType,
        cnCode,
        mass: step3.mass,
        originCountry: step3.originCountry,
        importDate: step3.importDate,
        emissionFactor: String(emissionFactor),
        foreignPrice: "0",
        proofOfPayment: null,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Failed to add import.");
      }
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add import.");
    } finally {
      setIsSubmitting(false);
    }
  }, [step3, addImport]);

  const handleStep4Invite = useCallback(async () => {
    if (!supplierEmail.trim() || !supplierEmail.includes("@")) {
      setInviteError("Enter a valid email address.");
      return;
    }
    setInviteError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shipment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exporterEmail: supplierEmail.trim(),
          materialType: step3.materialType || "Steel",
          mass: parseFloat(step3.mass) || 100,
          originCountry: step3.originCountry || "China",
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to send invite.");
      }
      setInviteSent(true);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite.");
    } finally {
      setIsSubmitting(false);
    }
  }, [supplierEmail, step3]);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      fireConfetti();
      onDismiss();
    } catch {
      // Non-fatal — dismiss anyway
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  }, [completeOnboarding, onDismiss]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-border/60 bg-[#0e1117] shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <ProgressDots current={step} total={4} />
          <span className="text-xs text-muted-foreground">Step {step} of 4</span>
        </div>

        {/* Step content */}
        <div className="px-6 py-8">
          {step === 1 && <Step1 onNext={() => setStep(2)} />}
          {step === 2 && (
            <Step2
              state={step2}
              onChange={setStep2}
              onNext={handleStep2Next}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
          {step === 3 && (
            <Step3
              state={step3}
              onChange={setStep3}
              preview={preview}
              onSubmit={handleStep3Submit}
              onSkip={() => setStep(4)}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
          {step === 4 && (
            <Step4
              email={supplierEmail}
              onEmailChange={setSupplierEmail}
              onInvite={handleStep4Invite}
              onFinish={handleFinish}
              inviteSent={inviteSent}
              inviteError={inviteError}
              isSubmitting={isSubmitting}
              importMaterialType={step3.materialType || "your goods"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to CBAMVault
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Let&apos;s get you set up in 3 minutes
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-muted/10 p-5 text-left space-y-3">
        <FeatureRow icon={Leaf} text="The EU Carbon Border Adjustment Mechanism (CBAM) requires importers to declare and pay for the embedded carbon in goods imported from non-EU countries." />
        <FeatureRow icon={Package} text="CBAMVault tracks every import, calculates your CBAM liability in real time, and generates the declarations you need to file each quarter." />
        <FeatureRow icon={Euro} text="Getting verified emission data from your suppliers (instead of EU defaults) can reduce your liability by up to 40%." />
      </div>

      <Button onClick={onNext} size="lg" className="w-full gap-2">
        Get Started <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FeatureRow({ icon: Icon, text }: { icon: typeof Leaf; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-3 w-3 text-primary" />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

// ─── Step 2: Company Setup ────────────────────────────────────────────────────

function Step2({
  state,
  onChange,
  onNext,
  isSubmitting,
  error,
}: {
  state: Step2State;
  onChange: (s: Step2State) => void;
  onNext: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Company Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your company details for CBAM compliance records.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ob-company">Company legal name</Label>
          <Input
            id="ob-company"
            value={state.companyName}
            onChange={(e) => onChange({ ...state, companyName: e.target.value })}
            placeholder="Acme Steel GmbH"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="ob-eori">EORI number</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="What is an EORI number?">
                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-56">
                  <p className="text-xs">
                    Economic Operators Registration and Identification — a 17-character
                    alphanumeric code issued by EU customs authorities. Required for all CBAM
                    declarations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="ob-eori"
            value={state.eoriNumber}
            onChange={(e) => onChange({ ...state, eoriNumber: e.target.value.toUpperCase() })}
            placeholder="DE1234567890ABCDE"
            className="font-mono tracking-widest"
          />
          <p className="text-[11px] text-muted-foreground">
            17 alphanumeric characters — you can update this in Settings later.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-commodity">Primary commodity</Label>
          <Select
            value={state.primaryCommodity}
            onValueChange={(v) => onChange({ ...state, primaryCommodity: v as PrimaryCommodity })}
          >
            <SelectTrigger id="ob-commodity">
              <SelectValue placeholder="Select your main imported good" />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_COMMODITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={onNext} disabled={isSubmitting} size="lg" className="w-full gap-2">
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : (
          <>Save & Continue <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>
    </div>
  );
}

// ─── Step 3: First Import ─────────────────────────────────────────────────────

function Step3({
  state,
  onChange,
  preview,
  onSubmit,
  onSkip,
  isSubmitting,
  error,
}: {
  state: Step3State;
  onChange: (s: Step3State) => void;
  preview: CalcPreview | null;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const hasPreview = preview !== null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Add your first import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your most recent import to see your CBAM liability instantly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Material type</Label>
          <Select
            value={state.materialType}
            onValueChange={(v) => onChange({ ...state, materialType: v as MaterialType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-mass">Mass (tonnes)</Label>
          <Input
            id="ob-mass"
            type="number"
            min="0"
            step="0.01"
            value={state.mass}
            onChange={(e) => onChange({ ...state, mass: e.target.value })}
            placeholder="1000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ob-date">Import date</Label>
          <Input
            id="ob-date"
            type="date"
            value={state.importDate}
            onChange={(e) => onChange({ ...state, importDate: e.target.value })}
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Origin country</Label>
          <Select
            value={state.originCountry}
            onValueChange={(v) => onChange({ ...state, originCountry: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {ORIGIN_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Live liability preview */}
      <div
        className={cn(
          "overflow-hidden rounded-xl border transition-all duration-300",
          hasPreview
            ? "border-primary/25 bg-primary/5 p-4"
            : "border-border/30 bg-muted/10 p-4"
        )}
      >
        {hasPreview && preview ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated CBAM Liability
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatTaxLiability(preview.liability)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatEmbeddedEmissions(preview.embeddedEmissions)} embedded · using EU default factors
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Fill in the fields above to see your live CBAM liability estimate
          </p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1"
        >
          Skip for now
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !state.materialType || !state.mass || !state.originCountry}
          className="flex-1 gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
          ) : (
            <>Add Import <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Invite Supplier ──────────────────────────────────────────────────

function Step4({
  email,
  onEmailChange,
  onInvite,
  onFinish,
  inviteSent,
  inviteError,
  isSubmitting,
  importMaterialType,
}: {
  email: string;
  onEmailChange: (v: string) => void;
  onInvite: () => void;
  onFinish: () => void;
  inviteSent: boolean;
  inviteError: string | null;
  isSubmitting: boolean;
  importMaterialType: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Invite your first supplier
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get verified emissions data from your supplier — it could save you thousands vs default
          values.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
        <p className="text-xs leading-relaxed text-amber-300">
          <strong>Why does this matter?</strong> EU default emission factors are deliberately
          punitive. Verified supplier data for {importMaterialType} can reduce your embedded
          emissions by 20–40%, directly cutting your CBAM liability.
        </p>
      </div>

      {!inviteSent ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ob-supplier-email">Supplier email address</Label>
            <div className="flex gap-2">
              <Input
                id="ob-supplier-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="supplier@company.com"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void onInvite();
                }}
              />
              <Button
                onClick={() => void onInvite()}
                disabled={isSubmitting || !email.trim()}
                className="gap-2 shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-destructive">{inviteError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void onFinish()}
            disabled={isSubmitting}
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Skip — I&apos;ll do this later
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Invite sent!</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your supplier will receive an email with a secure link to submit their emission
                data.
              </p>
            </div>
          </div>

          <Button onClick={() => void onFinish()} className="w-full gap-2" size="lg">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Finish setup
          </Button>
        </div>
      )}

      {!inviteSent && (
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/10 px-3 py-2.5">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Your supplier receives a secure link — no account required for them to submit data.
          </p>
        </div>
      )}
    </div>
  );
}
