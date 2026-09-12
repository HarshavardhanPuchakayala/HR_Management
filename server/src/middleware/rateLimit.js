import redis from "../config/redis.js";

export const createRateLimiter = ({
  keyPrefix,
  maxAttempts,
  windowSeconds,
}) => {
  const buildKey = (identifier) =>
    `rate-limit:${keyPrefix}:${String(
      identifier
    )}`;

  const check = async (identifier) => {
    try {
      const key = buildKey(identifier);
      const current = await redis.get(key);

      return (
        !current ||
        Number(current) < maxAttempts
      );
    } catch (error) {
      console.error(
        "Rate limiter check error:",
        error.message
      );

      // Fail open if Redis is temporarily unavailable.
      return true;
    }
  };

  const record = async (identifier) => {
    try {
      const key = buildKey(identifier);

      const current =
        await redis.incr(key);

      if (current === 1) {
        await redis.expire(
          key,
          windowSeconds
        );
      }

      return current;
    } catch (error) {
      console.error(
        "Rate limiter record error:",
        error.message
      );

      return null;
    }
  };

  return {
    check,
    record,
  };
};