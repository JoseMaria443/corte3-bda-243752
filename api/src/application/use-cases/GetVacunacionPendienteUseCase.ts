import type { AppRole, VacunacionPendiente } from "../../domain/entities.js";
import type { CachePort } from "../../domain/ports/CachePort.js";
import type { VacunacionRepository } from "../../domain/ports/VacunacionRepository.js";
import { CACHE_KEYS, CACHE_TTL_SECONDS } from "../../shared/constants.js";

export class GetVacunacionPendienteUseCase {
  constructor(
    private readonly repository: VacunacionRepository,
    private readonly cache: CachePort
  ) {}

  async execute(
    veterinarioId: number | null,
    role: AppRole
  ): Promise<{ source: "cache" | "db"; data: VacunacionPendiente[] }> {
    const cacheOwner = veterinarioId ?? role;
    const cacheKey = `${CACHE_KEYS.VACUNACION_PENDIENTE}:owner:${cacheOwner}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return { source: "cache", data: JSON.parse(cached) as VacunacionPendiente[] };
    }

    const data = await this.repository.getVacunacionPendiente(veterinarioId, role);
    await this.cache.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));

    return { source: "db", data };
  }
}
