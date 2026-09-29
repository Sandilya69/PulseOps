# PulseOps CRM - Manual Setup Guide

Complete step-by-step guide to set up and run the PulseOps CRM platform locally.

---

## 📋 Prerequisites

### Required Software

| Tool                 | Version | Install Command                                              |
| -------------------- | ------- | ------------------------------------------------------------ |
| **Node.js**    | 18+     | `winget install OpenJS.NodeJS` or download from nodejs.org |
| **PostgreSQL** | 14+     | `winget install PostgreSQL.PostgreSQL` or Docker           |
| **Redis**      | 7+      | `winget install Redis.Redis` or Docker                     |
| **Git**        | Latest  | `winget install Git.Git`                                   |

### Verify Installation

```powershell
node --version      # v18.x.x
npm --version       # 9.x.x
psql --version      # 14.x or 15.x
redis-cli --version # 7.x.x (optional)
```

---

## 🗄️ Database Setup

### Option A: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** (if not installed)

   ```powershell
   winget install PostgreSQL.PostgreSQL
   ```
2. **Create database and user**

   ```powershell
   # Open PostgreSQL shell
   psql -U postgres

   # In psql shell:
   CREATE DATABASE pulseops;
   CREATE USER pulseops_user WITH ENCRYPTED PASSWORD 'pulseops_password';
   GRANT ALL PRIVILEGES ON DATABASE pulseops TO pulseops_user;
   \q
   ```
3. **Test connection**

   ```powershell
   psql -U pulseops_user -d pulseops -c "SELECT version();"
   ```

### Option B: Docker (Easiest)

```powershell
# PostgreSQL
docker run -d --name postgres-pulseops `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=pulseops `
  -p 5432:5432 `
  postgres:16

# Redis (for rate limiting, real-time features)
docker run -d --name redis-pulseops `
  -p 6379:6379 `
  redis:7-alpine
```

---

## ⚙️ Environment Configuration

### Backend Environment (.env)

```powershell
# Navigate to backend
cd C:\Users\tripa\pulseOps\backend

# Copy example if needed
copy .env.example .env
```

**Edit `backend/.env` with your values:**

```env
# ============================================
# Server
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# Database (PostgreSQL)
# ============================================
# Local PostgreSQL (Option A)
DATABASE_URL="postgresql://pulseops_user:pulseops_password@localhost:5432/pulseops?sslmode=disable"

# Or Docker PostgreSQL (Option B)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pulseops?sslmode=disable"

# ============================================
# Redis (Optional - for rate limiting, real-time)
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# JWT Secrets (CHANGE IN PRODUCTION!)
# ============================================
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# ============================================
# Email (Resend) - Get API key from resend.com
# ============================================
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# ============================================
# Frontend URL (CORS + Email Links)
# ============================================
FRONTEND_URL="http://localhost:3001"

# ============================================
# Google OAuth (Google Cloud Console)
# ============================================
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# ============================================
# GitHub OAuth (GitHub Developer Settings)
# ============================================
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_CALLBACK_URL="http://localhost:5000/api/auth/github/callback"

# ============================================
# Twilio (Optional - SMS/WhatsApp/Voice)
# Get from console.twilio.com
# ============================================
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="+1234567890"
```

### Frontend Environment (.env.local)

```powershell
# Navigate to frontend
cd C:\Users\tripa\pulseOps\frontend

# Create .env.local
```

**Edit `frontend/.env.local`:**

```env
# Google OAuth (same as backend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# GitHub OAuth (same as backend)
NEXT_PUBLIC_GITHUB_CLIENT_ID="your-github-client-id"

# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

---

## 🔐 Third-Party Service Setup

### 1. Resend (Email)

1. Go to [resend.com](https://resend.com) → Sign up
2. **Domains** → Add your domain → Verify DNS records
3. **API Keys** → Create API Key → Copy key
4. Update `RESEND_API_KEY` in backend `.env`
5. Update `FROM_EMAIL` with verified domain email

**For local testing:** Use `onboarding@resend.dev` (Resend's test domain)

### 2. Google OAuth (SSO)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth Client ID** → Web Application
4. **Authorized redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. Copy **Client ID** and **Client Secret**
6. Update both backend `.env` and frontend `.env.local`

### 3. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. **New OAuth App** → Fill details:
   ```
   Homepage URL: http://localhost:3001
   Authorization callback URL: http://localhost:5000/api/auth/github/callback
   ```
3. Copy **Client ID** and generate **Client Secret**
4. Update both backend `.env` and frontend `.env.local`

### 4. Twilio (Optional - SMS/WhatsApp/Voice)

1. Go to [Twilio Console](https://console.twilio.com)
2. Copy **Account SID** and **Auth Token**
3. **Phone Numbers** → Buy a number → Copy **Phone Number**
4. **WhatsApp** → Messaging → Try WhatsApp → Verify your number
5. Update backend `.env`

**Note:** WhatsApp requires verified sender in Twilio Console. Voice calls require TwiML App or webhook.

---

## 🚀 Application Setup

### 1. Install Backend Dependencies

```powershell
cd C:\Users\tripa\pulseOps\backend
npm install
```

### 2. Generate Prisma Client & Push Schema

```powershell
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: Open Prisma Studio to verify
npx prisma studio
```

### 3. Build Backend

```powershell
npm run build
```

### 4. Install Frontend Dependencies

```powershell
cd C:\Users\tripa\pulseOps\frontend
npm install
```

### 5. Build Frontend (Optional - for production test)

```powershell
npm run build
```

---

## ▶️ Running the Application

### Terminal 1: Backend

```powershell
cd C:\Users\tripa\pulseOps\backend
npm run dev
# or for production build:
# node dist/index.js
```

**Expected output:**

```
✅ Database connected successfully
╔═════════════════════════════════════════════╗
║        🚀 PulseOps CRM Backend             ║
║  Server:    http://localhost:5000            ║
║  Health:    http://localhost:5000/api/health ║
╚═════════════════════════════════════════════╝
```

### Terminal 2: Frontend

```powershell
cd C:\Users\tripa\pulseOps\frontend
npm run dev
```

**Expected output:**

```
▲ Next.js 16.2.2
- Local:         http://localhost:3001
- Network:       http://192.168.x.x:3001
✓ Ready in 2.5s
```

### Terminal 3: Redis (Optional)

```powershell
# If using Docker
docker start redis-pulseops

# Or if installed locally
redis-server
```

---

## ✅ Verification Checklist

### Health Checks

```powershell
# Backend health
Invoke-WebRequest http://localhost:5000/api/health | Select-Object -ExpandProperty Content

# Frontend
# Open http://localhost:3001 in browser
```

### Expected Responses

**Backend Health:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

**Frontend:** Landing page with "PulseOps" logo, Sign Up/Login buttons

---

## 🧪 Testing the Flow

### 1. Sign Up (Creates Organization + User)

```powershell
# Via API
Invoke-WebRequest -Method POST -Uri http://localhost:5000/api/auth/signup `
  -ContentType "application/json" `
  -Body '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Or via UI: http://localhost:3001/signup
```

### 2. Login

```powershell
# Via API
$login = Invoke-WebRequest -Method POST -Uri http://localhost:5000/api/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","password":"password123"}'
$login.Content | ConvertFrom-Json

# Save access token for authenticated requests
$token = ($login.Content | ConvertFrom-Json).data.tokens.accessToken
```

### 3. Test Authenticated Endpoints

```powershell
# Get current user
Invoke-WebRequest -Uri http://localhost:5000/api/auth/me `
  -Headers @{ Authorization = "Bearer $token" }

# Create team member invitation
Invoke-WebRequest -Method POST -Uri http://localhost:5000/api/organizations/<ORG_ID>/invitations `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{"email":"colleague@example.com","role":"member"}'
```

### 4. Test OAuth Flows

1. Open http://localhost:3001/login
2. Click "Sign in with Google" → Should redirect to Google → Return to dashboard
3. Click "Sign in with GitHub" → Should redirect to GitHub → Return to dashboard

### 5. Test Email (Resend)

1. Check backend console for `[MOCK EMAIL]` or `📧 Email sent`
2. If using real Resend key, check email inbox

### 6. Test Twilio (if configured)

1. Check backend console for `[MOCK WHATSAPP]` / `[MOCK VOICE CALL]` or `💬` / `📞`
2. Real messages appear in Twilio Console → Logs

---

## 🔧 Common Issues & Fixes

| Issue                                                       | Solution                                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `P1001: Can't reach database server`                      | PostgreSQL not running. Start service:`net start postgresql-x64-16` or `docker start postgres-pulseops` |
| `EADDRINUSE: address already in use :::5000`              | Kill existing process:`taskkill /F /IM node.exe`                                                          |
| `Port 3000 in use, using 3001`                            | Normal - frontend auto-switches. Use http://localhost:3001                                                  |
| `Module '"lucide-react"' has no exported member 'Github'` | Use`GitHub` (capital H) or inline SVG                                                                     |
| `Type error: req.params.token`                            | Cast:`req.params.token as string`                                                                         |
| Google OAuth redirect mismatch                              | Ensure`GOOGLE_CALLBACK_URL` matches Google Cloud Console exactly                                          |
| GitHub OAuth callback error                                 | Ensure`GITHUB_CALLBACK_URL` = `http://localhost:5000/api/auth/github/callback`                          |
| CORS error                                                  | Verify`FRONTEND_URL` in backend `.env` matches frontend port                                            |
| Prisma schema out of sync                                   | Run`npx prisma db push` after schema changes                                                              |

---

## 📁 Project Structure

```
pulseOps/
├── backend/
│   ├── prisma/schema.prisma      # Database schema
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── app.ts                # Express setup
│   │   ├── controllers/          # Route handlers
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Auth, RBAC, errors
│   │   ├── routes/               # API routes
│   │   ├── lib/                  # Prisma, permissions
│   │   └── utils/                # JWT, hash, slug
│   ├── .env                      # Backend config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── dashboard/        # Protected dashboard pages
│   │   │   ├── login/            # Login page
│   │   │   ├── signup/           # Signup page
│   │   │   └── auth/             # OAuth callbacks
│   │   ├── components/           # Reusable UI components
│   │   ├── store/                # Zustand state
│   │   └── lib/                  # Axios, utils
│   ├── .env.local                # Frontend config
│   └── package.json
└── SETUP.md                      # This file
```

---

## 🎯 Dashboard Features Available

| Page                    | URL                          | Features                                                |
| ----------------------- | ---------------------------- | ------------------------------------------------------- |
| **Dashboard**     | `/dashboard`               | Real-time metrics, uptime, latency, alerts              |
| **Team**          | `/dashboard/team`          | Members, roles, invite, activate/deactivate, CSV export |
| **Invitations**   | `/dashboard/invitations`   | Pending/accepted/expired, copy link, revoke             |
| **Tickets**       | `/dashboard/tickets`       | Create, view, threaded messages, status workflow        |
| **Activity**      | `/dashboard/activity`      | Audit log, filters, search, changes diff, CSV export    |
| **Incidents**     | `/dashboard/incidents`     | Timeline, notes, MTTA/MTTR, status updates              |
| **APIs**          | `/dashboard/apis`          | CRUD, health checks, pause/resume, delete               |
| **Settings**      | `/dashboard/settings`      | Org info, billing, danger zone (delete org)             |
| **Profile**       | `/dashboard/profile`       | Profile, notifications, security (password)             |
| **Notifications** | `/dashboard/notifications` | In-app notifications, mark read                         |

---

## 🔄 Development Workflow

### Making Changes

1. **Backend changes:**

   ```powershell
   cd backend
   npm run dev          # Auto-reloads with tsx watch
   # OR after edits:
   npm run build && node dist/index.js
   ```
2. **Frontend changes:**

   ```powershell
   cd frontend
   npm run dev          # Hot reload via Turbopack
   ```
3. **Database schema changes:**

   ```powershell
   cd backend
   # Edit prisma/schema.prisma
   npx prisma db push
   npx prisma generate
   ```

### Running Tests

```powershell
# Backend
cd backend
npm run test           # Vitest

# Frontend
cd frontend
npm run lint           # ESLint
npm run build          # TypeScript check
```

---

## 🚀 Production Deployment Checklist

- [ ] Change all JWT secrets to strong random strings
- [ ] Use production PostgreSQL (managed: Supabase, Neon, RDS)
- [ ] Use production Redis (Upstash, Redis Cloud)
- [ ] Set `NODE_ENV=production`
- [ ] Configure real Resend domain + API key
- [ ] Configure production OAuth redirect URLs
- [ ] Set up Twilio production numbers
- [ ] Enable HTTPS (reverse proxy: Nginx/Traefik)
- [ ] Set secure CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Run `npm run build` for both frontend/backend
- [ ] Use PM2 or Docker for process management

---

## 📞 Support Commands Quick Reference

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Restart PostgreSQL
net stop postgresql-x64-16 && net start postgresql-x64-16

# View Prisma Studio
cd backend && npx prisma studio

# Reset database (DANGEROUS - deletes all data)
cd backend && npx prisma migrate reset --force

# View logs
# Backend: terminal output
# Frontend: browser DevTools console

# Check ports
netstat -ano | findstr 5000
netstat -ano | findstr 3001
```

---

## 📚 Key Files to Know

| File                                          | Purpose                           |
| --------------------------------------------- | --------------------------------- |
| `backend/prisma/schema.prisma`              | Complete database schema          |
| `backend/src/lib/permissions.ts`            | RBAC permission matrix            |
| `backend/src/middleware/rbac.middleware.ts` | Authorization middleware          |
| `frontend/src/store/authStore.ts`           | Authentication state              |
| `frontend/src/lib/axios.ts`                 | API client with token interceptor |
| `frontend/src/components/Providers.tsx`     | OAuth providers wrapper           |

---

**Last Updated:** 2026-08-16
**Project Version:** PulseOps CRM v2.0
**Document Version:** 1.0
