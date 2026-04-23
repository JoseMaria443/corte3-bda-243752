import type { AppRole, AplicarVacunaInput, MascotaBusqueda, VacunacionPendiente } from "../entities.js";

export interface VacunacionRepository {
  getVacunacionPendiente(veterinarioId: number | null, role: AppRole): Promise<VacunacionPendiente[]>;
  buscarMascotas(query: string, veterinarioId: number | null, role: AppRole): Promise<MascotaBusqueda[]>;
  aplicarVacuna(input: AplicarVacunaInput): Promise<number>;
}
