from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import require_permission
from app.models.user import User
import subprocess
import os
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/backup", tags=["backup"])

BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)


@router.post("/create")
async def create_backup(
    current_user: User = Depends(require_permission("manage_backup")),
    db: Session = Depends(get_db),
):
    """
    Create database backup (Admin only)
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_{timestamp}.sql"
        backup_path = BACKUP_DIR / backup_filename

        # Get database credentials from environment
        db_user = os.getenv("POSTGRES_USER", "user")
        db_name = os.getenv("POSTGRES_DB", "pegawai_db")
        db_host = os.getenv("POSTGRES_HOST", "db")
        db_port = os.getenv("POSTGRES_PORT", "5432")
        db_password = os.getenv("POSTGRES_PASSWORD", "password")

        # Create backup using pg_dump
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        cmd = [
            "pg_dump",
            "-h",
            db_host,
            "-p",
            db_port,
            "-U",
            db_user,
            "-d",
            db_name,
            "-f",
            str(backup_path),
        ]

        result = subprocess.run(
            cmd, env=env, capture_output=True, text=True, timeout=60
        )

        if result.returncode != 0:
            logger.error(f"Backup failed: {result.stderr}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Backup failed: {result.stderr}",
            )

        # Get file size
        file_size = backup_path.stat().st_size
        file_size_mb = round(file_size / (1024 * 1024), 2)

        logger.info(f"Backup created successfully: {backup_filename}")

        return {
            "message": "Backup berhasil dibuat",
            "filename": backup_filename,
            "size_mb": file_size_mb,
            "timestamp": timestamp,
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backup timeout - database terlalu besar",
        )
    except Exception as e:
        logger.error(f"Backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup error: {str(e)}",
        )


@router.get("/list")
async def list_backups(
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    List all available backups (Admin only)
    """
    try:
        backups = []
        for backup_file in sorted(BACKUP_DIR.glob("backup_*.sql"), reverse=True):
            stat = backup_file.stat()
            backups.append(
                {
                    "filename": backup_file.name,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": datetime.fromtimestamp(stat.st_mtime).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )

        return {"backups": backups}

    except Exception as e:
        logger.error(f"List backups error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}",
        )


@router.get("/download/{filename}")
async def download_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    Download backup file (Admin only)
    """
    try:
        # Validate filename to prevent directory traversal
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        return FileResponse(
            path=backup_path,
            filename=filename,
            media_type="application/sql",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download backup: {str(e)}",
        )


@router.post("/restore/{filename}")
async def restore_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
    db: Session = Depends(get_db),
):
    """
    Restore database from backup (Admin only)
    WARNING: This will overwrite current database!
    """
    try:
        # Validate filename
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        # Get database credentials
        db_user = os.getenv("POSTGRES_USER", "user")
        db_name = os.getenv("POSTGRES_DB", "pegawai_db")
        db_host = os.getenv("POSTGRES_HOST", "db")
        db_port = os.getenv("POSTGRES_PORT", "5432")
        db_password = os.getenv("POSTGRES_PASSWORD", "password")

        # Close all connections first
        db.close()

        # Restore using psql
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password

        # Drop and recreate database
        drop_cmd = [
            "psql",
            "-h",
            db_host,
            "-p",
            db_port,
            "-U",
            db_user,
            "-d",
            "postgres",
            "-c",
            f"DROP DATABASE IF EXISTS {db_name};",
        ]

        create_cmd = [
            "psql",
            "-h",
            db_host,
            "-p",
            db_port,
            "-U",
            db_user,
            "-d",
            "postgres",
            "-c",
            f"CREATE DATABASE {db_name};",
        ]

        restore_cmd = [
            "psql",
            "-h",
            db_host,
            "-p",
            db_port,
            "-U",
            db_user,
            "-d",
            db_name,
            "-f",
            str(backup_path),
        ]

        # Execute commands
        subprocess.run(drop_cmd, env=env, check=True, capture_output=True, timeout=30)
        subprocess.run(
            create_cmd, env=env, check=True, capture_output=True, timeout=30
        )
        result = subprocess.run(
            restore_cmd, env=env, capture_output=True, text=True, timeout=120
        )

        if result.returncode != 0:
            logger.error(f"Restore failed: {result.stderr}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Restore failed: {result.stderr}",
            )

        logger.info(f"Database restored successfully from: {filename}")

        return {
            "message": "Database berhasil di-restore",
            "filename": filename,
            "warning": "Aplikasi akan restart otomatis",
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Restore timeout - file backup terlalu besar",
        )
    except Exception as e:
        logger.error(f"Restore error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Restore error: {str(e)}",
        )


@router.delete("/delete/{filename}")
async def delete_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    Delete backup file (Admin only)
    """
    try:
        # Validate filename
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        backup_path.unlink()

        logger.info(f"Backup deleted: {filename}")

        return {"message": "Backup berhasil dihapus", "filename": filename}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backup: {str(e)}",
        )
