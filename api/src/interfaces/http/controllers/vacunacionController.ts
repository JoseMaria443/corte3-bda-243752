import type { Request, Response } from "express";
import { performance } from "node:perf_hooks";
import { GetVacunacionPendienteUseCase } from "../../../application/use-cases/GetVacunacionPendienteUseCase.js";
import { AplicarVacunaUseCase } from "../../../application/use-cases/AplicarVacunaUseCase.js";
import { BuscarMascotasUseCase } from "../../../application/use-cases/BuscarMascotasUseCase.js";
import { logError, logInfo } from "../../../shared/logger.js";
import { aplicarVacunaSchema, roleSchema, searchQuerySchema, vetIdSchema } from "../schemas.js";

export class VacunacionController {
  constructor(
    private readonly getVacunacionPendienteUseCase: GetVacunacionPendienteUseCase,
    private readonly aplicarVacunaUseCase: AplicarVacunaUseCase,
    private readonly buscarMascotasUseCase: BuscarMascotasUseCase
  ) {}

  getPendientes = async (req: Request, res: Response): Promise<void> => {
    const start = performance.now();
    const parsedRole = roleSchema.safeParse(req.header("x-rol"));
    if (!parsedRole.success) {
      res.status(400).json({ error: "x-rol es obligatorio y debe ser un rol valido" });
      return;
    }

    let vetId: number | null = null;
    if (parsedRole.data === "rol_veterinario") {
      const parsedVetId = vetIdSchema.safeParse(req.header("x-vet-id"));
      if (!parsedVetId.success) {
        res.status(400).json({ error: "x-vet-id es obligatorio y debe ser entero positivo" });
        return;
      }
      vetId = parsedVetId.data;
    }

    try {
      const result = await this.getVacunacionPendienteUseCase.execute(vetId, parsedRole.data);
      const elapsedMs = (performance.now() - start).toFixed(2);

      if (result.source === "cache") {
        logInfo(`[CACHE HIT] owner=${vetId ?? parsedRole.data} latency_ms=${elapsedMs}`);
      } else {
        logInfo(`[CACHE MISS] owner=${vetId ?? parsedRole.data} latency_ms=${elapsedMs}`);
      }

      res.status(200).json(result.data);
    } catch (error) {
      logError("[VACUNAS] Error en GET pendientes", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };

  buscarMascotas = async (req: Request, res: Response): Promise<void> => {
    const start = performance.now();

    const parsedRole = roleSchema.safeParse(req.header("x-rol"));
    if (!parsedRole.success) {
      res.status(400).json({ error: "x-rol es obligatorio y debe ser un rol valido" });
      return;
    }

    let vetId: number | null = null;
    if (parsedRole.data === "rol_veterinario") {
      const parsedVetId = vetIdSchema.safeParse(req.header("x-vet-id"));
      if (!parsedVetId.success) {
        res.status(400).json({ error: "x-vet-id es obligatorio y debe ser entero positivo" });
        return;
      }
      vetId = parsedVetId.data;
    }

    const rawQ = String(req.query.q ?? "");
    const parsedQ = searchQuerySchema.safeParse(rawQ);
    if (!parsedQ.success) {
      res.status(400).json({ error: "Parametro q invalido" });
      return;
    }

    try {
      const data = await this.buscarMascotasUseCase.execute(parsedQ.data, vetId, parsedRole.data);
      const elapsedMs = (performance.now() - start).toFixed(2);
      logInfo(`[SEARCH] role=${parsedRole.data} q_length=${parsedQ.data.length} latency_ms=${elapsedMs}`);
      res.status(200).json(data);
    } catch (error) {
      logError("[MASCOTAS] Error en GET buscar", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };

  aplicarVacuna = async (req: Request, res: Response): Promise<void> => {
    const start = performance.now();
    const parsedRole = roleSchema.safeParse(req.header("x-rol"));
    if (!parsedRole.success) {
      res.status(400).json({ error: "x-rol es obligatorio y debe ser un rol valido" });
      return;
    }

    const parsedVetId = vetIdSchema.safeParse(req.header("x-vet-id"));
    if (!parsedVetId.success) {
      res.status(400).json({ error: "x-vet-id es obligatorio y debe ser entero positivo" });
      return;
    }

    const parsedBody = aplicarVacunaSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: "Body invalido", details: parsedBody.error.flatten() });
      return;
    }

    try {
      const id = await this.aplicarVacunaUseCase.execute({
        mascotaId: parsedBody.data.mascotaId,
        vacunaId: parsedBody.data.vacunaId,
        costoCobrado: parsedBody.data.costoCobrado,
        veterinarioId: parsedVetId.data,
        role: parsedRole.data
      });

      const elapsedMs = (performance.now() - start).toFixed(2);
      logInfo(`[CACHE INVALIDATE] owner=${parsedVetId.data} latency_ms=${elapsedMs}`);

      res.status(201).json({ id, message: "Vacuna aplicada y cache invalidado" });
    } catch (error) {
      logError("[VACUNAS] Error en POST aplicar vacuna", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}
