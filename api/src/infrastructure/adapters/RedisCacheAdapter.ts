import type { CachePort } from "../../domain/ports/CachePort.js";
import { redisClient } from "../cache/redis.js";

export class RedisCacheAdapter implements CachePort {
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await redisClient.setEx(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }
}
