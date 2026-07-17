from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.settings import router as settings_router
from app.api.employee import router as employee_router
from app.api.attendance import router as attendance_router
from app.api.leave import router as leave_router
from app.api.payroll import router as payroll_router
from app.api.asset import router as asset_router
from app.api.dashboard import router as dashboard_router
from app.api.search import router as search_router
from app.api.report import router as report_router
from app.api.onboarding import router as onboarding_router
from app.api.workflow import router as workflow_router
from app.api.approvals import router as approvals_router
from app.api.document import router as document_router
from app.api.audit import router as audit_router
from app.api.notification import router as notification_router
from app.api.recruitment import router as recruitment_router, public_router as recruitment_public_router
from app.api.performance import router as performance_router
from app.api.ai_interview import router as ai_interview_router
from app.api.assessment_engine import router as assessment_engine_router
from app.api.lms import router as lms_router
from app.api.community import router as community_router
from app.api.helpdesk import router as helpdesk_router
from app.api.inventory import router as inventory_router
from app.api.manufacturing import router as manufacturing_router
from app.api.maintenance import router as maintenance_router
from app.api.supply_chain import router as supply_chain_router
from app.api.finance import router as finance_router
from app.api.crm import router as crm_router
from app.api.project import router as project_router
from app.api.analytics import router as analytics_router


from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter
from app.core.valkey import valkey_startup, valkey_shutdown, valkey_health
from app.core.database import verify_db_connectivity, get_migration_status
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect database and Valkey on startup, disconnect on shutdown."""
    # 1. Startup Database Verification
    try:
        db_status = verify_db_connectivity()
        logger.info(f"[Database] ✅ Connection verified. Latency: {db_status['latency_ms']}ms | Engine: {db_status['version']}")
        
        # Check migrations status
        migrations = get_migration_status()
        if migrations.get("pending_migrations") is True:
            logger.warning(f"[Database] ⚠️ Pending migrations detected! Database head is at {migrations['head_revision']}, but database schema is at {migrations['current_revision']}")
        else:
            logger.info(f"[Database] ✅ Database schema is up to date at version {migrations.get('current_revision')}")
    except Exception as exc:
        logger.critical(f"[Database] ❌ Database is unreachable: {exc}")
        raise RuntimeError(f"Database is unreachable. Startup aborted. Details: {exc}") from exc

    # 2. Startup Valkey Connection
    await valkey_startup()
    yield
    # 3. Shutdown Valkey Connection
    await valkey_shutdown()


app = FastAPI(
    title="WorkSphere ERP API",
    description="Python/FastAPI Backend for WorkSphere ERP",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── CORS Middleware ───────────────────────────────────────────────
# Normalize client URL
client_origin = settings.CLIENT_URL.rstrip('/')
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://work-sphere-erp-prod-web.vercel.app"
]
if client_origin not in allowed_origins:
    allowed_origins.append(client_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Range", "X-Content-Range"]
)

# ── Private Network Access (PNA) preflight header ──────────────
@app.middleware("http")
async def add_private_network_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = await call_next(request)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response
    return await call_next(request)

# ── Secure HTTP Headers Middleware ──────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    
    # Clickjacking protection
    response.headers["X-Frame-Options"] = "DENY"
    
    # Content Security Policy (CSP)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; "
        "connect-src 'self' ws: wss: http://localhost:5000 http://localhost:5173; "
        "object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
    )
    
    # Strict Transport Security (HSTS)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # MIME Sniffing protection
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # XSS Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # Permissions Policy
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    
    # Cache Control (sensitive data should not be cached)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    # Remove fingerprinting headers
    if "Server" in response.headers:
        del response.headers["Server"]
    if "X-Powered-By" in response.headers:
        del response.headers["X-Powered-By"]
    
    return response

# ── Health Check ─────────────────────────────────────────────────
@app.get("/", tags=["system"])
@app.head("/", tags=["system"])
async def root_check():
    return {
        "status": "ok",
        "message": "WorkSphere ERP API is running",
        "documentation": "/docs"
    }

@app.get("/health", tags=["system"])
@app.head("/health", tags=["system"])
async def health_check():
    import datetime
    valkey_status = await valkey_health()
    return {
        "status": "ok",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "datastore": valkey_status,
    }

@app.get("/health/database", tags=["system"])
def health_database():
    """Endpoint reporting detailed database connection metrics, pool status, and version."""
    try:
        status = verify_db_connectivity()
        return {
            "success": True,
            "database": "Neon PostgreSQL",
            "connected": status["connected"],
            "latencyMs": status["latency_ms"],
            "version": status["version"],
            "currentSchema": status["current_schema"],
            "connectionPool": {
                "poolSize": status["pool_size"],
                "checkedIn": status["pool_checked_in"],
                "checkedOut": status["pool_checked_out"]
            }
        }
    except Exception as exc:
        return {
            "success": False,
            "database": "Neon PostgreSQL",
            "connected": False,
            "error": str(exc)
        }

# ── API Routes ───────────────────────────────────────────────────
# Include routers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(employee_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(leave_router, prefix="/api/v1")
app.include_router(payroll_router, prefix="/api/v1")
app.include_router(asset_router, prefix="/api/v1")
app.include_router(recruitment_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(manufacturing_router, prefix="/api/v1")
app.include_router(maintenance_router, prefix="/api/v1")
app.include_router(supply_chain_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(project_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

# Include routers under /api (for compatibility with existing UI calls)
app.include_router(auth_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(employee_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(leave_router, prefix="/api")
app.include_router(payroll_router, prefix="/api")
app.include_router(asset_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(report_router, prefix="/api")
app.include_router(onboarding_router, prefix="/api")
app.include_router(workflow_router, prefix="/api")
app.include_router(approvals_router, prefix="/api")
app.include_router(document_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(recruitment_router, prefix="/api")
app.include_router(performance_router, prefix="/api/v1")
app.include_router(performance_router, prefix="/api")
app.include_router(ai_interview_router, prefix="/api/v1")
app.include_router(ai_interview_router, prefix="/api")
app.include_router(assessment_engine_router, prefix="/api/v1")
app.include_router(assessment_engine_router, prefix="/api")
app.include_router(lms_router, prefix="/api/v1")
app.include_router(lms_router, prefix="/api")
app.include_router(community_router, prefix="/api/v1")
app.include_router(community_router, prefix="/api")
app.include_router(helpdesk_router, prefix="/api/v1")
app.include_router(helpdesk_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(manufacturing_router, prefix="/api")
app.include_router(maintenance_router, prefix="/api")
app.include_router(supply_chain_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(crm_router, prefix="/api")
app.include_router(project_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

# ── Public Stats & Career Portal (no auth required) ─────────────
app.include_router(recruitment_public_router, prefix="/api")

@app.get("/api/public/stats", tags=["public"])
async def public_stats():
    """Public platform statistics for the marketing landing page."""
    return {
        "success": True,
        "data": {
            "platformUptime": 99.99,
            "totalCompanies": 10,
            "totalServices": 15,
            "totalModules": 28,
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
