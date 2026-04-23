import type { PoolClient } from "pg";
import { pool } from "../database/postgres.js";
import type { AppRole, AplicarVacunaInput, MascotaBusqueda, VacunacionPendiente } from "../../domain/entities.js";
import type { VacunacionRepository } from "../../domain/ports/VacunacionRepository.js";

export class PostgresVacunacionRepository implements VacunacionRepository {
  async getVacunacionPendiente(veterinarioId: number | null, role: AppRole): Promise<VacunacionPendiente[]> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await this.setRole(client, role);
      await this.setVetContext(client, veterinarioId);

      const query = `
        SELECT
          mascota_id,
          nombre_mascota,
          especie,
          dueno_id,
          nombre_dueno,
          telefono_dueno,
          fecha_ultima_vacuna::text,
          dias_desde_ultima_vacuna,
          estado_vacunacion
        FROM v_mascotas_vacunacion_pendiente
      `;

      const result = await client.query<VacunacionPendiente>(query);
      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async buscarMascotas(query: string, veterinarioId: number | null, role: AppRole): Promise<MascotaBusqueda[]> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await this.setRole(client, role);
      await this.setVetContext(client, veterinarioId);

      const searchQuery = `
        SELECT id, nombre, especie, fecha_nacimiento::text, dueno_id
        FROM mascotas
        WHERE nombre ILIKE $1
        ORDER BY nombre ASC
        LIMIT 50
      `;

      const result = await client.query<MascotaBusqueda>(searchQuery, [`%${query}%`]);
      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async aplicarVacuna(input: AplicarVacunaInput): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await this.setRole(client, input.role);
      await this.setVetContext(client, input.veterinarioId);

      const insertQuery = `
        INSERT INTO vacunas_aplicadas (
          mascota_id,
          vacuna_id,
          veterinario_id,
          fecha_aplicacion,
          costo_cobrado
        )
        VALUES ($1, $2, $3, CURRENT_DATE, $4)
        RETURNING id
      `;

      const values = [
        input.mascotaId,
        input.vacunaId,
        input.veterinarioId,
        input.costoCobrado
      ];

      const result = await client.query<{ id: number }>(insertQuery, values);
      await client.query("COMMIT");
      return result.rows[0].id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async setVetContext(client: PoolClient, veterinarioId: number | null): Promise<void> {
    if (veterinarioId === null) {
      return;
    }

    await client.query("SELECT set_config('app.current_vet_id', $1, true)", [String(veterinarioId)]);
  }

  private async setRole(client: PoolClient, role: AppRole): Promise<void> {
    const allowedRoles: Record<AppRole, string> = {
      rol_admin: "rol_admin",
      rol_recepcion: "rol_recepcion",
      rol_veterinario: "rol_veterinario"
    };
    const safeRole = allowedRoles[role];

    const functionCheck = await client.query<{ regprocedure: string | null }>(
      "SELECT to_regprocedure('fn_set_local_role_safe(text)') AS regprocedure"
    );

    if (functionCheck.rows[0]?.regprocedure) {
      await client.query("SELECT fn_set_local_role_safe($1::text)", [role]);
      return;
    }

    const roleCheck = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists",
      [safeRole]
    );

    if (!roleCheck.rows[0]?.exists) {
      return;
    }

    await client.query(`SET LOCAL ROLE ${safeRole}`);
  }
}
