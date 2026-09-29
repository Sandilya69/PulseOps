# PulseOps CRM - Security Documentation

**Version:** 2.0  
**Last Updated:** September 2026  
**Classification:** Internal - Confidential

---

## 1. Security Overview

### 1.1 Security Principles
- **Defense in Depth** - Multiple layers of security controls
- **Least Privilege** - Minimum permissions necessary
- **Zero Trust** - Verify every request, trust nothing
- **Secure by Default** - Secure configurations out of the box
- **Audit Everything** - Comprehensive logging for forensics

### 1.2 Threat Model

| Asset | Threats | Mitigations |
|-------|---------|-------------|
| **User Credentials** | Brute force, credential stuffing, phishing | Rate limiting, MFA (future), secure password policy |
| **API Tokens** | Token theft, replay attacks | Short-lived JWT, HttpOnly cookies, rotation |
| **Database** | SQL injection, data breach | Parameterized queries (Prisma), encryption at rest |
| **User Data** | PII exposure, unauthorized access | RBAC, org isolation, field-level encryption (future) |
| **Infrastructure** | DDoS, server compromise | Rate limiting, Helmet, patched dependencies |
| **Communications** | MITM, email spoofing | HTTPS/TLS, SPF/DKIM/DMARC, signed JWTs |

---

## 2. Authentication Security

### 2.1 JWT Implementation

```typescript
// backend/src/lib/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  orgId: string;
  email: string;
  role: UserRole;
  sessionId: string;  // For revocation
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'pulseops',
    audience: 'pulseops-api',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY, issuer: 'pulseops' }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!, {
    issuer: 'pulseops',
    audience: 'pulseops-api',
  }) as TokenPayload;
}
```

### 2.2 Token Storage Strategy

| Token Type | Storage | Expiry | Rotation |
|------------|---------|--------|----------|
| **Access Token** | Memory (React state) | 15 min | Auto-refresh |
| **Refresh Token** | HttpOnly Secure Cookie | 7 days | Rotate on use |

**Cookie Configuration:**
```typescript
// backend/src/middleware/auth.middleware.ts
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
});
```

### 2.3 Password Security

```typescript
// backend/src/lib/password.ts
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12;  // ~250ms per hash

export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  validatePasswordStrength(password);
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function validatePasswordStrength(password: string) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (password.length < minLength) {
    throw new Error('Password must be at least 8 characters');
  }
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }
}
```

### 2.4 Session Management

- **Session ID** stored in refresh token payload
- **Revocation list** in Redis (token blacklist)
- **Concurrent sessions** limited to 5 per user
- **Device fingerprinting** for anomaly detection (future)

### 2.5 OAuth Security

```typescript
// State parameter for CSRF protection
const oauthState = crypto.randomUUID();
res.cookie('oauth_state', oauthState, { httpOnly: true, secure: true, maxAge: 600000 });

// PKCE for public clients (mobile)
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);
```

---

## 3. Authorization (RBAC)

### 3.1 Permission Matrix

```typescript
// backend/src/lib/permissions.ts
export const PERMISSIONS: Record<string, UserRole[]> = {
  // API Management
  'api.create': ['owner', 'admin', 'member'],
  'api.read': ['owner', 'admin', 'member', 'viewer'],
  'api.update': ['owner', 'admin', 'member'],
  'api.delete': ['owner', 'admin'],
  'api.check': ['owner', 'admin', 'member'],
  
  // Incident Management
  'incident.read': ['owner', 'admin', 'member', 'viewer', 'on_call_engineer'],
  'incident.acknowledge': ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.resolve': ['owner', 'admin', 'member', 'on_call_engineer'],
  'incident.create': ['owner', 'admin', 'member'],
  'incident.delete': ['owner', 'admin'],
  
  // User Management
  'user.invite': ['owner', 'admin'],
  'user.read': ['owner', 'admin', 'member', 'viewer'],
  'user.update': ['owner', 'admin'],
  'user.delete': ['owner', 'admin'],
  'user.change_role': ['owner', 'admin'],
  
  // Organization
  'org.read': ['owner', 'admin', 'member', 'viewer'],
  'org.update': ['owner', 'admin'],
  'org.delete': ['owner'],
  'org.billing': ['owner'],
  
  // Tickets
  'ticket.create': ['owner', 'admin', 'member', 'viewer'],
  'ticket.read': ['owner', 'admin', 'member', 'viewer'],  // Own tickets
  'ticket.read_all': ['owner', 'admin'],                    // All org tickets
  'ticket.update': ['owner', 'admin'],                      // Status, assignment
  'ticket.delete': ['owner', 'admin'],
  
  // Activity Logs
  'activity.read': ['owner', 'admin', 'member', 'viewer'],
  'activity.export': ['owner', 'admin'],
  
  // Integrations
  'integration.create': ['owner', 'admin'],
  'integration.read': ['owner', 'admin', 'member'],
  'integration.update': ['owner', 'admin'],
  'integration.delete': ['owner', 'admin'],
  'integration.test': ['owner', 'admin'],
  
  // Analytics
  'analytics.read': ['owner', 'admin', 'member', 'viewer'],
  'analytics.export': ['owner', 'admin'],
  
  // Settings
  'settings.read': ['owner', 'admin', 'member', 'viewer'],
  'settings.update': ['owner', 'admin'],
  'settings.notifications': ['owner', 'admin'],
};
```

### 3.2 Middleware Enforcement

```typescript
// backend/src/middleware/rbac.middleware.ts
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user!;
    const allowedRoles = PERMISSIONS[permission];
    
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      throw new ForbiddenError(`Permission required: ${permission}`);
    }
    
    // Additional ownership checks for resource-specific permissions
    if (permission === 'ticket.read' && req.params.id) {
      return checkTicketOwnership(req, res, next);
    }
    
    next();
  };
}

// Resource ownership check
async function checkTicketOwnership(req: AuthRequest, res: Response, next: NextFunction) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) throw new NotFoundError('Ticket not found');
  
  const user = req.user!;
  const isAdmin = ['owner', 'admin'].includes(user.role);
  const isOwner = ticket.userId === user.id;
  const isAssignee = ticket.assignedTo === user.id;
  
  if (!isAdmin && !isOwner && !isAssignee) {
    throw new ForbiddenError('Access denied');
  }
  
  req.resource = ticket;
  next();
}
```

### 3.3 Database-Level Security (RLS - Future)

```sql
-- Row Level Security policies (when using Supabase directly)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tickets" ON support_tickets
  FOR SELECT USING (
    user_id = auth.uid() OR 
    assigned_to = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND org_id = support_tickets.org_id
    )
  );
```

---

## 4. Data Protection

### 4.1 Encryption

| Data | At Rest | In Transit | Notes |
|------|---------|------------|-------|
| **Passwords** | bcrypt (cost 12) | TLS 1.3 | Never logged |
| **JWT Secrets** | Environment variables | N/A | Rotated quarterly |
| **Database** | AES-256 (managed PG) | TLS 1.3 | Supabase/Neon/RDS |
| **File Storage** | AES-256 (S3-compatible) | HTTPS | Supabase Storage |
| **Email** | N/A | TLS (Resend) | - |
| **SMS/Voice** | N/A | TLS (Twilio) | - |

### 4.2 PII Handling

```typescript
// Fields containing PII
const PII_FIELDS = [
  'email', 'name', 'phone_number', 'avatar_url',
  'billing_email', 'ip_address', 'user_agent'
];

// Never log PII
logger.info('User login', { userId: user.id }); // ✅
logger.info('User login', { email: user.email }); // ❌

// Sanitize for error reporting
function sanitizeForLogging(data: any): any {
  const sanitized = { ...data };
  for (const field of PII_FIELDS) {
    if (sanitized[field]) sanitized[field] = '[REDACTED]';
  }
  return sanitized;
}
```

### 4.3 Data Retention

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| **Activity Logs** | 1 year (configurable) | Automated cleanup job |
| **API Checks** | 90 days | Automated cleanup job |
| **Incidents** | 2 years | Manual archive |
| **Tickets** | 2 years | Manual archive |
| **Notifications** | 30 days | Automated cleanup job |
| **Invitations** | 7 days (expired) | Automated cleanup job |
| **Refresh Tokens** | 7 days (expiry) | Automatic expiry |
| **User Data** | On deletion request | GDPR-compliant deletion |

### 4.4 GDPR Compliance

- **Right to Access:** `/api/auth/me` + data export endpoint
- **Right to Rectification:** Profile settings, ticket updates
- **Right to Erasure:** `DELETE /api/organizations/me` (cascades)
- **Right to Portability:** CSV export from activity, tickets, team
- **Data Processing Agreement:** Required for enterprise
- **DPO:** Designated for enterprise customers

---

## 5. Input Validation & Sanitization

### 5.1 Zod Schemas (All Inputs)

```typescript
// backend/src/lib/validations.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(10000),
  category: z.enum(['bug', 'feature_request', 'technical_support', 'billing', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

// Sanitize HTML in user content
function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, ''');
}
```

### 5.2 File Upload Security

```typescript
// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/json',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Validate file
function validateFile(file: Express.Multer.File) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  // Scan for malware (ClamAV) - future
}
```

### 5.3 Rate Limiting

```typescript
// backend/src/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

// Auth endpoints - strict
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { error: 'Too many authentication attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints - moderate
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per user
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Webhook endpoints - lenient (external services)
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.headers['x-webhook-signature'] || req.ip,
});
```

---

## 6. API Security

### 6.1 Security Headers (Helmet)

```typescript
// backend/src/app.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Next.js
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For Supabase Realtime
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 6.2 CORS Configuration

```typescript
// backend/src/app.ts
import cors from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL!,
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // For cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
}));
```

### 6.3 API Versioning & Deprecation

- Version in URL: `/api/v1/` (current implicit)
- Deprecation header: `Deprecation: true`, `Sunset: <date>`
- Minimum 6 months notice for breaking changes

---

## 7. Infrastructure Security

### 7.1 Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                    VPC / Private Network                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Backend    │  │  Database   │  │  Redis              │  │
│  │  (Private)  │  │  (Private)  │  │  (Private)          │  │
│  │  Port 5000  │  │  Port 5432  │  │  Port 6379          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           NAT Gateway / Load Balancer                │    │
│  │              (Public Ingress)                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Database Security

```sql
-- Connection pooling with PgBouncer
-- SSL required
-- No public access
-- Automated backups with encryption
-- Point-in-time recovery (PITR)

-- Read replica for analytics (future)
-- Column-level encryption for sensitive fields (future)
```

### 7.3 Container Security (Docker)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### 7.4 Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `JWT_ACCESS_SECRET` | Environment variable | Quarterly |
| `JWT_REFRESH_SECRET` | Environment variable | Quarterly |
| `DATABASE_URL` | Environment variable | On credential rotation |
| `RESEND_API_KEY` | Environment variable | On key rotation |
| `TWILIO_AUTH_TOKEN` | Environment variable | On key rotation |
| `GOOGLE_CLIENT_SECRET` | Environment variable | On key rotation |
| `GITHUB_CLIENT_SECRET` | Environment variable | On key rotation |

**Never commit secrets:**
- `.env` in `.gitignore`
- Use `.env.example` for template
- CI/CD secrets in GitHub Actions / Vercel / Railway

---

## 8. Monitoring & Incident Response

### 8.1 Security Logging

```typescript
// backend/src/lib/security-logger.ts
interface SecurityEvent {
  type: 'auth_failure' | 'auth_success' | 'permission_denied' | 'rate_limited' | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function logSecurityEvent(event: SecurityEvent) {
  // Structured logging for SIEM
  logger.warn('SECURITY_EVENT', {
    ...event,
    timestamp: new Date().toISOString(),
  });
  
  // Alert on critical events
  if (event.severity === 'critical') {
    alertSecurityTeam(event);
  }
}
```

### 8.2 Alerting Rules

| Event | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Failed logins | > 10 in 5 min from same IP | High | Block IP, alert |
| Failed logins | > 5 in 15 min for same user | Medium | Alert user |
| Permission denied | > 20 in 1 hour for user | Medium | Review access |
| Rate limit exceeded | > 5 in 1 minute | Low | Monitor |
| New admin created | Any | High | Alert owner |
| Org deleted | Any | Critical | Alert owner + audit |
| Bulk data export | Any | High | Audit log |

### 8.3 Incident Response Plan

```
1. DETECT
   ├── Automated alerts (Sentry, logs, uptime)
   └── User reports

2. TRIAGE
   ├── Assess severity (Critical/High/Medium/Low)
   ├── Identify affected systems/data
   └── Assign incident commander

3. CONTAIN
   ├── Revoke compromised tokens
   ├── Block malicious IPs
   ├── Disable affected accounts
   └── Isolate affected systems

4. ERADICATE
   ├── Root cause analysis
   ├── Patch vulnerabilities
   ├── Rotate compromised secrets
   └── Remove malicious artifacts

5. RECOVER
   ├── Restore from clean backups
   ├── Verify system integrity
   ├── Gradual traffic restoration
   └── Monitor for recurrence

6. POST-INCIDENT
   ├── Post-mortem within 48 hours
   ├── Update runbooks
   ├── Implement preventive measures
   └── Communicate to affected users
```

---

## 9. Vulnerability Management

### 9.1 Dependency Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'backend/package.json'
      - 'frontend/package.json'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm audit --audit-level=high
      - uses: snyk/actions/node@master
        with:
          command: test
          args: --severity-threshold=high

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t pulseops-backend ./backend
      - name: Scan with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'pulseops-backend'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### 9.2 Penetration Testing

- **Annual** third-party penetration test
- **Quarterly** automated scans (OWASP ZAP)
- **Continuous** SAST/DAST in CI/CD
- **Bug Bounty** program (future)

### 9.3 Vulnerability Response SLA

| Severity | Patch Timeline |
|----------|----------------|
| **Critical (CVSS 9-10)** | 24 hours |
| **High (CVSS 7-8.9)** | 72 hours |
| **Medium (CVSS 4-6.9)** | 14 days |
| **Low (CVSS 0-3.9)** | 30 days |

---

## 10. Secure Development Practices

### 10.1 Code Review Checklist

- [ ] No hardcoded secrets
- [ ] Input validation on all endpoints
- [ ] RBAC checks on all mutating operations
- [ ] Parameterized queries (Prisma)
- [ ] Proper error handling (no stack traces to client)
- [ ] Security headers present
- [ ] Rate limiting applied
- [ ] Audit logging for sensitive actions
- [ ] Dependencies updated
- [ ] Tests for security features

### 10.2 Secure Coding Standards

```typescript
// ❌ BAD - SQL injection risk
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ✅ GOOD - Parameterized via Prisma
const users = await prisma.user.findUnique({ where: { email } });

// ❌ BAD - XSS risk
return res.json({ message: `Welcome ${userInput}` });

// ✅ GOOD - Sanitized
return res.json({ message: `Welcome ${sanitizeHtml(userInput)}` });

// ❌ BAD - Information leakage
} catch (error) {
  return res.status(500).json({ error: error.message, stack: error.stack });
}

// ✅ GOOD - Generic error
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  return res.status(500).json({ error: 'Internal server error' });
}
```

### 10.3 Security Training

- Annual security training for all developers
- OWASP Top 10 awareness
- Secure code review practices
- Incident response drills

---

## 11. Compliance & Certifications

### 11.1 Current Compliance

| Standard | Status | Scope |
|----------|--------|-------|
| **SOC 2 Type II** | Planned | Infrastructure, data handling |
| **GDPR** | Compliant | EU user data |
| **CCPA** | Compliant | California user data |
| **ISO 27001** | Future | Enterprise tier |

### 11.2 Data Processing Addendum (DPA)

- Available for enterprise customers
- Standard contractual clauses for international transfers
- Sub-processor list: Supabase, Resend, Twilio, Vercel

---

## 12. Security Checklist for Releases

### Pre-Deployment
- [ ] All security tests pass in CI
- [ ] Dependency audit clean (no high/critical)
- [ ] Container scan clean
- [ ] Secrets rotated if needed
- [ ] Security headers verified
- [ ] Rate limiting configured
- [ ] RBAC tested for new features
- [ ] Audit logging implemented for new actions

### Post-Deployment
- [ ] Security monitoring active
- [ ] Error rates normal
- [ ] No anomalous traffic patterns
- [ ] Incident response team notified

---

## 13. Security Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Security Lead** | security@pulseops.com | Overall security posture |
| **Incident Commander** | incident@pulseops.com | Incident response |
| **DPO** | dpo@pulseops.com | GDPR/privacy |
| **Bug Bounty** | bounty@pulseops.com | Vulnerability reports |

---

## 14. Security References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)
- [GDPR](https://gdpr.eu/)
- [Supabase Security](https://supabase.com/security)
- [Vercel Security](https://vercel.com/security)