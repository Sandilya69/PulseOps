// ============================================
// PulseOps CRM - JWT Utilities
// ============================================

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

interface TokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

const signOptions: SignOptions = {
  algorithm: 'HS256',
};

/**
 * Generate access + refresh token pair
 */
export function generateTokens(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    ...signOptions,
    expiresIn: ACCESS_EXPIRY as SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    ...signOptions,
    expiresIn: REFRESH_EXPIRY as SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

/**
 * Verify an access token and return decoded payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as JwtPayload & TokenPayload;
    return {
      userId: decoded.userId,
      orgId: decoded.orgId,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return decoded payload
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as JwtPayload & TokenPayload;
    return {
      userId: decoded.userId,
      orgId: decoded.orgId,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}
