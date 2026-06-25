import { z } from "zod";

import { MATERIAL_TYPES, ORIGIN_COUNTRIES } from "@/types/import-record";

export const createShipmentRequestSchema = z.object({
  materialType: z.enum(MATERIAL_TYPES, {
    error: "Please select a valid material type.",
  }),
  mass: z.number({ error: "Mass must be a positive number." }).positive("Mass must be greater than zero."),
  originCountry: z.enum(ORIGIN_COUNTRIES, {
    error: "Please select a valid origin country.",
  }),
  exporterEmail: z
    .string()
    .email("Please enter a valid email address.")
    .transform((v) => v.toLowerCase().trim()),
  cnCode: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateShipmentRequestInput = z.infer<typeof createShipmentRequestSchema>;
