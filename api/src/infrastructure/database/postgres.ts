import { Pool } from "pg";
import { logError, logInfo } from "../../shared/logger.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://api_backend:change_me@localhost:5432/clinica_vet";

export const pool = new Pool({ connectionString });

pool.on("connect", () => {
  logInfo("[DB] PostgreSQL pool conectado");
});

pool.on("error", (err) => {
  logError("[DB] Error inesperado en PostgreSQL pool", err);
});
