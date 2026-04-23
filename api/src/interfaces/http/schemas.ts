import { z } from "zod";

export const vetIdSchema = z.coerce.number().int().positive();
export const roleSchema = z.enum(["rol_veterinario", "rol_recepcion", "rol_admin"]);
export const searchQuerySchema = z
  .string()
  .trim()
  .min(0)
  .max(80);

export const aplicarVacunaSchema = z.object({
  mascotaId: z.number().int().positive(),
  vacunaId: z.number().int().positive(),
  costoCobrado: z.number().nonnegative()
});
