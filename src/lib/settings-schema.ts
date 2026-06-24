import { z } from "zod";

export const DEFAULT_USER_KEY = "default";

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
export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema> & {
  id?: string;
  userKey?: string;
  updatedAt?: string;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  complianceOfficerName: "Alex Morgan",
  email: "alex.morgan@example.com",
  companyLegalName: "",
  eoriNumber: "",
  vatTaxId: "",
  newEuRegulationAlerts: true,
  quarterlyReportReminders: true,
  securityAlerts: true,
};

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CO";
}
