import redis from "../config/redis.js";

export const createRateLimiter = ({
  keyPrefix,
  maxAttempts,
  windowSeconds,
}) => {
  const buildKey = (identifier) =>
    `rate-limit:${keyPrefix}:${identifier}`;

  const check = async (identifier) => {
    const key = buildKey(identifier);

    const current = await redis.get(key);

    return !current || Number(current) < maxAttempts;
  };

  const record = async (identifier) => {
    const key = buildKey(identifier);

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    return current;
  };

  return {
    check,
    record,
  };
};