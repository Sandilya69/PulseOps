# PulseOps CRM - Quick Start Checklist

Do these **in order**. Check each box when done.

---

## Phase 1: Core Infrastructure (Required)

- [ ] **Install PostgreSQL** (if not installed)
  ```powershell
  winget install PostgreSQL.PostgreSQL
  ```

- [ ] **Create database**
  ```powershell
  psql -U postgres -c "CREATE DATABASE pulseops;"
  ```

- [ ] **Install Redis** (optional but recommended)
  ```powershell
  docker run -d --name redis -p 6379:6379 redis:7-alpine
  # OR: winget install Redis.Redis
  ```

---

## Phase 2: Backend Config (Required)

- [ ] **Edit `backend/.env`** - Update these 4 values:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pulseops?sslmode=disable"
  JWT_ACCESS_SECRET="change-this-to-random-32-chars"
  JWT_REFRESH_SECRET="change-this-to-random-32-chars"
  FRONTEND_URL="http://localhost:3001"
  ```

- [ ] **Install & Build Backend**
  ```powershell
  cd C:\Users\tripa\pulseOps\backend
  npm install
  npx prisma generate
  npx prisma db push
  npm run build
  ```

---

## Phase 3: Frontend Config (Required)

- [ ] **Edit `frontend/.env.local`**
  ```env
  NEXT_PUBLIC_API_URL="http://localhost:5000/api"
  ```

- [ ] **Install Frontend**
  ```powershell
  cd C:\Users\tripa\pulseOps\frontend
  npm install
  ```

---

## Phase 4: Run Both Servers (Required)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\tripa\pulseOps\backend
node dist/index.js
```
→ Should show: `✅ Database connected successfully` on **port 5000**

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\tripa\pulseOps\frontend
npm run dev
```
→ Opens on **port 3001** (3000 is usually busy)

---

## Phase 5: Verify It Works (Required)

- [ ] Open http://localhost:3001 → See landing page
- [ ] Click **Sign Up** → Create account
- [ ] Login → See **Dashboard** with metrics
- [ ] Visit `/dashboard/team` → See your user

---

## Phase 4: OAuth & Email (Optional - Do Later)

| Service | What to Add | Where |
|---------|-------------|-------|
| **Google OAuth** | Client ID/Secret | Both `.env` files |
| **GitHub OAuth** | Client ID/Secret | Both `.env` files |
| **Resend Email** | API Key | Backend `.env` only |
| **Twilio** | SID/Token/Phone | Backend `.env` only |

**Fix these 2 config issues first:**
```env
# In backend/.env - fix callback URL
GITHUB_CALLBACK_URL="http://localhost:5000/api/auth/github/callback"

# In backend/.env - match frontend port
FRONTEND_URL="http://localhost:3001"
```

---

## Quick Commands Reference

```powershell
# Kill stuck processes
taskkill /F /IM node.exe

# Restart backend after .env changes
cd backend && npm run build && node dist/index.js

# Reset database (careful!)
cd backend && npx prisma migrate reset --force

# View database
cd backend && npx prisma studio
```

---

## Minimum Working Setup = Phases 1-5 Only

Everything else (OAuth, Email, SMS, Redis) can be added later. The app works with just PostgreSQL + JWT secrets.