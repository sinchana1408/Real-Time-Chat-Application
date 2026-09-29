import rateLimit from 'express-rate-limit';

// Standard API rate limiter
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Reasonable limit for general API endpoints
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again in a few minutes.',
  },
});

// Auth endpoints rate limiter (Login, Register, Password Reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Prevents brute force while allowing normal testing & usage
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 60, // 60 uploads per 5 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached, please wait a moment before sending more files.',
  },
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 120, // 120 searches per minute (supports snappy live debounce)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Search rate limit exceeded, please slow down.',
  },
});
