"""
CivicPulse Lahore — FastAPI Backend
See it. Report it. Verify it. Resolve it.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from .config import settings
from .routers import (
    auth, categories, reports, incidents,
    department, ministry, admin, notifications, ai_routes,
)

log = structlog.get_logger()

# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="CivicPulse Lahore API",
    description="City intelligence and civic accountability platform for Lahore, Pakistan.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Idempotency-Key", "X-Internal-Key"],
)

# ── Global exception handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", path=str(request.url), error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "error": {"code": "SERVER_ERROR", "message": "An unexpected error occurred"}},
    )

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/health/ready", tags=["health"])
async def health_ready():
    return {
        "database": "mock",
        "ai_service": "ok" if settings.ai_provider != "mock" else "mock",
        "storage": "mock",
    }

# ── Register routers ──────────────────────────────────────────────────────────

PREFIX = "/api/v1"

app.include_router(auth.router,          prefix=PREFIX)
app.include_router(categories.router,    prefix=PREFIX)
app.include_router(reports.router,       prefix=PREFIX)
app.include_router(incidents.router,     prefix=PREFIX)
app.include_router(department.router,    prefix=PREFIX)
app.include_router(ministry.router,      prefix=PREFIX)
app.include_router(admin.router,         prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(ai_routes.router,     prefix=PREFIX)

log.info("civicpulse_api_started", ai_provider=settings.ai_provider, environment=settings.environment)
