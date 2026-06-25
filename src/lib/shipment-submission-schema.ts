import { z } from "zod";

export const submitSchema = z.object({
  action: z.literal("submit"),
  emissionFactor: z
    .number({ error: "Emission factor is required." })
    .min(0, "Emission factor must be zero or greater."),
  directEmissions: z.number().min(0).optional(),
  indirectEmissions: z.number().min(0).optional(),
  submissionNotes: z.string().trim().optional(),
});

export const acceptSchema = z.object({
  action: z.literal("accept"),
});

export const rejectSchema = z.object({
  action: z.literal("reject"),
  reason: z.string().trim().optional(),
});

export const patchShipmentRequestSchema = z.discriminatedUnion("action", [
  submitSchema,
  acceptSchema,
  rejectSchema,
]);

export type SubmitAction = z.infer<typeof submitSchema>;
export type AcceptAction = z.infer<typeof acceptSchema>;
export type RejectAction = z.infer<typeof rejectSchema>;
export type PatchShipmentRequestInput = z.infer<typeof patchShipmentRequestSchema>;
