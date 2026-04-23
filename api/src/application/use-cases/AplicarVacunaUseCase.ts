import type { AplicarVacunaInput } from "../../domain/entities.js";
import type { CachePort } from "../../domain/ports/CachePort.js";
import type { VacunacionRepository } from "../../domain/ports/VacunacionRepository.js";
import { CACHE_KEYS } from "../../shared/constants.js";

export class AplicarVacunaUseCase {
  constructor(
    private readonly repository: VacunacionRepository,
    private readonly cache: CachePort
  ) {}

  async execute(input: AplicarVacunaInput): Promise<number> {
    const newId = await this.repository.aplicarVacuna(input);

    const cacheOwner = input.veterinarioId ?? input.role;
    const cacheKey = `${CACHE_KEYS.VACUNACION_PENDIENTE}:owner:${cacheOwner}`;
    await this.cache.del(cacheKey);

    return newId;
  }
}
