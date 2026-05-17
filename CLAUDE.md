# LandVerify — Developer Guide

> Verified Nigerian real estate. Built to last.

---

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/your-org/landverify.git
cd landverify
cp .env.example .env       # fill in your values

# 2. Start the full stack
docker compose up -d

# 3. Run migrations
docker compose exec api alembic upgrade head

# 4. Open the app
# Frontend:  http://localhost:3000
# API docs:  http://localhost:8000/docs
# pgAdmin:   connect to localhost:5432
```

---

## Architecture overview

```
landverify/
├── apps/
│   ├── web/          Next.js 14 — frontend
│   └── api/          FastAPI — backend
├── packages/
│   ├── types/        Shared TypeScript types (web ↔ any future JS service)
│   ├── utils/        Shared utilities
│   └── config/       Shared config schemas
└── infrastructure/
    ├── docker/       Docker configs and DB init
    └── nginx/        Nginx reverse proxy configs
```

**Key rule:** `packages/types` is the contract. If you change an API response shape, update the types package first, then both ends.

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SEO for property listings, server components |
| Styling | Tailwind CSS | Fast iteration, consistent design |
| Backend | FastAPI (Python 3.12) | Async performance, auto-generated docs |
| Database | PostgreSQL via Supabase | Relational for complex geo + title queries |
| Cache / PubSub | Redis | Chat pub/sub, rate limiting, sessions |
| Auth | JWT (HS256) + bcrypt | Standard, auditable |
| KYC | Smile ID | Nigerian NIN/BVN — best local coverage |
| Payments | Paystack | Dominant in Nigeria, naira-native |
| Storage | Supabase Storage | Documents + property photos |
| Email | Resend | Developer-first, reliable deliverability |
| Monitoring | Sentry | Error tracking across frontend and backend |
| WAF | Cloudflare | DDoS protection, rate limiting at edge |

---

## Code conventions

### Backend (FastAPI)
- **Routers call services. Services call models.** Never put DB queries in routers.
- Every router file has a one-liner comment at the top explaining what it owns.
- Use `async/await` everywhere — no blocking calls on the event loop.
- Never log raw NIN, BVN, passwords, or tokens. Hash before storing, redact before logging.
- Return typed Pydantic schemas — never return raw SQLAlchemy models.
- All prices stored in **Naira (integers)**. Display formatting is the frontend's job.

### Frontend (Next.js)
- Server components by default. Use `"use client"` only when you need state/effects.
- All API calls go through `src/lib/api/` — never call fetch() directly in components.
- Types come from `@landverify/types` — never define local types that duplicate them.
- Nigerian-specific data (states, LGAs, title types) lives in `src/lib/utils/nigeria-data.ts`.

### Both
- No magic strings. Use enums or constants.
- Write tests for every service function. Routers get integration tests.
- `git commit -m "feat: ..."` — use conventional commits.

---

## Nigeria-specific rules

These are not optional. They protect the business:

1. **Title type drives risk score.** C of O = low risk. Unknown = do not list. Update `TITLE_RISK` in `packages/types` if government introduces new title types.
2. **Address disclosure is gated.** Full address only shown after the agent approves the inquiry. The `address_detail` field is always redacted in list responses.
3. **Prices in Naira.** No USD display. Format with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
4. **LGA data is maintained manually.** Government LGA lists change occasionally. Source: `src/lib/utils/nigeria-data.ts`.
5. **NIN is required for agents, optional for clients.** Never make NIN required for clients — many won't have digital access.

---

## Pilot states (Phase 1)

Lagos, Abuja (FCT), Rivers, Oyo, Ogun.

All features build for these 5 states first. The data model supports all 36 — we just don't populate or market beyond the pilot until Q3.

---

## Environment variables

All variables are documented in `.env.example`. The `Settings` class in `apps/api/app/core/config.py` is the single source of truth for the backend. Never access `os.environ` directly.

---

## Database migrations

```bash
# Create a new migration after changing a model
docker compose exec api alembic revision --autogenerate -m "add field to property"

# Apply migrations
docker compose exec api alembic upgrade head

# Roll back one step
docker compose exec api alembic downgrade -1
```

---

## Running tests

```bash
# Backend
docker compose exec api pytest tests/ -v --cov=app

# Frontend
docker compose exec web npm run test
```

---

## Deployment (Production)

1. Backend → **Railway** or **Render** (FastAPI Docker image)
2. Frontend → **Vercel** (Next.js native)
3. Database → **Supabase** (managed Postgres)
4. DNS + WAF → **Cloudflare** (point to both)

Set all env vars in each platform's dashboard. Never commit `.env`.

---

## Who owns what

| Area | Owner |
|---|---|
| Product decisions | Founder |
| Backend API | Lead backend dev |
| Frontend / UX | Lead frontend dev |
| Verification logic | Domain expert + backend dev |
| Infrastructure | DevOps (later — founder for now) |

---

*Last updated: Phase 1 scaffold — May 2026*
