import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { verifyToken } from '../utils/jwt.js';
import { UnauthorizedError } from '../utils/errors.js';
import { UserSummary } from '@pulsechat/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserSummary;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or has been deactivated');
    }

    req.user = {
      ...user,
      lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };

    next();
  } catch (err) {
    next(err);
  }
}
