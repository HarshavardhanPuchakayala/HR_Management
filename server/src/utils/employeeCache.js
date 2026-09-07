import redis from "../config/redis.js";

const DIRECTORY_KEY = "employee:directory";
const TTL_SECONDS = 60;

export const getCachedDirectory = async () => {
  const cached = await redis.get(DIRECTORY_KEY);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedDirectory = async (employees) => {
  await redis.set(DIRECTORY_KEY, JSON.stringify(employees), "EX", TTL_SECONDS);
};

export const invalidateDirectoryCache = async () => {
  await redis.del(DIRECTORY_KEY);
};