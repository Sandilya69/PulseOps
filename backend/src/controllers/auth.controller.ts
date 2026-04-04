// ============================================
// PulseOps CRM - Auth Controller
// ============================================

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler.middleware';

/**
 * POST /api/auth/signup
 * Register a new user and create their default organization
 */
export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, organizationName } = req.body;
    const result = await authService.signup({ name, email, password, organizationName });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh an expired access token
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Logout the current user
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // In a stateful system you'd invalidate the token here.
    // With JWT we rely on token expiry; this logs the action.
    await authService.logout(req.user!.id, req.user!.orgId);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);

    if (!user) {
      throw ApiError.notFound('User');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
