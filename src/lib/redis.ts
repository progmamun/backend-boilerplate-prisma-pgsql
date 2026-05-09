/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, RedisClientType } from "redis";
import config from "../app/config";
import { errorlogger, logger } from "../app/utils/logger/logger";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      const redisUrl = config.redis.redis_url;

      if (redisUrl) {
        this.client = createClient({ url: redisUrl });
        logger.info(`Using Redis URL connection`);
      } else {
        const host = process.env.REDIS_HOST || "localhost";
        const port = parseInt(process.env.REDIS_PORT || "6379", 10);
        const password = process.env.REDIS_PASSWORD || undefined;

        this.client = createClient({
          socket: { host, port },
          ...(password && { password }),
        });

        logger.info(`Using Redis host: ${host}:${port}`);
      }

      // Events
      this.client.on("error", (err) => {
        errorlogger.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        logger.info("Redis Client Ready");
        this.isConnected = true;
      });

      this.client.on("end", () => {
        logger.warn("Redis Client Disconnected");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis Client Reconnecting...");
      });

      await this.client.connect();
    } catch (error) {
      errorlogger.error("Failed to connect to Redis:", error);
      this.isConnected = false;
    }
  }

  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized. Call connect() first.");
    }
    if (!this.isConnected) {
      throw new Error("Redis client not connected.");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = this.ensureConnection();
      return await client.get(key);
    } catch (error) {
      errorlogger.error(`Redis GET error for key: ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    try {
      const client = this.ensureConnection();
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);

      await client.set(key, stringValue, { EX: ttlInSeconds });

      logger.info(`Redis SET success for key: ${key}`);
    } catch (error) {
      errorlogger.error(`Redis SET error for key: ${key}`, error);
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    await this.set(key, value, ttlInSeconds);
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.ensureConnection();
      await client.del(key);

      logger.info(`Redis DELETE success for key: ${key}`);
    } catch (error) {
      errorlogger.error(`Redis DELETE error for key: ${key}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      errorlogger.error("Redis availability check failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info("Redis connection closed");
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();

const BLACKLIST_PREFIX = "blacklist:";

export const blacklistToken = async (token: string, ttlSeconds: number): Promise<void> => {
  await redisService.set(`${BLACKLIST_PREFIX}${token}`, "1", ttlSeconds);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisService.get(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
};
