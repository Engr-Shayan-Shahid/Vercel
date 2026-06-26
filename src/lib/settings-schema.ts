import { z } from "zod";

import type { AccountType, OrgType } from "@/types/shipment-request";

export const EORI_REGEX = /^[A-Za-z0-9]{17}$/;

export const profileSettingsSchema = z.object({
  complianceOfficerName: z
    .string()
    .trim()
    .min(1, "Compliance officer name is required.")
    .max(120, "Name must be 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
});

export const organizationSettingsSchema = z.object({
  companyLegalName: z
    .string()
    .trim()
    .min(1, "Company legal name is required.")
    .max(200, "Company name must be 200 characters or fewer."),
  eoriNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(EORI_REGEX, "EORI number must be exactly 17 alphanumeric characters."),
  vatTaxId: z
    .string()
    .trim()
    .min(1, "VAT/Tax ID is required.")
    .max(50, "VAT/Tax ID must be 50 characters or fewer."),
});

export const companyProfileSchema = organizationSettingsSchema.extend({
  registeredCountry: z.string().trim().min(1, "Registered country is required."),
  contactEmail: z
    .string()
    .trim()
    .min(1, "Contact email is required.")
    .email("Enter a valid email address."),
});

export const complianceSettingsSchema = z
  .object({
    etsPriceOverride: z
      .string()
      .refine(
        (val) => val === "" || (!Number.isNaN(Number(val)) && Number(val) > 0),
        "ETS price must be greater than zero."
      ),
    defaultCalculationMethod: z.enum(["actual", "default_fallback"]),
    reportingPeriodMode: z.enum(["auto", "manual"]),
    reportingYear: z.number().int().min(2020).max(2040).optional(),
    reportingQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.reportingPeriodMode === "manual") {
      if (!values.reportingYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reporting year is required when using manual period selection.",
          path: ["reportingYear"],
        });
      }
      if (!values.reportingQuarter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reporting quarter is required when using manual period selection.",
          path: ["reportingQuarter"],
        });
      }
    }
  });

export const notificationSettingsSchema = z.object({
  newEuRegulationAlerts: z.boolean(),
  quarterlyReportReminders: z.boolean(),
  securityAlerts: z.boolean(),
});

export const userSettingsSchema = profileSettingsSchema
  .merge(organizationSettingsSchema)
  .merge(notificationSettingsSchema);

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;
export type OrganizationSettingsValues = z.infer<typeof organizationSettingsSchema>;
export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;
export type ComplianceSettingsValues = z.infer<typeof complianceSettingsSchema>;
export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema> & {
  id?: string;
  userId?: string;
  organizationId?: string;
  accountType?: AccountType;
  orgType?: OrgType;
  updatedAt?: string;
  onboardingCompleted?: boolean;
  primaryCommodity?: string | null;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  complianceOfficerName: "",
  email: "",
  companyLegalName: "",
  eoriNumber: "",
  vatTaxId: "",
  newEuRegulationAlerts: true,
  quarterlyReportReminders: true,
  securityAlerts: true,
};

export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CO"
  );
}

export function getCurrentQuarter(): { year: number; quarter: "Q1" | "Q2" | "Q3" | "Q4" } {
  const now = new Date();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const quarter = (["Q1", "Q2", "Q3", "Q4"] as const)[Math.floor(month / 3)];
  return { year, quarter };
}

export function getNextFilingDeadline(year: number, quarter: "Q1" | "Q2" | "Q3" | "Q4"): Date {
  const deadlines: Record<typeof quarter, [number, number]> = {
    Q1: [4, 30],
    Q2: [7, 31],
    Q3: [10, 31],
    Q4: [1, 31],
  };
  const [month, day] = deadlines[quarter];
  const deadlineYear = quarter === "Q4" ? year + 1 : year;
  return new Date(Date.UTC(deadlineYear, month - 1, day));
}
