import type { AplicarVacunaInput, VacunacionPendiente } from "../entities.js";

export interface VacunacionRepository {
  getVacunacionPendiente(veterinarioId: number): Promise<VacunacionPendiente[]>;
  aplicarVacuna(input: AplicarVacunaInput): Promise<number>;
}
