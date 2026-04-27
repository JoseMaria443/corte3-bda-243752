export const CACHE_KEYS = {
  VACUNACION_PENDIENTE: "view:v_mascotas_vacunacion_pendiente"
} as const;

export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? "600");
