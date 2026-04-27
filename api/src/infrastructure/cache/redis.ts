import { createClient } from "redis";
import { logError, logInfo } from "../../shared/logger.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisClient = createClient({ url: redisUrl });

redisClient.on("ready", () => {
  logInfo("[REDIS] Cliente listo");
});

redisClient.on("error", (err) => {
  logError("[REDIS] Error del cliente", err);
});
