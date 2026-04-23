export interface VacunacionPendiente {
  mascota_id: number;
  nombre_mascota: string;
  especie: string;
  dueno_id: number;
  nombre_dueno: string;
  telefono_dueno: string | null;
  fecha_ultima_vacuna: string | null;
  dias_desde_ultima_vacuna: number | null;
  estado_vacunacion: "NUNCA_VACUNADA" | "VENCIDA";
}

export interface MascotaBusqueda {
  id: number;
  nombre: string;
  especie: string;
  fecha_nacimiento: string | null;
  dueno_id: number;
}

export type AppRole = "rol_veterinario" | "rol_recepcion" | "rol_admin";

export interface AplicarVacunaInput {
  mascotaId: number;
  vacunaId: number;
  veterinarioId: number;
  costoCobrado: number;
  role: AppRole;
}
