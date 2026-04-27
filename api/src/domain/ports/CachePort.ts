export interface CachePort {
  get(key: string): Promise<string | null>;
  setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}
