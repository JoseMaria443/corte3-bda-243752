import { z } from "zod";

export const vetIdSchema = z.coerce.number().int().positive();

export const aplicarVacunaSchema = z.object({
  mascotaId: z.number().int().positive(),
  vacunaId: z.number().int().positive(),
  costoCobrado: z.number().nonnegative()
});
