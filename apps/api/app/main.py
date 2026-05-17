"""
LandVerify API â€” FastAPI application entry point.
Team conventions:
- All routers live in app/routers/
- All DB models in app/models/
- All Pydantic schemas in app/schemas/
- All business logic in app/services/
- Never put logic in routers â€” routers only call services
"""
from contextlib import asynccontextmanager
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.core.redis import init_redis, close_redis
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.routers import reviews as reviews_router
from app.routers import auth, properties, agents, verification, chat, users, reviews
from app.routers.documents import router as documents_router
from app.routers.payments import router as payments_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    await init_db()
    await init_redis()
    yield
    await close_redis()


def create_app() -> FastAPI:
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.NODE_ENV,
            traces_sample_rate=0.2,
        )

    app = FastAPI(
        title="LandVerify API",
        description="Verified Nigerian real estate platform",
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.API_DEBUG else None,
        redoc_url="/redoc" if settings.API_DEBUG else None,
        lifespan=lifespan,
    )

    # â”€â”€ Middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # â”€â”€ Routers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    API_PREFIX = "/api/v1"
    app.include_router(auth.router,         prefix=f"{API_PREFIX}/auth",         tags=["auth"])
    app.include_router(users.router,        prefix=f"{API_PREFIX}/users",        tags=["users"])
    app.include_router(properties.router,   prefix=f"{API_PREFIX}/properties",   tags=["properties"])
    app.include_router(agents.router,       prefix=f"{API_PREFIX}/agents",       tags=["agents"])
    app.include_router(verification.router, prefix=f"{API_PREFIX}/verification", tags=["verification"])
    app.include_router(chat.router,         prefix=f"{API_PREFIX}/chat",         tags=["chat"])
    app.include_router(documents_router,    prefix=f"{API_PREFIX}/documents",    tags=["documents"])
    app.include_router(reviews.router, prefix=f"{API_PREFIX}/reviews", tags=["reviews"])
    app.include_router(payments_router,     prefix=f"{API_PREFIX}/payments",     tags=["payments"])

    @app.get("/health", tags=["system"])
    async def health_check():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_app()



