import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  const expiresIn = env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  const expiresIn = env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
