// ============================================
// PulseOps CRM - TypeScript Type Definitions
// ============================================

import { UserRole } from '@prisma/client';

// Auth types
export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    orgId: string;
    avatarUrl: string | null;
    onboardingCompleted: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Activity Log types
export interface ActivityLogInput {
  orgId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
