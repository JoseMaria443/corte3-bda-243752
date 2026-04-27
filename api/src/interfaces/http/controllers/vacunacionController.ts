import type { Request, Response } from "express";
import { performance } from "node:perf_hooks";
import { GetVacunacionPendienteUseCase } from "../../../application/use-cases/GetVacunacionPendienteUseCase.js";
import { AplicarVacunaUseCase } from "../../../application/use-cases/AplicarVacunaUseCase.js";
import { logError, logInfo } from "../../../shared/logger.js";
import { aplicarVacunaSchema, vetIdSchema } from "../schemas.js";

export class VacunacionController {
  constructor(
    private readonly getVacunacionPendienteUseCase: GetVacunacionPendienteUseCase,
    private readonly aplicarVacunaUseCase: AplicarVacunaUseCase
  ) {}

  getPendientes = async (req: Request, res: Response): Promise<void> => {
    const start = performance.now();

    const parsedVetId = vetIdSchema.safeParse(req.header("x-vet-id"));
    if (!parsedVetId.success) {
      res.status(400).json({ error: "x-vet-id es obligatorio y debe ser entero positivo" });
      return;
    }

    try {
      const result = await this.getVacunacionPendienteUseCase.execute(parsedVetId.data);
      const elapsedMs = (performance.now() - start).toFixed(2);

      if (result.source === "cache") {
        logInfo(`[CACHE HIT] key=view:v_mascotas_vacunacion_pendiente:vet:${parsedVetId.data} latency_ms=${elapsedMs}`);
      } else {
        logInfo(`[CACHE MISS] key=view:v_mascotas_vacunacion_pendiente:vet:${parsedVetId.data} latency_ms=${elapsedMs}`);
      }

      res.status(200).json(result.data);
    } catch (error) {
      logError("[VACUNAS] Error en GET pendientes", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };

  aplicarVacuna = async (req: Request, res: Response): Promise<void> => {
    const start = performance.now();

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
        veterinarioId: parsedVetId.data
      });

      const elapsedMs = (performance.now() - start).toFixed(2);
      logInfo(`[CACHE INVALIDATE] key=view:v_mascotas_vacunacion_pendiente:vet:${parsedVetId.data} latency_ms=${elapsedMs}`);

      res.status(201).json({ id, message: "Vacuna aplicada y cache invalidado" });
    } catch (error) {
      logError("[VACUNAS] Error en POST aplicar vacuna", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}
