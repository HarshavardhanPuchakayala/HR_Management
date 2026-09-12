import redis from "../config/redis.js";

const DIRECTORY_KEY = "employee:directory";
const TTL_SECONDS = 60;

export const getCachedDirectory =
  async () => {
    try {
      const cached =
        await redis.get(DIRECTORY_KEY);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error(
        "Employee cache read error:",
        error.message
      );

      return null;
    }
  };

export const setCachedDirectory =
  async (employees) => {
    try {
      await redis.set(
        DIRECTORY_KEY,
        JSON.stringify(employees),
        "EX",
        TTL_SECONDS
      );
    } catch (error) {
      console.error(
        "Employee cache write error:",
        error.message
      );
    }
  };

export const invalidateDirectoryCache =
  async () => {
    try {
      await redis.del(DIRECTORY_KEY);
    } catch (error) {
      console.error(
        "Employee cache invalidation error:",
        error.message
      );
    }
  };