import type { AppRole, MascotaBusqueda } from "../../domain/entities.js";
import type { VacunacionRepository } from "../../domain/ports/VacunacionRepository.js";

export class BuscarMascotasUseCase {
  constructor(private readonly repository: VacunacionRepository) {}

  async execute(query: string, veterinarioId: number | null, role: AppRole): Promise<MascotaBusqueda[]> {
    return this.repository.buscarMascotas(query, veterinarioId, role);
  }
}
