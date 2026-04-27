import type { PoolClient } from "pg";
import { pool } from "../database/postgres.js";
import type { AplicarVacunaInput, VacunacionPendiente } from "../../domain/entities.js";
import type { VacunacionRepository } from "../../domain/ports/VacunacionRepository.js";

export class PostgresVacunacionRepository implements VacunacionRepository {
  async getVacunacionPendiente(veterinarioId: number): Promise<VacunacionPendiente[]> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
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

  async aplicarVacuna(input: AplicarVacunaInput): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
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

  private async setVetContext(client: PoolClient, veterinarioId: number): Promise<void> {
    await client.query("SELECT set_config('app.current_vet_id', $1, true)", [String(veterinarioId)]);
  }
}
