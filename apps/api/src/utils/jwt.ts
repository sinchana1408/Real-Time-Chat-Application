import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

export interface TokenPayload {
  userId: string;
  username: string;
}

export function generateToken(payload: TokenPayload, expiresIn: string = env.JWT_EXPIRES_IN): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired authentication token');
  }
}
