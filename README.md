# Prisma V7

### Package Manger PNPM

- pnpm install
- pnpm dev
- pnpm build (tsup for production build command)
- pnpm build:tsc (for testing everything working...)
- pnpm dlx prisma generate

- `node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(64).toString('hex'));"`

---

# Backend Starter Pack

Production-focused backend starter built with **Express 5 + TypeScript + Prisma (Postgresql)**.
It includes authentication, OTP email flow, role-based access control, Redis token blacklist, Swagger docs, testing, Docker, and structured logging.

---

## Table of Contents

- [What You Get](#what-you-get)
- [Tech Stack](#tech-stack)
- [Architecture & Folder Layout](#architecture--folder-layout)
- [Quick Start (Local)](#quick-start-local)
- [Quick Start (Docker)](#quick-start-docker)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API & Swagger](#api--swagger)
- [Auth Module Guide](#auth-module-guide)
- [Request/Response Pattern](#requestresponse-pattern)
- [How to Add a New Module](#how-to-add-a-new-module)
- [Database & Prisma Notes](#database--prisma-notes)
- [Testing Guide](#testing-guide)
- [Logging Guide](#logging-guide)
- [Security Features](#security-features)
- [Troubleshooting (If You Get Stuck)](#troubleshooting-if-you-get-stuck)
- [Production Deployment Checklist](#production-deployment-checklist)

---

## What You Get

- ✅ **Production-ready middleware stack** (Helmet, CORS, HPP, request limits)
- ✅ **JWT auth + refresh token rotation**
- ✅ **Role-based authorization** (`USER`, `ADMIN`, `SUPER_ADMIN`)
- ✅ **OTP-based email verification & password reset**
- ✅ **Redis token blacklist** for logout/session invalidation
- ✅ **Prisma + schema** with auth/session tables
- ✅ **Swagger/OpenAPI docs** (non-production)
- ✅ **Jest + Supertest setup** with auth and health tests
- ✅ **Winston logging** with rotating log files
- ✅ **Docker + docker-compose** for app, Postgresql, Redis

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **ORM/Database:** Prisma + Pgsql
- **Cache/Session Utility:** Redis (`ioredis`)
- **Validation:** Zod
- **Security:** helmet, hpp, express-rate-limit, JWT
- **Docs:** swagger-jsdoc + swagger-ui-express
- **Testing:** Jest + Supertest + ts-jest
- **Logging:** Winston + daily rotate file
- **Containers:** Docker (multi-stage, hardened runtime) + docker-compose

---

## Architecture & Folder Layout

This project follows a **feature module architecture**.
Each module owns its route, validation, controller, and service layers.

```text
src/
├── app/
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── globalErrorHandler.ts
│   │   ├── validateRequest.ts
│   │   └── validateImageContent.ts
│   ├── modules/
│   │   └── Auth/
│   │       ├── auth.interface.ts
│   │       ├── auth.validation.ts
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       └── auth.route.ts
│   ├── routes/
│   │   └── index.ts
│   └── db/
│       └── seed.ts
├── config/
│   └── index.ts
├── lib/
│   ├── prisma.ts
│   ├── redisConnection.ts
│   └── swagger.ts
├── shared/
│   ├── catchAsync.ts
│   ├── sendResponse.ts
│   └── emails/
├── utils/
│   └── logger/
├── app.ts
└── server.ts
```

Request flow:

````

---

### 2) Install dependencies

```bash
npm install
````

### 3) Configure environment

```bash
cp .env.example .env
```

Then update `.env` values (at minimum):

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

### 4) Generate Prisma client and sync schema

```bash
npm run prisma:generate
npx prisma db push
```

> This project uses MongoDB. Use `prisma db push` for schema sync.

### 5) (Optional) Seed default users

```bash
npm run prisma:seed
```

Default seeded accounts:

- `superadmin@example.com / SuperAdmin@123`
- `admin@example.com / Admin@123`
- `user@example.com / User@123`

### 6) Start in development mode

```bash
npm run dev
```

### 7) Verify everything is running

- Root: `GET http://localhost:8000/`
- Health: `GET http://localhost:8000/api/v1/health`
- Swagger (dev only): `http://localhost:8000/api/docs`

---

## Quick Start (Docker)

### 1) Prepare environment file

```bash
cp .env.example .env
```

Recommended updates in `.env` for Docker usage:

- `PORT=8000`
- valid JWT secrets
- optional email credentials

### 2) Build and run all services

```bash
docker compose up --build -d
```

### 3) Check status and logs

```bash
docker compose ps
docker compose logs -f app
```

### 4) Stop services

```bash
docker compose down
```

To remove volumes as well:

```bash
docker compose down -v
```

---
