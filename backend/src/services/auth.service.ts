// ============================================
// PulseOps CRM - Auth Service
// ============================================

import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateUniqueSlug } from '../utils/slug';
import { OAuth2Client } from 'google-auth-library';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateUniqueSlug } from '../utils/slug';
import axios from 'axios';
import { ApiError } from '../middleware/errorHandler.middleware';
import { activityLogService } from './activityLog.service';

interface SignupParams {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

/**
 * Register a new user + auto-create organization
 */
export async function signup({ name, email, password, organizationName }: SignupParams) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  const orgName = organizationName || `${name}'s Organization`;
  const orgSlug = generateUniqueSlug(orgName);

  // Create organization + user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create organization (placeholder owner ID — will update after user creation)
    const org = await tx.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        ownerId: '00000000-0000-0000-0000-000000000000', // Temporary — updated below
      },
    });

    // 2. Create user as owner
    const user = await tx.user.create({
      data: {
        orgId: org.id,
        email,
        name,
        passwordHash: hashedPassword,
        role: 'owner',
      },
    });

    // 3. Update org with real owner ID
    await tx.organization.update({
      where: { id: org.id },
      data: { ownerId: user.id },
    });

    // 4. Create default notification preferences
    await tx.notificationPreference.create({
      data: { userId: user.id },
    });

    return { user, org };
  });

  // Generate JWT tokens
  const tokens = generateTokens({
    userId: result.user.id,
    orgId: result.org.id,
    role: result.user.role,
  });

  // Log activity (fire-and-forget)
  activityLogService.log({
    orgId: result.org.id,
    userId: result.user.id,
    action: 'user.signup',
    resourceType: 'user',
    resourceId: result.user.id,
    resourceName: result.user.name,
  }).catch(() => {});

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      orgId: result.org.id,
      avatarUrl: result.user.avatarUrl,
      onboardingCompleted: result.user.onboardingCompleted,
    },
    organization: {
      id: result.org.id,
      name: result.org.name,
      slug: result.org.slug,
    },
    tokens,
  };
}

/**
 * Login with email and password
 */
export async function login({ email, password }: LoginParams) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated. Contact your admin.');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastActiveAt: new Date() },
  });

  const tokens = generateTokens({
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  });

  // Log activity (fire-and-forget)
  activityLogService.log({
    orgId: user.orgId,
    userId: user.id,
    action: 'user.login',
    resourceType: 'user',
    resourceId: user.id,
    resourceName: user.name,
  }).catch(() => {});

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      avatarUrl: user.avatarUrl,
      onboardingCompleted: user.onboardingCompleted,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
      subscriptionTier: user.organization.subscriptionTier,
    },
    tokens,
  };
}

/**
 * Refresh access token using a valid refresh token
 */
export async function refreshToken(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User account is not available');
  }

  // Generate new token pair
  const tokens = generateTokens({
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  });

  return tokens;
}

/**
 * Logout — log the action
 */
export async function logout(userId: string, orgId: string) {
  activityLogService.log({
    orgId,
    userId,
    action: 'user.logout',
    resourceType: 'user',
    resourceId: userId,
  }).catch(() => {});
}

/**
 * Get current user's full profile
 */
export async function getMe(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      orgId: true,
      avatarUrl: true,
      phoneNumber: true,
      timezone: true,
      isActive: true,
      lastLoginAt: true,
      lastActiveAt: true,
      onboardingCompleted: true,
      notificationSettings: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          logoUrl: true,
        },
      },
    },
  });
}

export async function googleOAuth(accessToken: string) {
  const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!data || !data.email) throw ApiError.badRequest('Invalid Google Token');
  
  const { email, name, picture } = data;
  let user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true }
  });

  if (!user) {
    const orgName = `${name || 'User'}'s Workspace`;
    const orgSlug = generateUniqueSlug(orgName);
    
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          ownerId: '00000000-0000-0000-0000-000000000000',
        },
      });
      const newUser = await tx.user.create({
        data: {
          orgId: org.id,
          email,
          name: name || 'Google User',
          passwordHash: 'oauth_no_password',
          avatarUrl: picture,
          role: 'owner',
        },
        include: { organization: true }
      });
      await tx.organization.update({
        where: { id: org.id },
        data: { ownerId: newUser.id },
      });
      await tx.notificationPreference.create({
        data: { userId: newUser.id },
      });
      return { user: newUser, org };
    });
    user = result.user;
  }

  const tokens = generateTokens({
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  });

  activityLogService.log({
    orgId: user.orgId,
    userId: user.id,
    action: 'user.oauth_login',
    resourceType: 'user',
    resourceId: user.id,
  }).catch(() => {});

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      avatarUrl: user.avatarUrl,
      onboardingCompleted: user.onboardingCompleted,
    },
    organization: {
      id: user.organization!.id,
      name: user.organization!.name,
      slug: user.organization!.slug,
    },
    tokens,
  };
}

export async function githubOAuth(code: string) {
  const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: 'http://localhost:3000/auth/github/callback',
    code,
  }, { headers: { Accept: 'application/json' } });

  const { access_token } = tokenResponse.data;
  if (!access_token) throw ApiError.badRequest('Failed to authenticate with GitHub');

  const userResponse = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  
  const emailResponse = await axios.get('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  
  const primaryEmailObj = emailResponse.data.find((e: any) => e.primary);
  const email = primaryEmailObj?.email || userResponse.data.email;
  
  if (!email) throw ApiError.badRequest('GitHub account has no public email');

  const name = userResponse.data.name || userResponse.data.login;
  const picture = userResponse.data.avatar_url;

  let user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true }
  });

  if (!user) {
    const orgName = `${name || 'User'}'s Workspace`;
    const orgSlug = generateUniqueSlug(orgName);
    
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: orgName, slug: orgSlug, ownerId: '00000000-0000-0000-0000-000000000000' },
      });
      const newUser = await tx.user.create({
        data: {
          orgId: org.id, name, email, avatarUrl: picture, passwordHash: 'oauth_github_no_password', role: 'owner'
        },
        include: { organization: true }
      });
      await tx.organization.update({ where: { id: org.id }, data: { ownerId: newUser.id }});
      await tx.notificationPreference.create({ data: { userId: newUser.id }});
      return { user: newUser, org };
    });
    user = result.user;
  }

  const tokens = generateTokens({ userId: user.id, orgId: user.orgId, role: user.role });
  activityLogService.log({ orgId: user.orgId, userId: user.id, action: 'user.oauth_login', resourceType: 'user', resourceId: user.id }).catch(() => {});

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId, avatarUrl: user.avatarUrl, onboardingCompleted: user.onboardingCompleted },
    organization: { id: user.organization!.id, name: user.organization!.name, slug: user.organization!.slug },
    tokens,
  };
}
