# CLAUDE.md

This file provides guidance for AI assistants working on the Underpace codebase.

## Project Overview

**Underpace** is a Korean sports club platform for managing running meetings, marathon events, member schedules, and admin operations. It is built with Next.js App Router, TypeScript, Tailwind CSS, and Prisma ORM.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3.4 |
| Database ORM | Prisma 6.5 |
| Database | PostgreSQL (prod), SQLite (dev) |
| Auth | Kakao OAuth 2.0 + HMAC-SHA256 sessions |
| Data fetching | SWR (client-side), async Server Components |
| Runtime | Node.js |

## Repository Structure

```
src/
├── app/
│   ├── api/               # Route handlers (API endpoints)
│   │   ├── admin/         # Admin auth: login, logout, auto-login, members
│   │   ├── auth/          # User auth: Kakao OAuth, logout, /me
│   │   ├── coach/         # Coach data endpoint
│   │   ├── marathons/     # Marathon CRUD
│   │   ├── meetings/      # Meeting CRUD + participants
│   │   ├── notices/       # Notice CRUD
│   │   ├── participants/  # Participant management
│   │   ├── profile/       # User profile update
│   │   └── schedules/     # Recurring schedule management
│   ├── admin/             # Admin pages (protected by middleware)
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── meetings/
│   │   ├── schedule/
│   │   ├── members/
│   │   └── notices/
│   ├── coach/             # Coach view (read-only participant data)
│   ├── marathon/[id]/     # Marathon detail + signup
│   ├── meeting/[id]/      # Meeting detail + signup
│   ├── profile/           # Member profile page
│   ├── schedule/          # Public schedule view
│   ├── signup/confirm/    # Post-Kakao signup confirmation
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles (Tailwind + Pretendard font)
├── components/
│   ├── admin/             # AdminLayout, DeleteMarathonButton
│   ├── meeting/           # MeetingCard, SignupForm
│   ├── marathon/          # MarathonSignupForm, MarathonRegistrationModal
│   ├── schedule/          # ScheduleView, SchedulePageContent, CalendarView
│   └── ui/               # CapacityBar, Toast, StatusBadge
├── lib/
│   ├── auth.ts            # Admin session: read/write/clear cookie
│   ├── db.ts              # Prisma singleton (global dev pattern)
│   ├── kakao.ts           # Kakao OAuth helpers
│   ├── meetingSignup.ts   # Signup window open/close logic
│   ├── schedule.ts        # Meeting generation from recurring schedules
│   ├── session.ts         # User session: HMAC-SHA256 sign/verify
│   └── types.ts           # Shared TypeScript interfaces
├── types/
│   └── kakao.d.ts         # Kakao JS SDK type declarations
└── middleware.ts          # Admin route protection (/admin/*)
prisma/
└── schema.prisma          # Database schema
```

## Development Workflow

### Setup

```bash
npm install            # installs deps + runs prisma generate (postinstall)
cp .env.example .env   # configure environment variables
npx prisma db push     # sync schema to local SQLite dev database
npm run dev            # start development server on http://localhost:3000
```

### Common Commands

```bash
npm run dev       # development server (hot reload)
npm run build     # production build
npm run start     # run production build
npm run lint      # ESLint check
npx prisma studio # open Prisma GUI for database inspection
npx prisma db push        # push schema changes (dev)
npx prisma migrate dev    # create & apply migration (production-ready)
npx prisma generate       # regenerate Prisma client after schema changes
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (or SQLite `file:./dev.db` for dev) |
| `DIRECT_URL` | Direct connection for migrations (PostgreSQL) |
| `ADMIN_PASSWORD` | Password for admin login |
| `KAKAO_CLIENT_ID` | Kakao app client ID |
| `KAKAO_CLIENT_SECRET` | Kakao app client secret (optional for some flows) |
| `KAKAO_REDIRECT_URI` | OAuth callback URL |
| `SESSION_SECRET` | Secret key for HMAC-SHA256 session signing |

## Key Conventions

### File & Naming

- **Components**: PascalCase (`MeetingCard.tsx`, `AdminLayout.tsx`)
- **Utilities/lib**: camelCase files (`meetingSignup.ts`, `session.ts`)
- **API routes**: `src/app/api/<resource>/route.ts` pattern
- **Path alias**: `@/*` maps to `src/*` — always use this, not relative paths

### React / Next.js Patterns

- **Server Components by default** — async functions that fetch data directly via Prisma
- **Client Components** are marked with `"use client"` at the top — used for interactive UI, hooks, browser APIs
- **API routes** use `NextRequest`/`NextResponse` and export named HTTP method handlers (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`)
- **Redirects** on auth failure use `redirect()` from `next/navigation` in server components or `router.push()` in client components

### Authentication & Sessions

- **User auth**: Kakao OAuth 2.0. On callback, user is upserted in DB and a signed session cookie is set.
- **Session cookie**: HMAC-SHA256 signed JSON encoded in base64, stored as `session` cookie (httpOnly)
- **Admin auth**: Simple `admin_authenticated=true` cookie set after password check
- **Middleware** (`src/middleware.ts`): Protects `/admin/*` routes by checking `admin_authenticated` cookie

### Database (Prisma)

- Import the db client from `@/lib/db` — it uses a global singleton to avoid connection pool exhaustion in dev
- Always use `await` for all Prisma queries
- After changing `schema.prisma`, run `npx prisma generate` to update the client
- Key models: `User`, `Meeting`, `Participant`, `Notice`, `Marathon`, `MarathonParticipant`, `RecurringSchedule`

### Styling (Tailwind CSS)

- Use Tailwind utility classes exclusively — no separate CSS files except `globals.css`
- Custom primary color palette is defined in `tailwind.config.ts`
- Font: **Pretendard** (Korean-optimized) loaded via CSS `@font-face` in `globals.css`
- Responsive breakpoints: `md:` for tablet/desktop adjustments (mobile-first)
- Status colors: green = approved/available, amber = pending/waitlist, red = full/closed

### TypeScript

- Strict mode is enabled — all types must be explicit
- Shared interfaces live in `src/lib/types.ts`
- Kakao SDK types are in `src/types/kakao.d.ts`
- Props interfaces are defined inline or co-located with components

### Date & Time

- Date strings use `YYYY-MM-DD` format
- Time strings use `HH:MM` format
- KST (Korea Standard Time, UTC+9) offset is handled manually where needed
- Korean day names use the `DAY_KO` array convention (e.g., `['일', '월', '화', '수', '목', '금', '토']`)

### Korean Localization

- UI text is in Korean
- Status labels are in English constants (`"PENDING"`, `"APPROVED"`, `"REJECTED"`) but displayed in Korean
- Commit messages may be in Korean or English

## Architecture Notes

### Meeting Signup Flow

1. Admin creates a `RecurringSchedule` (weekly pattern + time + capacity)
2. `src/lib/schedule.ts` generates `Meeting` records from recurring schedules
3. Members sign up via `/meeting/[id]` — creates a `Participant` record
4. Signup windows are controlled by `isSignupAvailable()` in `src/lib/meetingSignup.ts`
5. Waitlist logic: when capacity is full, participants get `status: "PENDING"`

### Role-Based Access

| Role | Access |
|------|--------|
| Guest (unauthenticated) | Public pages, schedule view |
| Member | Sign up for meetings/marathons, view profile |
| Coach | Read-only participant lists via `/coach` |
| Admin | Full CRUD on all entities via `/admin/*` |

### No Testing Infrastructure

There are currently no tests. When adding new features, consider writing unit tests for utility functions in `src/lib/`.

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Admin route protection |
| `src/lib/session.ts` | User session sign/verify |
| `src/lib/auth.ts` | Admin session helpers |
| `src/lib/db.ts` | Prisma singleton |
| `src/lib/schedule.ts` | Meeting generation logic |
| `src/lib/meetingSignup.ts` | Signup window open/close rules |
| `prisma/schema.prisma` | Full database schema |
| `tailwind.config.ts` | Custom colors and fonts |
| `.env.example` | All required environment variables |
