// src/utils/rateLimiter.ts
import rateLimit from "express-rate-limit";

export const createRateLimiter = (
  windowMinutes: number,
  maxRequests: number
) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  });
};

// Pre-configured limiters for common use cases
export const authLimiter = createRateLimiter(15, 5); // 5 requests per 15 minutes (strict)
export const standardApiLimiter = createRateLimiter(15, 100); // 100 requests per 15 minutes (standard)
export const publicApiLimiter = createRateLimiter(15, 200); // 200 requests per 15 minutes (lenient)
