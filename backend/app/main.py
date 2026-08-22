import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.database import engine, Base, check_db_connection
from app.utils.seed import seed_database

# Import all routers
from app.api.routes.auth import router as auth_router
from app.api.routes.employees import router as employees_router
from app.api.routes.attendance import router as attendance_router
from app.api.routes.leaves import router as leaves_router
from app.api.routes.payroll import router as payroll_router
from app.api.routes.documents import router as documents_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.reports import router as reports_router
from app.api.routes.audit import router as audit_router
from app.api.routes.wfh import router as wfh_router
from app.api.routes.departments import router as departments_router
from app.api.routes.settings import router as settings_router
from app.api.routes.ai_assistant import router as ai_router

# Ensure tables and seed on start safely
try:
    Base.metadata.create_all(bind=engine)
    seed_database()
except Exception as e:
    print(f"Startup DB init note: {e}")

# Ensure upload directory exists safely
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except Exception as e:
    print(f"Upload dir note: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Dayflow HRMS REST API - Every workday, perfectly aligned.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err["loc"] if loc != "body"])
        errors.append({"field": field or "body", "message": err["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors}
    )


# General Exception handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please contact the administrator."}
    )


# Include API Routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(employees_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(leaves_router, prefix=settings.API_V1_STR)
app.include_router(payroll_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(wfh_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)


@app.get(f"{settings.API_V1_STR}/health")
@app.get("/health")
def health_check():
    db_connected = check_db_connection()
    return {
        "status": "healthy",
        "database": "connected" if db_connected else "disconnected"
    }


# Frontend static files and SPA fallback
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
frontend_assets = os.path.join(frontend_dist, "assets")

if os.path.isdir(frontend_assets):
    app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")


@app.get("/{full_path:path}")
async def serve_spa_or_root(full_path: str):
    # If the requested path is a real file inside dist (e.g. favicon, images)
    if os.path.isdir(frontend_dist):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve SPA index.html
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)

    # Fallback to API status JSON
    return {
        "system": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "online",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

