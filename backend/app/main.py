from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.exc import OperationalError
from app.database import init_db
from app.routers import upload, compare, template, admin, archive, update, auth, landing
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Employee Data Comparison API",
    description="API for comparing monthly employee data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for VPS deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if not exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "landing").mkdir(exist_ok=True)


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors (HTTP 400).
    Returns detailed validation error messages.
    """
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


@app.exception_handler(OperationalError)
async def database_exception_handler(request: Request, exc: OperationalError):
    """
    Handle database connection failures (HTTP 503).
    """
    logger.error(f"Database connection error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Database Error",
            "message": "Unable to connect to database. Please try again later."
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle internal errors (HTTP 500).
    Does not expose internal implementation details.
    """
    logger.error(f"Internal server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later."
        }
    )


# Include routers
app.include_router(auth.router)
app.include_router(landing.router)
app.include_router(upload.router)
app.include_router(compare.router)
app.include_router(template.router)
app.include_router(admin.router)
app.include_router(archive.router)
app.include_router(update.router)


@app.on_event("startup")
async def startup_event():
    """
    Initialize database on application startup.
    Creates all tables if they don't exist.
    """
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


@app.get("/")
async def root():
    """
    Root endpoint for health check.
    """
    return {"message": "Employee Data Comparison API", "status": "running"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}


@app.get("/uploads/{folder}/{filename}")
async def serve_upload(folder: str, filename: str):
    """
    Serve uploaded files with CORS headers.
    """
    file_path = UPLOAD_DIR / folder / filename
    if not file_path.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "File not found"}
        )
    return FileResponse(file_path)
