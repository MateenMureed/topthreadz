# MensWear.pk — Men's Clothing eCommerce

A production-ready, secure men's clothing eCommerce system built for the Pakistan market.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| State | Zustand (auth, cart), TanStack Query (API) |
| Backend | Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt |
| Payments | Bank Alfalah APG |
| Infra | Docker, NGINX reverse proxy |

## Quick Start (Development)

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm

### 2. Backend Setup
```bash
cd backend
cp ../.env.example .env    # Edit DATABASE_URL
npm install
npx prisma db push
npx prisma db seed         # Seeds 16 products + admin/user accounts
npm run dev                # http://localhost:5000
```

Notes:
- If Prisma `migrate dev` fails due shadow DB permission issues on local Windows PostgreSQL, use `npx prisma db push` as above.
- If frontend auto-shifts to port `3001`, ensure backend CORS includes it (current backend allows localhost local dev ports).

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

### 4. Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@menswear.pk | Admin@123 |
| User | user@test.pk | User@123 |

## Docker Deployment

```bash
docker-compose up --build
```

Access at `http://localhost` (NGINX proxies everything).

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── middleware/      # Auth, rate limit, validation, upload
│   │   ├── modules/
│   │   │   ├── auth/        # JWT auth, OTP, password reset
│   │   │   ├── user/        # Profile, addresses
│   │   │   ├── product/     # CRUD, search, recommendations
│   │   │   ├── cart/        # Cart management
│   │   │   ├── order/       # Order creation, status
│   │   │   ├── payment/     # Bank Alfalah APG
│   │   │   └── admin/       # Dashboard, audit logs
│   │   └── utils/           # Logger, Prisma, JWT, errors
│   └── prisma/              # Schema + seed data
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── services/            # API layer (Axios + interceptors)
│   └── store/               # Zustand state management
├── nginx/                   # NGINX reverse proxy config
├── docker-compose.yml
└── .env.example
```

## Security Implemented

- ✅ JWT with HTTP-only cookie refresh tokens
- ✅ bcrypt password hashing (12 salt rounds)
- ✅ Rate limiting (login, payment endpoints)
- ✅ Helmet.js secure headers
- ✅ CORS restriction
- ✅ Zod input validation
- ✅ Multer file upload with type/size restrictions
- ✅ Account locking after failed login attempts
- ✅ Server-side payment verification
- ✅ Audit logging for admin actions
- ✅ SQL injection prevention via Prisma ORM

## OAuth Support

- ✅ Google login
- ✅ Facebook login
