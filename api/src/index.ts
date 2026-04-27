import "dotenv/config";
import express from "express";
import cors from "cors";
import vacunacionRoutes from "./interfaces/http/routes/vacunacionRoutes.js";
import { redisClient } from "./infrastructure/cache/redis.js";
import { pool } from "./infrastructure/database/postgres.js";
import { logError, logInfo } from "./shared/logger.js";

const app = express();
const port = Number(process.env.PORT ?? 8080);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "vet-api", timestamp: new Date().toISOString() });
});

app.use("/api", vacunacionRoutes);

const startServer = async (): Promise<void> => {
  try {
    await redisClient.connect();

    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    app.listen(port, () => {
      logInfo(`[BOOT] API escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    logError("[BOOT] Error iniciando API", error);
    process.exit(1);
  }
};

startServer();
