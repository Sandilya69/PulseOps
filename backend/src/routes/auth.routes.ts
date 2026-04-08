// ============================================
// PulseOps CRM - Auth Routes
// ============================================

import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { signupSchema, loginSchema, refreshTokenSchema } from './schemas/auth.schemas';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/signup — Register new user + create org
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/login — Login with email/password
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh — Refresh access token
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout — Logout (invalidate session)
router.post('/logout', authenticateToken, authController.logout);

// GET /api/auth/me — Get current user
router.get('/me', authenticateToken, authController.getMe);

// POST /api/auth/google — Verify Google ID Token
router.post('/google', authController.googleOAuth);

// POST /api/auth/github — Verify GitHub Code
router.post('/github', authController.githubOAuth);

export default router;
